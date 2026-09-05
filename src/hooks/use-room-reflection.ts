import type BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import type { RefObject } from 'react';

import { addToReadingList, updateReadingListEntry, UserBook } from '@/api/books';
import { updateReadingSession } from '@/api/rooms';
import { ReflectionData } from '@/components/organisms/reflection-sheet';

interface UseRoomReflectionParams {
    /**
     * The book this session was actually spent on: the reader's own pick in a
     * house room, or the room's pinned book in a book club. Previously this was
     * read off `room.book_id`, which meant a reader who picked their own book
     * in a quiet room had their page and "finished" silently discarded.
     */
    bookId: string | null;
    userBookForRoom: UserBook | null;
    lastSessionId: string | null;
    userId: string | undefined;
    reflectionSheetRef: RefObject<BottomSheet | null>;
}

/** What happens when the post-session reflection sheet is submitted or skipped. */
export function useRoomReflection({
    bookId,
    userBookForRoom,
    lastSessionId,
    userId,
    reflectionSheetRef,
}: UseRoomReflectionParams) {
    const router = useRouter();

    async function handleReflectionSubmit(data: ReflectionData) {
        // Pages covered in *this* session. `userBookForRoom.current_page` is
        // the reader's previous page and is about to be overwritten below, so
        // this is the only moment the delta is knowable — deriving it later
        // from consecutive sessions cannot work for the first one on a book.
        // No library entry yet means they are starting from the beginning.
        const pagesRead = data.pageReached == null
            ? null
            : Math.max(data.pageReached - (userBookForRoom?.current_page ?? 0), 0);

        if (lastSessionId) {
            // The session is already closed by end_reading_session, which owns
            // ended_at and the duration derived from it. This write adds only
            // the reflection, and stamps the session as prompted so it stops
            // being offered.
            await updateReadingSession(lastSessionId, {
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

            if (userBookForRoom) {
                await updateReadingListEntry(userBookForRoom.id, patch);
            } else {
                await addToReadingList(
                    userId,
                    bookId,
                    data.finished ? 'finished' : 'currently_reading'
                );
            }
        }

        reflectionSheetRef.current?.close();
        router.back();
    }

    // Skipping still counts as having been asked -- without the stamp the
    // session stays "unreflected" forever and would be re-offered on the You
    // tab every time it loads.
    async function handleReflectionSkip() {
        if (lastSessionId) {
            try {
                await updateReadingSession(lastSessionId, {
                    reflection_prompted_at: new Date().toISOString(),
                });
            } catch (error) {
                // Dismissing must never trap the user in the sheet; the worst
                // case is being asked once more.
                console.error('Error dismissing reflection:', error);
            }
        }

        reflectionSheetRef.current?.close();
        router.back();
    }

    return { handleReflectionSubmit, handleReflectionSkip };
}
