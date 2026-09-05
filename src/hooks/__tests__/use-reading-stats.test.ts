import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getReadingSessions } from '@/api/stats';
import { useReadingStats } from '@/hooks/use-reading-stats';

jest.mock('@/api/stats', () => ({ getReadingSessions: jest.fn() }));

/** A session `daysAgo` days back, at midday so it cannot drift across midnight. */
function session(daysAgo: number, minutes: number) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(12, 0, 0, 0);

    return {
        id: `session-${daysAgo}`,
        created_at: date.toISOString(),
        ended_at: date.toISOString(),
        duration_minutes: minutes,
        ended_reason: 'left',
        mood: null,
        page_reached: null,
        pages_read: null,
        thoughts: null,
        room_id: 'room-1',
        room_name: 'Rainy Library',
        room_vibe: 'quiet_company',
        book_id: null,
        reflection_prompted_at: null,
        book: null,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    (getReadingSessions as jest.Mock).mockResolvedValue([]);
});

describe('useReadingStats', () => {
    it('bounds the fetch to the widest range, so one round trip serves all', async () => {
        const { result } = await renderHook(() => useReadingStats('user-1'));

        await waitFor(() => expect(result.current.loading).toBe(false));

        const [userId, since] = (getReadingSessions as jest.Mock).mock.calls[0];
        expect(userId).toBe('user-1');

        const daysBack = (Date.now() - Date.parse(since)) / 86_400_000;
        expect(daysBack).toBeGreaterThan(363);
        expect(daysBack).toBeLessThan(366);
    });

    it('does not query without a signed-in reader', async () => {
        await renderHook(() => useReadingStats(undefined));

        expect(getReadingSessions).not.toHaveBeenCalled();
    });

    it('summarises the fetched sessions', async () => {
        (getReadingSessions as jest.Mock).mockResolvedValue([session(0, 30), session(1, 45)]);

        const { result } = await renderHook(() => useReadingStats('user-1'));

        await waitFor(() => expect(result.current.summary.sessionCount).toBe(2));
        expect(result.current.summary.totalMinutes).toBe(75);
    });

    it('drops sub-minute bounces from the summary but keeps them in sessions', async () => {
        (getReadingSessions as jest.Mock).mockResolvedValue([session(0, 30), session(1, 0)]);

        const { result } = await renderHook(() => useReadingStats('user-1'));

        await waitFor(() => expect(result.current.summary.sessionCount).toBe(1));
        expect(result.current.sessions).toHaveLength(2);
    });

    it('re-derives on a range change without a second network call', async () => {
        // 300 days back is inside the rolling year but outside a week.
        (getReadingSessions as jest.Mock).mockResolvedValue([session(0, 30), session(300, 45)]);

        const { result } = await renderHook(() => useReadingStats('user-1'));
        await waitFor(() => expect(result.current.summary.sessionCount).toBe(1));

        await act(async () => {
            result.current.setRange('year');
        });

        await waitFor(() => expect(result.current.summary.sessionCount).toBe(2));
        // The whole point of fetching a year up front.
        expect(getReadingSessions).toHaveBeenCalledTimes(1);
    });

    it('charts as many day buckets as the chosen range', async () => {
        const { result } = await renderHook(() => useReadingStats('user-1'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.summary.series).toHaveLength(7);

        await act(async () => {
            result.current.setRange('month');
        });

        expect(result.current.summary.series).toHaveLength(30);
    });

    it('flags an error and keeps the summary empty when the fetch fails', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        (getReadingSessions as jest.Mock).mockRejectedValue(new Error('offline'));

        const { result } = await renderHook(() => useReadingStats('user-1'));

        await waitFor(() => expect(result.current.error).toBe(true));
        expect(result.current.loading).toBe(false);
        expect(result.current.summary.totalMinutes).toBe(0);
    });

    it('refetches and clears the error on reload', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        (getReadingSessions as jest.Mock).mockRejectedValueOnce(new Error('offline'));

        const { result } = await renderHook(() => useReadingStats('user-1'));
        await waitFor(() => expect(result.current.error).toBe(true));

        (getReadingSessions as jest.Mock).mockResolvedValue([session(0, 30)]);
        await act(async () => {
            result.current.reload();
        });

        await waitFor(() => expect(result.current.error).toBe(false));
        expect(result.current.summary.totalMinutes).toBe(30);
        expect(getReadingSessions).toHaveBeenCalledTimes(2);
    });
});
