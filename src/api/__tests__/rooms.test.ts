import { queryResult } from '../../../test/supabase-mock';

import { supabase } from '@/lib/supabase';
import { createRoom, forceLeaveRoom, getRoom, getRooms, isRoomActive } from '@/api/rooms';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn(), rpc: jest.fn() } }));

const from = supabase.from as jest.Mock;
const rpc = supabase.rpc as jest.Mock;

describe('isRoomActive', () => {
    it('is always active for an open-ended (no duration) room', () => {
        expect(isRoomActive({ started_at: new Date(0).toISOString(), duration_minutes: null })).toBe(true);
    });

    it('is active before its duration has elapsed', () => {
        const startedAt = new Date(Date.now() - 5 * 60_000).toISOString();
        expect(isRoomActive({ started_at: startedAt, duration_minutes: 60 })).toBe(true);
    });

    it('is inactive once its duration has elapsed', () => {
        const startedAt = new Date(Date.now() - 90 * 60_000).toISOString();
        expect(isRoomActive({ started_at: startedAt, duration_minutes: 60 })).toBe(false);
    });
});

describe('getRooms', () => {
    beforeEach(() => from.mockReset());

    it('filters out rooms whose duration has already elapsed', async () => {
        const active = { id: 'active', started_at: new Date().toISOString(), duration_minutes: 60, members: [] };
        const expired = { id: 'expired', started_at: new Date(Date.now() - 90 * 60_000).toISOString(), duration_minutes: 60, members: [] };
        from.mockReturnValue(queryResult({ data: [active, expired], error: null }));

        const rooms = await getRooms();

        expect(rooms.map((r) => r.id)).toEqual(['active']);
    });

    it('throws when the query errors', async () => {
        from.mockReturnValue(queryResult({ data: null, error: new Error('network down') }));

        await expect(getRooms()).rejects.toThrow('network down');
    });
});

describe('getRoom', () => {
    beforeEach(() => from.mockReset());

    it('returns null when no room matches', async () => {
        from.mockReturnValue(queryResult({ data: null, error: null }));

        expect(await getRoom('missing')).toBeNull();
    });
});

describe('createRoom', () => {
    beforeEach(() => from.mockReset());

    it('inserts the given input and returns the created row', async () => {
        const created = { id: 'new-room', name: 'Sunday deep work' };
        const builder = queryResult({ data: created, error: null });
        from.mockReturnValue(builder);

        const input = { host_id: 'user-1', name: 'Sunday deep work', started_at: new Date().toISOString() } as any;
        const result = await createRoom(input);

        expect(builder.insert).toHaveBeenCalledWith(input);
        expect(result).toEqual(created);
    });
});

describe('forceLeaveRoom', () => {
    beforeEach(() => {
        from.mockReset();
        rpc.mockReset();
    });

    it('ends every open session for the user before removing their membership', async () => {
        const sessionsBuilder = queryResult({
            data: [{ id: 'session-1' }, { id: 'session-2' }],
            error: null,
        });
        const deleteBuilder = queryResult({ data: null, error: null });
        from
            .mockReturnValueOnce(sessionsBuilder) // reading_sessions select
            .mockReturnValueOnce(deleteBuilder); // room_members delete
        rpc.mockResolvedValue({ data: null, error: null });

        await forceLeaveRoom('room-1', 'user-1');

        expect(rpc).toHaveBeenCalledTimes(2);
        expect(rpc).toHaveBeenNthCalledWith(1, 'end_reading_session', { p_session_id: 'session-1' });
        expect(rpc).toHaveBeenNthCalledWith(2, 'end_reading_session', { p_session_id: 'session-2' });
        expect(deleteBuilder.delete).toHaveBeenCalled();
    });

    it('still removes membership when there were no open sessions', async () => {
        from
            .mockReturnValueOnce(queryResult({ data: [], error: null }))
            .mockReturnValueOnce(queryResult({ data: null, error: null }));

        await forceLeaveRoom('room-1', 'user-1');

        expect(rpc).not.toHaveBeenCalled();
    });

    it('throws if ending a session fails, without swallowing the error', async () => {
        from.mockReturnValueOnce(queryResult({ data: [{ id: 'session-1' }], error: null }));
        rpc.mockResolvedValue({ data: null, error: new Error('rpc failed') });

        await expect(forceLeaveRoom('room-1', 'user-1')).rejects.toThrow('rpc failed');
    });
});
