import { useCallback, useEffect, useState } from 'react';

import { getUserBookForBook, type UserBook } from '@/api/books';
import { dismissReflection, saveReflection } from '@/api/reflections';
import { getPendingReflection, type StatsSession } from '@/api/stats';
import type { ReflectionData } from '@/components/organisms/reflection-sheet';

export interface PendingReflectionState {
    /** The session still owed a reflection, or null when there is none. */
    pending: StatsSession | null;
    /** The reader's library entry for that session's book, needed for the page delta. */
    userBook: UserBook | null;
    submit: (data: ReflectionData) => Promise<void>;
    dismiss: () => Promise<void>;
}

/**
 * A session that ended without the reader ever being asked about it.
 *
 * Leaving a room normally opens the reflection sheet, so this only catches the
 * cases where no client was there to ask: the app was killed mid-session and
 * the reaper closed it, or a timed room's clock ran out while the reader was
 * elsewhere. Rare, but otherwise that session is silently unreflectable
 * forever.
 */
export function usePendingReflection(userId: string | undefined): PendingReflectionState {
    const [pending, setPending] = useState<StatsSession | null>(null);
    const [userBook, setUserBook] = useState<UserBook | null>(null);

    useEffect(() => {
        if (!userId) return;

        const id = userId;
        let isActive = true;

        async function load() {
            try {
                const session = await getPendingReflection(id);
                if (!isActive) return;
                setPending(session);

                // Needed before the reader submits: the page they were already
                // on is what makes "pages read this session" a real number.
                const entry = session?.book_id
                    ? await getUserBookForBook(id, session.book_id)
                    : null;
                if (isActive) setUserBook(entry);
            } catch (error) {
                // Nothing to recover is the normal case, and a failure here
                // must not disturb the rest of the screen.
                console.error('Error loading pending reflection:', error);
            }
        }
        load();

        return () => {
            isActive = false;
        };
    }, [userId]);

    const submit = useCallback(async (data: ReflectionData) => {
        if (!pending) return;

        await saveReflection({
            sessionId: pending.id,
            bookId: pending.book_id,
            userBook,
            userId,
            data,
        });
        setPending(null);
    }, [pending, userBook, userId]);

    const dismiss = useCallback(async () => {
        if (!pending) return;

        try {
            await dismissReflection(pending.id);
        } catch (error) {
            console.error('Error dismissing reflection:', error);
        }
        // Cleared either way: a reader who declined should not be asked again
        // in the same sitting because the write failed.
        setPending(null);
    }, [pending]);

    return { pending, userBook, submit, dismiss };
}
