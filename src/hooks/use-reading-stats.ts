import { useCallback, useEffect, useMemo, useState } from 'react';

import { getReadingSessions, type StatsSession } from '@/api/stats';
import {
    sessionsInRange,
    startOfRange,
    summarize,
    type ReadingSummary,
    type StatsRange,
} from '@/lib/stats';

export interface ReadingStatsState {
    summary: ReadingSummary;
    /** Every fetched session, unsliced — the reflection journal shows all of them. */
    sessions: StatsSession[];
    loading: boolean;
    /** Set when the fetch failed and `summary` is empty as a result. */
    error: boolean;
    range: StatsRange;
    setRange: (range: StatsRange) => void;
    reload: () => void;
}

/**
 * Every number on the You tab.
 *
 * A year is fetched once and each range is derived from it in memory, so
 * switching between week/month/year is instant and works offline. That is why
 * `range` deliberately does not appear in the loader's dependencies — changing
 * it must not cost a round trip.
 */
export function useReadingStats(userId: string | undefined): ReadingStatsState {
    const [sessions, setSessions] = useState<StatsSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [range, setRange] = useState<StatsRange>('week');
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!userId) return;

        // Captured so the async closure below has a non-optional id without a
        // non-null assertion.
        const id = userId;
        let isActive = true;

        async function loadSessions() {
            setLoading(true);
            try {
                // The widest range decides the fetch, so every range is served
                // from this one round trip.
                const data = await getReadingSessions(id, startOfRange('year').toISOString());
                if (!isActive) return;
                setSessions(data);
                setError(false);
            } catch (cause) {
                console.error('Error loading reading stats:', cause);
                // Keep whatever is already on screen rather than blanking it;
                // the error state offers a retry.
                if (isActive) setError(true);
            } finally {
                if (isActive) setLoading(false);
            }
        }
        loadSessions();

        return () => {
            isActive = false;
        };
    }, [userId, reloadToken]);

    const summary = useMemo(
        () => summarize(sessionsInRange(sessions, range), range),
        [sessions, range]
    );

    const reload = useCallback(() => setReloadToken((token) => token + 1), []);

    return { summary, sessions, loading, error, range, setRange, reload };
}
