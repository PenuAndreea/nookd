import { renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useRooms } from '@/contexts/rooms-context';
import { useContinueReading } from '@/hooks/use-continue-reading';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/contexts/rooms-context', () => ({ useRooms: jest.fn() }));

const book = { id: 'book-1', title: 'Dune', author: 'Frank Herbert', cover_url: 'https://covers/1.jpg' };

beforeEach(() => {
    jest.clearAllMocks();
    (useRooms as jest.Mock).mockReturnValue({ rooms: [] });
});

describe('useContinueReading', () => {
    it('joins an existing room for the book rather than creating a second one', async () => {
        (useRooms as jest.Mock).mockReturnValue({
            rooms: [{ id: 'room-9', book_id: 'book-1' }],
        });
        const { result } = await renderHook(() => useContinueReading());

        result.current(book);

        expect(router.push).toHaveBeenCalledWith({
            pathname: '/room/[id]',
            params: { id: 'room-9', autojoin: '1' },
        });
    });

    it('opens the create sheet with the book preselected when no room has it', async () => {
        (useRooms as jest.Mock).mockReturnValue({
            rooms: [{ id: 'room-9', book_id: 'a-different-book' }],
        });
        const { result } = await renderHook(() => useContinueReading());

        result.current(book);

        expect(router.push).toHaveBeenCalledWith({
            pathname: '/create-room',
            params: {
                bookId: 'book-1',
                bookTitle: 'Dune',
                bookAuthor: 'Frank Herbert',
                bookCoverUrl: 'https://covers/1.jpg',
            },
        });
    });

    it('handles a book with no author or cover', async () => {
        const { result } = await renderHook(() => useContinueReading());

        result.current({ ...book, author: null, cover_url: null });

        expect(router.push).toHaveBeenCalledWith({
            pathname: '/create-room',
            params: { bookId: 'book-1', bookTitle: 'Dune', bookAuthor: '', bookCoverUrl: '' },
        });
    });

    it('does not crash before the room list has loaded', async () => {
        (useRooms as jest.Mock).mockReturnValue({ rooms: null });
        const { result } = await renderHook(() => useContinueReading());

        result.current(book);

        expect(router.push).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: '/create-room' })
        );
    });
});
