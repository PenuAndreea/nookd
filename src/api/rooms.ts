import { supabase } from '@/lib/supabase';

import type { Tables, TablesInsert } from '../../database.types';

export type Room = Tables<'rooms'>;
export type RoomInsert = TablesInsert<'rooms'>;
export type RoomMembers = Tables<'room_members'>;
export type ReadingSession = Tables<'reading_sessions'>;
export type Book = Tables<'books'>;
/** A room plus its book. What every single-room read returns. */
export type RoomWithBook = Room & {
    book: Book | null;
};
/** Adds the member list — only the list query selects it. */
export type RoomWithDetails = RoomWithBook & {
    members: Pick<RoomMembers, 'user_id' | 'joined_at'>[];
};
export type RoomMemberWithBook = RoomMembers & {
    book: Book | null;
};

export function isRoomActive(room: Pick<Room, 'started_at' | 'duration_minutes'>): boolean {
    if (room.duration_minutes == null) return true;

    const endsAt = new Date(room.started_at).getTime() + room.duration_minutes * 60_000;
    return Date.now() < endsAt;
}

export async function getRooms(): Promise<RoomWithDetails[]> {
    const { data, error } = await supabase
        .from('rooms')
        .select('*, book:books(*), members:room_members(user_id, joined_at)')

    if (error) {
        throw error;
    }

    return ((data ?? []) as unknown as RoomWithDetails[]).filter(isRoomActive);
}

export async function getRoom(id: Room['id']): Promise<RoomWithBook | null> {
    const { data, error } = await supabase
        .from('rooms')
        .select('*, book:books(*)')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data as unknown as RoomWithBook | null;
}


export async function getRoomMembersByRoomId(roomId: Room['id']): Promise<RoomMemberWithBook[]> {
    const { data, error } = await supabase
        .from('room_members')
        .select('*, book:books(*)')
        .eq('room_id', roomId)

    if (error) {
        throw error
    }

    return (data ?? []) as unknown as RoomMemberWithBook[]
}

export async function updateRoomMemberBook(
    roomId: Room['id'],
    userId: string,
    bookId: Book['id'] | null
) {
    const { error } = await supabase
        .from('room_members')
        .update({ book_id: bookId })
        .eq('room_id', roomId)
        .eq('user_id', userId)

    if (error) {
        throw error
    }
}

// Leaves a room the caller may not be actively viewing (e.g. switching from
// a previously joined room into a new one) — ends any open reading session
// for it, then removes the membership row. Mirrors what
// useRoomPresence().leaveRoom() does for the room it's mounted against.
export async function forceLeaveRoom(roomId: Room['id'], userId: string): Promise<void> {
    // Close every open session, not just one: a user can end up with several
    // if a session was ever started without its matching end (a crash, or a
    // client that stopped before ending it). Assuming a single row here made
    // leaving fail outright with PGRST116.
    const { data: sessions, error: sessionError } = await supabase
        .from('reading_sessions')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .is('ended_at', null)

    if (sessionError) {
        throw sessionError
    }

    for (const session of sessions ?? []) {
        const { error: endError } = await supabase.rpc('end_reading_session', {
            p_session_id: session.id,
            p_reason: 'switched',
        })
        if (endError) {
            throw endError
        }
    }

    // Must stay after the session is ended: close_reading_session reads
    // room_members.book_id to record what was being read, so deleting the
    // membership first would silently drop that from every session.
    const { error: deleteError } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId)

    if (deleteError) {
        throw deleteError
    }
}

export async function createRoom(input: RoomInsert): Promise<RoomWithDetails> {
    const { data, error } = await supabase
        .from('rooms')
        .insert(input)
        .select('*, book:books(*), members:room_members(user_id, joined_at)')
        .single()

    if (error) {
        throw error
    }

    return data as unknown as RoomWithDetails
}

// Reflection fields only. `ended_at` / `duration_minutes` / `ended_reason` are
// owned by the end_reading_session RPC, which derives the duration from
// `ended_at` -- a client writing it afterwards made the two disagree.
export async function updateReadingSession(
    id: ReadingSession['id'],
    patch: Partial<Pick<ReadingSession, 'thoughts' | 'page_reached' | 'mood' | 'reflection_prompted_at'>>
) {
    const { data, error } = await supabase
        .from('reading_sessions')
        .update(patch)
        .eq('id', id)
        .select()
        .maybeSingle()

    if (error) {
        throw error
    }

    return data
}

