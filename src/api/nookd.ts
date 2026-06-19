import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

import type { Tables } from '../../database.types';

let channel: RealtimeChannel | null = null
let heartbeatInterval: ReturnType<typeof setInterval> | null = null
let currentSessionId: string | null = null


export type Room = Tables<'rooms'>;
export type Profile = Tables<'profiles'>;
export type RoomMembers = Tables<'room_members'>;
export type RoomWithDetails = Room & {
    host: Profile | null;
    members: RoomMembers[];
};

type TableRows = {
    rooms: Room;
    profiles: Profile;
    room_members: RoomMembers;
};

async function getRows<TableName extends keyof TableRows>(
    tableName: TableName
): Promise<TableRows[TableName][]> {
    const { data, error } = await supabase
        .from(tableName)
        .select();

    if (error) {
        throw error;
    }

    return (data ?? []) as TableRows[TableName][];
}

async function getRowById<TableName extends keyof TableRows>(
    tableName: TableName,
    id: TableRows[TableName]['id']
): Promise<TableRows[TableName] | null> {
    const { data, error } = await supabase
        .from(tableName)
        .select()
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data as TableRows[TableName] | null;
}

export function getRooms() {
    return getRows('rooms');
}

export async function getRoomsWithDetails(): Promise<RoomWithDetails[]> {
    const rooms = await getRooms();
    const hostIds = [...new Set(rooms.map((room) => room.host_id).filter(Boolean))] as Profile['id'][];
    const roomIds = rooms.map((room) => room?.id);

    const [{ data: hosts, error: hostsError }, { data: members, error: membersError }] = await Promise.all([
        hostIds.length > 0
            ? supabase
                .from('profiles')
                .select()
                .in('id', hostIds)
            : Promise.resolve({ data: [], error: null }),
        roomIds.length > 0
            ? supabase
                .from('room_members')
                .select()
                .in('room_id', roomIds)
            : Promise.resolve({ data: [], error: null }),
    ]);

    if (hostsError) {
        throw hostsError;
    }

    if (membersError) {
        throw membersError;
    }

    const hostsById = new Map((hosts as Profile[]).map((host) => [host.id, host]));
    const membersByRoomId = (members as RoomMembers[]).reduce<Map<Room['id'], RoomMembers[]>>(
        (groupedMembers, member) => {
            const roomMembers = groupedMembers.get(member.room_id) ?? [];

            groupedMembers.set(member.room_id, [...roomMembers, member]);

            return groupedMembers;
        },
        new Map()
    );

    return rooms.map((room) => ({
        ...room,
        host: room.host_id ? hostsById.get(room?.host_id) ?? null : null,
        members: membersByRoomId.get(room?.id) ?? [],
    }));
}

export function getRoom(id: Room['id']) {
    return getRowById('rooms', id);
}

export function getProfile(id: Profile['id']) {
    return getRowById('profiles', id);
}

export async function getRoomMembersByRoomId(roomId: Room['id']) {
    const { data, error } = await supabase
        .from('room_members')
        .select(`
            *,
            profiles (*)
        `)
        .eq('room_id', roomId)

    if (error) {
        throw error
    }

    return data ?? []
}

export async function createRoom(input: Room) {
    const { data, error } = await supabase
        .from('rooms')
        .insert(input)
        .select()

    if (error) {
        throw error
    }

    return data ?? {}
}

// export async function joinRoom(input: RoomMembers) {
//     const { data, error } = await supabase
//         .from('room_members')
//         .insert(input)
//         .select()

//     if (error) {
//         throw error
//     }

//     return data ?? {}
// }



export async function joinRoom(roomId: string, userId: string) {
    // persisted membership row (used for "who's in this room" queries / UI)
    const { error: memberError } = await supabase
        .from('room_members')
        .upsert({ room_id: roomId, user_id: userId, joined_at: new Date().toISOString() })
    if (memberError) throw memberError

    // analytics source of truth
    const { data: session, error: sessionError } = await supabase
        .rpc('start_reading_session', { p_room_id: roomId, p_user_id: userId })
        .single()
    if (sessionError) throw sessionError
    currentSessionId = session.id

    // live broadcast layer
    channel = supabase.channel(`room:${roomId}`, {
        config: { presence: { key: userId } },
    })

    channel
        .on('presence', { event: 'sync' }, () => {
            const state = channel!.presenceState()
            // drive your "who's here right now" UI off this
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel!.track({ user_id: userId, online_at: new Date().toISOString() })
            }
        })

    heartbeatInterval = setInterval(() => {
        if (currentSessionId) {
            supabase.rpc('heartbeat_reading_session', { p_session_id: currentSessionId })
        }
    }, 30_000)

    return session
}

export async function leaveRoom(roomId: string, userId: string) {
    if (heartbeatInterval) clearInterval(heartbeatInterval)

    if (currentSessionId) {
        await supabase.rpc('end_reading_session', { p_session_id: currentSessionId })
        currentSessionId = null
    }

    await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', userId)

    if (channel) {
        await channel.untrack()
        await supabase.removeChannel(channel)
        channel = null
    }
}