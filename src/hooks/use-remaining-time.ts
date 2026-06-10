import { useEffect, useState } from 'react';

export function useRemainingTime(startedAt: string, durationMinutes: number) {
    const getRemaining = () => {
        const normalized = startedAt.replace(/(\.\d{3})\d+/, '$1'); // truncate to 3 decimal places
        const start = Date.parse(normalized);
        const now = Date.now();
        const elapsedMs = now - start;
        const remainingMs = durationMinutes * 60 * 1000 - elapsedMs;
        return Math.max(0, Math.ceil(remainingMs / 1000));
    };
    const [remainingSeconds, setRemainingSeconds] = useState(getRemaining);

    useEffect(() => {
        if (remainingSeconds === 0) return;

        const interval = setInterval(() => {
            const next = getRemaining();
            setRemainingSeconds(next);
            if (next === 0) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt, durationMinutes]);

    return {
        remainingSeconds,
        remainingMinutes: Math.ceil(remainingSeconds / 60),
        isExpired: remainingSeconds === 0,
    };
}