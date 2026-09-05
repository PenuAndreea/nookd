import { addToReadingList, updateReadingListEntry, type UserBook } from '@/api/books';
import { updateReadingSession } from '@/api/rooms';
import type { ReflectionData } from '@/components/organisms/reflection-sheet';

interface SaveReflectionParams {
    sessionId: string | null;
    /** The book the session was spent on, if any. */
    bookId: string | null;
    /** The reader's existing library entry for that book, if any. */
    userBook: UserBook | null;
    userId: string | undefined;
    data: ReflectionData;
}

/**
 * Writes a reflection to its session and brings the reader's library entry up
 * to date.
 *
 * Shared by the sheet that opens on leaving a room and the card on the You tab
 * that catches sessions never prompted — a crash mid-session, or a timed room
 * ending while the reader was elsewhere. Both must record identically, so the
 * logic lives here rather than in either hook.
 */
export async function saveReflection({
    sessionId,
    bookId,
    userBook,
    userId,
    data,
}: SaveReflectionParams): Promise<void> {
    // Pages covered in *this* session. `userBook.current_page` is the reader's
    // previous page and is about to be overwritten below, so this is the only
    // moment the delta is knowable — deriving it later from consecutive
    // sessions cannot describe the first session on a book. No library entry
    // yet means they are starting from the beginning.
    const pagesRead = data.pageReached == null
        ? null
        : Math.max(data.pageReached - (userBook?.current_page ?? 0), 0);

    if (sessionId) {
        // The session is already closed by end_reading_session, which owns
        // ended_at and the duration derived from it. This write adds only the
        // reflection, and stamps the session as prompted so it stops being
        // offered.
        await updateReadingSession(sessionId, {
            thoughts: data.thoughts || null,
            page_reached: data.pageReached,
            pages_read: pagesRead,
            mood: data.mood,
            reflection_prompted_at: new Date().toISOString(),
        });
    }

    if (bookId && userId) {
        const patch: Partial<Pick<UserBook, 'status' | 'current_page' | 'started_at' | 'finished_at'>> = {};
        if (data.pageReached != null) patch.current_page = data.pageReached;
        if (data.finished) {
            patch.status = 'finished';
            patch.finished_at = new Date().toISOString();
        }

        if (userBook) {
            // A reflection that records only a mood leaves nothing to change
            // here, and an empty PATCH body is rejected outright — which
            // surfaced as "Couldn't save" on a reflection that had in fact
            // just been saved.
            if (Object.keys(patch).length > 0) {
                await updateReadingListEntry(userBook.id, patch);
            }
        } else {
            await addToReadingList(userId, bookId, data.finished ? 'finished' : 'currently_reading');
        }
    }
}

/**
 * Marks a session as having been asked about, without recording an answer.
 *
 * Without the stamp the session stays "unreflected" forever and is re-offered
 * on the You tab every time it loads, so dismissing has to be recorded even
 * though the reader said nothing.
 */
export async function dismissReflection(sessionId: string): Promise<void> {
    await updateReadingSession(sessionId, {
        reflection_prompted_at: new Date().toISOString(),
    });
}
