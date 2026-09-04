import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getUserBookForBook, getUserBooks } from '@/api/books';
import { getRoom } from '@/api/rooms';
import { useRoomData } from '@/hooks/use-room-data';

jest.mock('@/api/books', () => ({
    getUserBookForBook: jest.fn(),
    getUserBooks: jest.fn(),
}));
jest.mock('@/api/rooms', () => ({ getRoom: jest.fn() }));

beforeEach(() => {
    jest.clearAllMocks();
    (getUserBooks as jest.Mock).mockResolvedValue([]);
});

describe('useRoomData', () => {
    it('loads the room and derives its theme', async () => {
        (getRoom as jest.Mock).mockResolvedValue({ id: 'room-1', vibe: 'fantasy', book_id: null });

        const { result } = await renderHook(() => useRoomData('room-1', 'user-1'));

        await waitFor(() => expect(result.current.room?.id).toBe('room-1'));
        expect(result.current.roomError).toBe(false);
        expect(result.current.theme).not.toBeNull();
    });

    it('looks up the user\'s existing library entry when the room has a book', async () => {
        (getRoom as jest.Mock).mockResolvedValue({ id: 'room-1', vibe: 'book_club', book_id: 'book-1' });
        (getUserBookForBook as jest.Mock).mockResolvedValue({ id: 'entry-1', current_page: 42 });

        const { result } = await renderHook(() => useRoomData('room-1', 'user-1'));

        await waitFor(() => expect(result.current.userBookForRoom?.id).toBe('entry-1'));
        expect(getUserBookForBook).toHaveBeenCalledWith('user-1', 'book-1');
    });

    it('sets roomError and leaves room undefined when the fetch fails', async () => {
        (getRoom as jest.Mock).mockRejectedValue(new Error('offline'));

        const { result } = await renderHook(() => useRoomData('room-1', 'user-1'));

        await waitFor(() => expect(result.current.roomError).toBe(true));
        expect(result.current.room).toBeUndefined();
        expect(result.current.theme).toBeNull();
    });

    it('retryRoom re-fetches the room', async () => {
        (getRoom as jest.Mock).mockRejectedValueOnce(new Error('offline'));
        const { result } = await renderHook(() => useRoomData('room-1', 'user-1'));
        await waitFor(() => expect(result.current.roomError).toBe(true));

        (getRoom as jest.Mock).mockResolvedValueOnce({ id: 'room-1', vibe: 'fantasy', book_id: null });
        await act(async () => {
            result.current.retryRoom();
        });

        await waitFor(() => expect(result.current.room?.id).toBe('room-1'));
        expect(result.current.roomError).toBe(false);
    });

    it('sets libraryError when the library fails to load, and retryLibrary clears it', async () => {
        (getRoom as jest.Mock).mockResolvedValue({ id: 'room-1', vibe: 'fantasy', book_id: null });
        (getUserBooks as jest.Mock).mockRejectedValueOnce(new Error('offline'));

        const { result } = await renderHook(() => useRoomData('room-1', 'user-1'));

        await waitFor(() => expect(result.current.libraryError).toBe(true));

        (getUserBooks as jest.Mock).mockResolvedValueOnce([{ id: 'entry-1' }]);
        await act(async () => {
            result.current.retryLibrary();
        });

        await waitFor(() => expect(result.current.libraryError).toBe(false));
        expect(result.current.libraryBooks).toEqual([{ id: 'entry-1' }]);
    });
});
