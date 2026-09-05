import { supabase } from '@/lib/supabase';

import type { Tables } from '../../database.types';

type ReadingSession = Tables<'reading_sessions'>;
type Book = Tables<'books'>;

/**
 * The projection every stats query returns.
 *
 * Deliberately not `select('*')`: `thoughts` is unbounded free text that only
 * the reflection journal needs, and a year of sessions is fetched in one go.
 */
export type StatsSession = Pick<
    ReadingSession,
    | 'id'
    | 'created_at'
    | 'ended_at'
    | 'duration_minutes'
    | 'ended_reason'
    | 'mood'
    | 'page_reached'
    | 'thoughts'
    | 'room_id'
    | 'room_name'
    | 'room_vibe'
    | 'book_id'
    | 'reflection_prompted_at'
> & {
    book: Pick<Book, 'id' | 'title' | 'author' | 'cover_url' | 'page_count'> | null;
};

const COLUMNS =
    'id, created_at, ended_at, duration_minutes, ended_reason, mood, page_reached, ' +
    'thoughts, room_id, room_name, room_vibe, book_id, reflection_prompted_at, ' +
    'book:books(id, title, author, cover_url, page_count)';

/**
 * Closed sessions for one reader, newest first.
 *
 * Open sessions are excluded: they have no duration yet, so including them
 * would show a reader a session that counts for nothing. `sinceIso` bounds the
 * payload — the screen asks for a year and slices it client-side.
 *
 * RLS already scopes this to the caller; the explicit `user_id` filter is what
 * lets the (user_id, created_at desc) index serve the query.
 */
export async function getReadingSessions(
    userId: string,
    sinceIso?: string
): Promise<StatsSession[]> {
    let query = supabase
        .from('reading_sessions')
        .select(COLUMNS)
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .order('created_at', { ascending: false });

    if (sinceIso) {
        query = query.gte('created_at', sinceIso);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return (data ?? []) as unknown as StatsSession[];
}

/**
 * The most recent closed session that has never been through the reflection
 * flow, or null.
 *
 * This is what makes a reflection survive an unmount or a cold start — the
 * session id used to live only in component state, so backing out of a room
 * without pressing Leave dropped the reflection entirely. The 48-hour window
 * keeps a long-forgotten session from ambushing someone days later.
 */
export async function getPendingReflection(userId: string): Promise<StatsSession | null> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('reading_sessions')
        .select(COLUMNS)
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .is('reflection_prompted_at', null)
        .gte('ended_at', cutoff)
        .order('ended_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return (data ?? null) as unknown as StatsSession | null;
}
