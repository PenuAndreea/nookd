import { renderHook } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { addToReadingList, updateReadingListEntry } from '@/api/books';
import { updateReadingSession } from '@/api/rooms';
import { useRoomReflection } from '@/hooks/use-room-reflection';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/api/books', () => ({
    addToReadingList: jest.fn(),
    updateReadingListEntry: jest.fn(),
}));
jest.mock('@/api/rooms', () => ({ updateReadingSession: jest.fn() }));

const room = { id: 'room-1', book_id: 'book-1' } as any;
const reflectionSheetRef = { current: { close: jest.fn() } } as any;
const back = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ back });
});

describe('useRoomReflection', () => {
    it('ends the reading session and creates a new library entry when there was none', async () => {
        const { result } = await renderHook(() =>
            useRoomReflection({
                room,
                userBookForRoom: null,
                lastSessionId: 'session-1',
                userId: 'user-1',
                reflectionSheetRef,
            })
        );

        await result.current.handleReflectionSubmit({
            thoughts: 'Great chapter',
            pageReached: 120,
            mood: 'focused',
            finished: false,
        });

        expect(updateReadingSession).toHaveBeenCalledWith(
            'session-1',
            expect.objectContaining({ thoughts: 'Great chapter', page_reached: 120, completed: true })
        );
        expect(addToReadingList).toHaveBeenCalledWith('user-1', 'book-1', 'currently_reading');
        expect(updateReadingListEntry).not.toHaveBeenCalled();
        expect(reflectionSheetRef.current.close).toHaveBeenCalled();
        expect(back).toHaveBeenCalled();
    });

    it('updates the existing library entry instead of creating a new one', async () => {
        const { result } = await renderHook(() =>
            useRoomReflection({
                room,
                userBookForRoom: { id: 'entry-1' } as any,
                lastSessionId: 'session-1',
                userId: 'user-1',
                reflectionSheetRef,
            })
        );

        await result.current.handleReflectionSubmit({
            thoughts: '',
            pageReached: 300,
            mood: 'cozy',
            finished: true,
        });

        expect(updateReadingListEntry).toHaveBeenCalledWith(
            'entry-1',
            expect.objectContaining({ current_page: 300, status: 'finished', finished_at: expect.any(String) })
        );
        expect(addToReadingList).not.toHaveBeenCalled();
    });

    it('skips the session update when there was no session to end', async () => {
        const { result } = await renderHook(() =>
            useRoomReflection({
                room,
                userBookForRoom: null,
                lastSessionId: null,
                userId: 'user-1',
                reflectionSheetRef,
            })
        );

        await result.current.handleReflectionSubmit({ thoughts: '', pageReached: null, mood: null, finished: false });

        expect(updateReadingSession).not.toHaveBeenCalled();
    });

    it('closes the sheet and navigates back without saving anything on skip', async () => {
        const { result } = await renderHook(() =>
            useRoomReflection({
                room,
                userBookForRoom: null,
                lastSessionId: 'session-1',
                userId: 'user-1',
                reflectionSheetRef,
            })
        );

        result.current.handleReflectionSkip();

        expect(updateReadingSession).not.toHaveBeenCalled();
        expect(reflectionSheetRef.current.close).toHaveBeenCalled();
        expect(back).toHaveBeenCalled();
    });
});
