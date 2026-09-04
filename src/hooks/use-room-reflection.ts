import type BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import type { RefObject } from 'react';

import { addToReadingList, updateReadingListEntry, UserBook } from '@/api/books';
import { RoomWithBook, updateReadingSession } from '@/api/rooms';
import { ReflectionData } from '@/components/organisms/reflection-sheet';

interface UseRoomReflectionParams {
    room: RoomWithBook | undefined;
    userBookForRoom: UserBook | null;
    lastSessionId: string | null;
    userId: string | undefined;
    reflectionSheetRef: RefObject<BottomSheet | null>;
}

/** What happens when the post-session reflection sheet is submitted or skipped. */
export function useRoomReflection({
    room,
    userBookForRoom,
    lastSessionId,
    userId,
    reflectionSheetRef,
}: UseRoomReflectionParams) {
    const router = useRouter();

    async function handleReflectionSubmit(data: ReflectionData) {
        if (lastSessionId) {
            await updateReadingSession(lastSessionId, {
                thoughts: data.thoughts || null,
                page_reached: data.pageReached,
                mood: data.mood,
                ended_at: new Date().toISOString(),
                completed: true,
            });
        }

        if (room?.book_id && userId) {
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
                    room.book_id,
                    data.finished ? 'finished' : 'currently_reading'
                );
            }
        }

        reflectionSheetRef.current?.close();
        router.back();
    }

    function handleReflectionSkip() {
        reflectionSheetRef.current?.close();
        router.back();
    }

    return { handleReflectionSubmit, handleReflectionSkip };
}
