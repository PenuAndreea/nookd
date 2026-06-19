import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useRef, useState } from 'react';

export interface RoomMember {
    user_id: string
    online_at: string
}

export interface RoomPresenceState {
    members: RoomMember[]
    memberCount: number
    isJoined: boolean
    elapsedSeconds: number
    joinRoom: () => Promise<void>
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
export function useRoomPresence(roomId: string, userId: string): RoomPresenceState {
    const [members, setMembers] = useState<RoomMember[]>([])
    const [isJoined, setIsJoined] = useState(false)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    const channelRef = useRef<RealtimeChannel | null>(null)
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const sessionIdRef = useRef<string | null>(null)
    const joinedAtRef = useRef<number | null>(null)

    const syncPresence = useCallback(() => {
        const channel = channelRef.current
        if (!channel) return
        const state = channel.presenceState<RoomMember>()
        const flat = Object.values(state).flatMap((entries) => entries.map((e) => e))
        setMembers(flat)
    }, [])

    const joinRoom = useCallback(async () => {
        if (isJoined) return

        const { error: memberError } = await supabase
            .from('room_members')
            .upsert({ room_id: roomId, user_id: userId, joined_at: new Date().toISOString() })
        if (memberError) throw memberError

        const { data: session, error: sessionError } = await supabase
            .rpc('start_reading_session', { p_room_id: roomId, p_user_id: userId })
            .single()
        if (sessionError) throw sessionError
        sessionIdRef.current = (session as { id: string }).id

        const channel = supabase.channel(`room:${roomId}`, {
            config: { presence: { key: userId } },
        })

        channel
            .on('presence', { event: 'sync' }, syncPresence)
            .on('presence', { event: 'join' }, syncPresence)
            .on('presence', { event: 'leave' }, syncPresence)
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ user_id: userId, online_at: new Date().toISOString() })
                }
            })

        channelRef.current = channel

        heartbeatRef.current = setInterval(() => {
            if (sessionIdRef.current) {
                supabase.rpc('heartbeat_reading_session', { p_session_id: sessionIdRef.current })
            }
        }, 30_000)

        joinedAtRef.current = Date.now()
        tickRef.current = setInterval(() => {
            if (joinedAtRef.current) {
                setElapsedSeconds(Math.floor((Date.now() - joinedAtRef.current) / 1000))
            }
        }, 1000)

        setIsJoined(true)
    }, [roomId, userId, isJoined, syncPresence])

    const leaveRoom = useCallback(async () => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current)
        if (tickRef.current) clearInterval(tickRef.current)
        heartbeatRef.current = null
        tickRef.current = null
        joinedAtRef.current = null
        setElapsedSeconds(0)

        if (sessionIdRef.current) {
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
    }, [roomId, userId])

    // Best-effort cleanup on unmount or tab close. The pg_cron job is the
    // real safety net for hard crashes / killed tabs.
    // useEffect(() => {
    //     const handleBeforeUnload = () => {
    //         if (isJoined) {
    //             // fire-and-forget; the cron job will catch anything this misses
    //             leaveRoom()
    //         }
    //     }
    //     window.addEventListener('beforeunload', handleBeforeUnload)

    //     return () => {
    //         window.removeEventListener('beforeunload', handleBeforeUnload)
    //         if (isJoined) {
    //             leaveRoom()
    //         }
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [isJoined])

    return {
        members,
        memberCount: members.length,
        isJoined,
        elapsedSeconds,
        joinRoom,
        leaveRoom,
    }
}
