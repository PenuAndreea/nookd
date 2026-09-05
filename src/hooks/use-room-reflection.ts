import type BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import type { RefObject } from 'react';

import { UserBook } from '@/api/books';
import { dismissReflection, saveReflection } from '@/api/reflections';
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
        await saveReflection({
            sessionId: lastSessionId,
            bookId,
            userBook: userBookForRoom,
            userId,
            data,
        });

        reflectionSheetRef.current?.close();
        router.back();
    }

    async function handleReflectionSkip() {
        if (lastSessionId) {
            try {
                await dismissReflection(lastSessionId);
            } catch (error) {
                // Dismissing must never trap the reader in the sheet; the
                // worst case is being asked once more.
                console.error('Error dismissing reflection:', error);
            }
        }

        reflectionSheetRef.current?.close();
        router.back();
    }

    return { handleReflectionSubmit, handleReflectionSkip };
}
