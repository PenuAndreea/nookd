import { act, renderHook } from '@testing-library/react-native';

import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds';

describe('useElapsedSeconds', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('is 0 when there is no start time', async () => {
        const { result } = await renderHook(() => useElapsedSeconds(undefined));

        expect(result.current).toBe(0);
    });

    it('is 0 immediately, then ticks up once a second', async () => {
        const startedAt = new Date().toISOString();
        const { result } = await renderHook(() => useElapsedSeconds(startedAt));

        expect(result.current).toBe(0);

        await act(async () => {
            jest.advanceTimersByTime(3000);
        });

        expect(result.current).toBe(3);
    });

    it('resets to 0 when the start time is cleared', async () => {
        const startedAt = new Date().toISOString();
        const { result, rerender } = await renderHook(
            ({ startedAt }: { startedAt: string | undefined }) => useElapsedSeconds(startedAt),
            { initialProps: { startedAt } }
        );

        await act(async () => {
            jest.advanceTimersByTime(5000);
        });
        expect(result.current).toBe(5);

        await rerender({ startedAt: undefined });

        expect(result.current).toBe(0);
    });

    it('normalizes a Postgres microsecond timestamp instead of failing to parse', async () => {
        const startedAt = new Date(Date.now() - 2000).toISOString().replace('Z', '123Z');
        const { result } = await renderHook(() => useElapsedSeconds(startedAt));

        expect(result.current).toBe(2);
    });

    it('falls back to 0 for an unparseable timestamp', async () => {
        const { result } = await renderHook(() => useElapsedSeconds('not-a-date'));

        expect(result.current).toBe(0);
    });
});
