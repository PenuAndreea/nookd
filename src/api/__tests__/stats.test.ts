import { getPendingReflection, getReadingSessions } from '@/api/stats';
import { supabase } from '@/lib/supabase';
import { queryResult } from '../../../test/supabase-mock';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

const row = {
    id: 'session-1',
    created_at: '2026-09-05T10:00:00.123456+00:00',
    ended_at: '2026-09-05T10:30:00+00:00',
    duration_minutes: 30,
    ended_reason: 'left',
    mood: 'focused',
    page_reached: 142,
    thoughts: null,
    room_id: 'room-1',
    room_name: 'Rainy Library',
    room_vibe: 'quiet_company',
    book_id: 'book-1',
    reflection_prompted_at: null,
    book: { id: 'book-1', title: 'Klara and the Sun', author: 'Kazuo Ishiguro', cover_url: null, page_count: 303 },
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getReadingSessions', () => {
    it('returns only the signed-in reader\'s closed sessions, newest first', async () => {
        const builder = queryResult({ data: [row], error: null });
        (supabase.from as jest.Mock).mockReturnValue(builder);

        const sessions = await getReadingSessions('user-1');

        expect(supabase.from).toHaveBeenCalledWith('reading_sessions');
        expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
        // An open session has no duration yet, so counting it would show a
        // reader a session worth nothing.
        expect(builder.not).toHaveBeenCalledWith('ended_at', 'is', null);
        expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(sessions).toEqual([row]);
    });

    it('bounds the fetch when given a since date', async () => {
        const builder = queryResult({ data: [], error: null });
        (supabase.from as jest.Mock).mockReturnValue(builder);

        await getReadingSessions('user-1', '2026-01-01T00:00:00.000Z');

        expect(builder.gte).toHaveBeenCalledWith('created_at', '2026-01-01T00:00:00.000Z');
    });

    it('does not bound the fetch when no since date is given', async () => {
        const builder = queryResult({ data: [], error: null });
        (supabase.from as jest.Mock).mockReturnValue(builder);

        await getReadingSessions('user-1');

        expect(builder.gte).not.toHaveBeenCalled();
    });

    it('returns an empty list rather than null when there is nothing yet', async () => {
        (supabase.from as jest.Mock).mockReturnValue(queryResult({ data: null, error: null }));

        await expect(getReadingSessions('user-1')).resolves.toEqual([]);
    });

    it('throws rather than silently reporting zero reading', async () => {
        (supabase.from as jest.Mock).mockReturnValue(
            queryResult({ data: null, error: new Error('offline') })
        );

        await expect(getReadingSessions('user-1')).rejects.toThrow('offline');
    });
});

describe('getPendingReflection', () => {
    it('asks for the newest closed session that was never prompted', async () => {
        const builder = queryResult({ data: row, error: null });
        (supabase.from as jest.Mock).mockReturnValue(builder);

        const pending = await getPendingReflection('user-1');

        expect(builder.is).toHaveBeenCalledWith('reflection_prompted_at', null);
        expect(builder.not).toHaveBeenCalledWith('ended_at', 'is', null);
        expect(builder.order).toHaveBeenCalledWith('ended_at', { ascending: false });
        expect(builder.limit).toHaveBeenCalledWith(1);
        expect(pending).toEqual(row);
    });

    it('only looks back 48 hours, so an old session cannot ambush the reader', async () => {
        const builder = queryResult({ data: null, error: null });
        (supabase.from as jest.Mock).mockReturnValue(builder);

        await getPendingReflection('user-1');

        const [column, cutoff] = builder.gte.mock.calls[0];
        expect(column).toBe('ended_at');

        const hoursBack = (Date.now() - Date.parse(cutoff)) / 3_600_000;
        expect(hoursBack).toBeCloseTo(48, 1);
    });

    it('returns null when nothing is waiting', async () => {
        (supabase.from as jest.Mock).mockReturnValue(queryResult({ data: null, error: null }));

        await expect(getPendingReflection('user-1')).resolves.toBeNull();
    });

    it('throws on a query error', async () => {
        (supabase.from as jest.Mock).mockReturnValue(
            queryResult({ data: null, error: new Error('offline') })
        );

        await expect(getPendingReflection('user-1')).rejects.toThrow('offline');
    });
});
