import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface RoomMember {
    user_id: string
    online_at: string
}

export interface RoomPresenceState {
    members: RoomMember[]
    memberCount: number
    isJoined: boolean
    lastSessionId: string | null
    /** Set when the realtime presence channel itself failed after joining — membership and the reading session are still live, but who's-here may be stale. */
    presenceError: boolean
    joinRoom: (bookId?: string | null) => Promise<void>
    leaveRoom: () => Promise<void>
}

/**
 * Tracks live presence for a room (via Realtime) and the underlying
 * reading_session lifecycle (start / heartbeat / end) for analytics.
 *
 * Mount this in your room screen. It does NOT auto-join — call joinRoom()
 * from a button so the user explicitly opts in, and it auto-leaves on
 * unmount as a best effort (the server-side cron job is the real safety net
 * for crashes / killed tabs).
 */
export function useRoomPresence(roomId: string, userId: string | undefined): RoomPresenceState {
    const [members, setMembers] = useState<RoomMember[]>([])
    const [isJoined, setIsJoined] = useState(false)
    const [lastSessionId, setLastSessionId] = useState<string | null>(null)
    const [presenceError, setPresenceError] = useState(false)

    const channelRef = useRef<RealtimeChannel | null>(null)
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const sessionIdRef = useRef<string | null>(null)
    const joiningRef = useRef(false)

    const syncPresence = useCallback(() => {
        const channel = channelRef.current
        if (!channel) return

        const state = channel.presenceState<RoomMember>()
        setMembers(Object.values(state).flat())
    }, [])

    const joinRoom = useCallback(async (bookId?: string | null) => {
        // `isJoined` is state, so two calls in the same tick both read false —
        // guard on a ref as well, or we open two channels for one room.
        if (!userId || isJoined || joiningRef.current || channelRef.current) return
        joiningRef.current = true

        try {
            const { error: memberError } = await supabase
                .from('room_members')
                .upsert(
                    // joined_at is deliberately omitted: the column defaults to
                    // now() on insert, and leaving it out means re-entering a
                    // room you are already in does not reset when you joined —
                    // which was restarting the session timer from zero.
                    { room_id: roomId, user_id: userId, book_id: bookId ?? null },
                    { onConflict: 'room_id,user_id' }
                )

            if (memberError) throw memberError

            const { data: session, error: sessionError } = await supabase
                .rpc('start_reading_session', { p_room_id: roomId, p_user_id: userId })
                .single()
            if (sessionError) throw sessionError
            sessionIdRef.current = (session as { id: string }).id

            // supabase.channel() hands back an existing channel for the same
            // topic rather than creating a second one, and .on() throws once a
            // channel has been subscribed. Leaving the room screen does not
            // leave the room (the membership row is kept on purpose), so a
            // live channel from an earlier visit can still be registered —
            // drop it before building a fresh one.
            const stale = supabase.getChannels().find((c) => c.topic === `realtime:room:${roomId}`)
            if (stale) await supabase.removeChannel(stale)

            const channel = supabase.channel(`room:${roomId}`, {
                config: { presence: { key: userId } },
            })

            // Set before subscribing: syncPresence reads the channel off this
            // ref, and a 'sync' event can arrive before subscribe() returns.
            channelRef.current = channel

            channel
                .on('presence', { event: 'sync' }, syncPresence)
                .on('presence', { event: 'join' }, syncPresence)
                .on('presence', { event: 'leave' }, syncPresence)
                .subscribe(async (status, err) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({ user_id: userId, online_at: new Date().toISOString() })
                        setPresenceError(false)
                    } else if (err) {
                        console.error('Room presence channel error:', err)
                        setPresenceError(true)
                    }
                })

            heartbeatRef.current = setInterval(() => {
                if (sessionIdRef.current) {
                    supabase.rpc('heartbeat_reading_session', { p_session_id: sessionIdRef.current })
                }
            }, 30_000)

            setIsJoined(true)
        } finally {
            joiningRef.current = false
        }
    }, [roomId, userId, isJoined, syncPresence])

    const leaveRoom = useCallback(async () => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current)
        heartbeatRef.current = null

        if (sessionIdRef.current) {
            setLastSessionId(sessionIdRef.current)
            await supabase.rpc('end_reading_session', { p_session_id: sessionIdRef.current })
            sessionIdRef.current = null
        }

        await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', userId)

        const channel = channelRef.current
        if (channel) {
            await channel.untrack()
            await supabase.removeChannel(channel)
            channelRef.current = null
        }

        setMembers([])
        setIsJoined(false)
        setPresenceError(false)
    }, [roomId, userId])

    // Release client-side resources when the room screen unmounts. This is
    // deliberately not a leaveRoom(): the membership row and reading session
    // stay open so the user is still in the room while browsing elsewhere,
    // and presence is re-established on the next visit. Without this the
    // timers keep firing forever and the subscribed channel is left behind,
    // which makes the next joinRoom() throw on .on().
    useEffect(() => {
        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current)
            heartbeatRef.current = null

            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
    }, [])

    return {
        members,
        memberCount: members.length,
        isJoined,
        lastSessionId,
        presenceError,
        joinRoom,
        leaveRoom,
    }
}
