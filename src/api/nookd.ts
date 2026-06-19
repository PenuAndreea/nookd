import { supabase } from '@/lib/supabase';

import type { Tables } from '../../database.types';

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

export function getRoom(id: Room['id']) {
    return getRowById('rooms', id);
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

