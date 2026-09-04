import { act, renderHook } from '@testing-library/react-native';
import { queryResult } from '../../../test/supabase-mock';
import { supabase } from '@/lib/supabase';
import { useRoomPresence } from '@/hooks/use-room-presence';

jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        rpc: jest.fn(),
        channel: jest.fn(),
        getChannels: jest.fn(() => []),
        removeChannel: jest.fn(),
    },
}));

const from = supabase.from as jest.Mock;
const rpc = supabase.rpc as jest.Mock;
const channelFactory = supabase.channel as jest.Mock;
const getChannels = supabase.getChannels as jest.Mock;
const removeChannel = supabase.removeChannel as jest.Mock;

function makeChannel() {
    const channel: any = {
        topic: 'realtime:room:room-1',
        on: jest.fn(() => channel),
        subscribe: jest.fn((cb: (status: string) => void) => {
            cb('SUBSCRIBED');
            return channel;
        }),
        track: jest.fn().mockResolvedValue({}),
        untrack: jest.fn().mockResolvedValue({}),
        presenceState: jest.fn(() => ({})),
    };
    return channel;
}

beforeEach(() => {
    jest.clearAllMocks();
    getChannels.mockReturnValue([]);
    channelFactory.mockImplementation(() => makeChannel());
    rpc.mockImplementation(() => queryResult({ data: { id: 'session-1' }, error: null }));
});

describe('useRoomPresence', () => {
    it('joins the room: upserts membership, starts a session, and subscribes to presence', async () => {
        const upsertBuilder = queryResult({ data: null, error: null });
        from.mockReturnValue(upsertBuilder);

        const { result } = await renderHook(() => useRoomPresence('room-1', 'user-1'));

        await act(async () => {
            await result.current.joinRoom('book-1');
        });

        expect(upsertBuilder.upsert).toHaveBeenCalledWith(
            { room_id: 'room-1', user_id: 'user-1', book_id: 'book-1' },
            { onConflict: 'room_id,user_id' }
        );
        expect(rpc).toHaveBeenCalledWith('start_reading_session', { p_room_id: 'room-1', p_user_id: 'user-1' });
        expect(result.current.isJoined).toBe(true);
        expect(result.current.presenceError).toBe(false);
    });

    it('does not join twice for overlapping calls', async () => {
        from.mockReturnValue(queryResult({ data: null, error: null }));

        const { result } = await renderHook(() => useRoomPresence('room-1', 'user-1'));

        await act(async () => {
            await Promise.all([result.current.joinRoom(), result.current.joinRoom()]);
        });

        expect(channelFactory).toHaveBeenCalledTimes(1);
    });

    it('removes a stale channel from a previous visit before creating a new one', async () => {
        const stale = { topic: 'realtime:room:room-1' };
        getChannels.mockReturnValue([stale]);
        from.mockReturnValue(queryResult({ data: null, error: null }));

        const { result } = await renderHook(() => useRoomPresence('room-1', 'user-1'));

        await act(async () => {
            await result.current.joinRoom();
        });

        expect(removeChannel).toHaveBeenCalledWith(stale);
    });

    it('flags presenceError when the channel reports an error instead of subscribing', async () => {
        channelFactory.mockImplementation(() => {
            const channel: any = {
                topic: 'realtime:room:room-1',
                on: jest.fn(() => channel),
                subscribe: jest.fn((cb: (status: string, err?: Error) => void) => {
                    cb('CHANNEL_ERROR', new Error('boom'));
                    return channel;
                }),
                track: jest.fn().mockResolvedValue({}),
                untrack: jest.fn().mockResolvedValue({}),
                presenceState: jest.fn(() => ({})),
            };
            return channel;
        });
        from.mockReturnValue(queryResult({ data: null, error: null }));

        const { result } = await renderHook(() => useRoomPresence('room-1', 'user-1'));

        await act(async () => {
            await result.current.joinRoom();
        });

        expect(result.current.presenceError).toBe(true);
    });

    it('leaves the room: ends the session, deletes membership, and tears down the channel', async () => {
        from.mockReturnValue(queryResult({ data: null, error: null }));
        const { result } = await renderHook(() => useRoomPresence('room-1', 'user-1'));

        await act(async () => {
            await result.current.joinRoom();
        });
        const channel = channelFactory.mock.results[0].value;

        const deleteBuilder = queryResult({ data: null, error: null });
        from.mockReturnValue(deleteBuilder);

        await act(async () => {
            await result.current.leaveRoom();
        });

        expect(rpc).toHaveBeenCalledWith('end_reading_session', { p_session_id: 'session-1' });
        expect(deleteBuilder.delete).toHaveBeenCalled();
        expect(channel.untrack).toHaveBeenCalled();
        expect(removeChannel).toHaveBeenCalledWith(channel);
        expect(result.current.isJoined).toBe(false);
        expect(result.current.members).toEqual([]);
    });

    it('records the just-ended session id as lastSessionId', async () => {
        from.mockReturnValue(queryResult({ data: null, error: null }));
        const { result } = await renderHook(() => useRoomPresence('room-1', 'user-1'));

        await act(async () => {
            await result.current.joinRoom();
        });
        await act(async () => {
            await result.current.leaveRoom();
        });

        expect(result.current.lastSessionId).toBe('session-1');
    });
});
