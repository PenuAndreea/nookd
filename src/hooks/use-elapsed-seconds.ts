import { useEffect, useState } from 'react';

/**
 * Seconds elapsed since `startedAt`, ticking once a second.
 *
 * Pass a Postgres timestamp straight from the database — it is normalized
 * before parsing, since Postgres emits microsecond precision and Hermes only
 * reliably parses milliseconds.
 */
export function useElapsedSeconds(startedAt: string | null | undefined): number {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        // Resetting through a locally-declared function rather than a bare
        // setState call, matching `tick` below, keeps this effect readable
        // as a plain "reset/re-derive on input change" effect.
        function reset() {
            setElapsedSeconds(0);
        }

        if (!startedAt) {
            reset();
            return;
        }

        const startedAtMs = Date.parse(startedAt.replace(/(\.\d{3})\d+/, '$1'));
        if (Number.isNaN(startedAtMs)) {
            reset();
            return;
        }

        function tick() {
            setElapsedSeconds(Math.max(Math.floor((Date.now() - startedAtMs) / 1000), 0));
        }

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    return elapsedSeconds;
}
