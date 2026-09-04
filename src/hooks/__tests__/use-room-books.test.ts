import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getRoomMembersByRoomId, updateRoomMemberBook } from '@/api/rooms';
import { useRoomBooks } from '@/hooks/use-room-books';

jest.mock('@/api/rooms', () => ({
    getRoomMembersByRoomId: jest.fn(),
    updateRoomMemberBook: jest.fn(),
}));

const readingPickerRef = { current: { close: jest.fn(), snapToIndex: jest.fn() } } as any;
const dune = { id: 'dune', title: 'Dune' };
const circe = { id: 'circe', title: 'Circe' };

const libraryBooks = [
    { book_id: 'dune', book: dune },
    { book_id: 'circe', book: circe },
] as any;

beforeEach(() => {
    jest.clearAllMocks();
    (getRoomMembersByRoomId as jest.Mock).mockResolvedValue([]);
});

describe('useRoomBooks', () => {
    it('groups members by book, most-read first', async () => {
        (getRoomMembersByRoomId as jest.Mock).mockResolvedValue([
            { user_id: 'a', book: dune },
            { user_id: 'b', book: dune },
            { user_id: 'c', book: circe },
            { user_id: 'd', book: null },
        ]);
        const members = [{ user_id: 'a', online_at: '' }, { user_id: 'b', online_at: '' }, { user_id: 'c', online_at: '' }, { user_id: 'd', online_at: '' }];

        const { result } = await renderHook(() =>
            useRoomBooks({
                roomId: 'room-1',
                userId: 'a',
                members,
                libraryBooks,
                isJoined: true,
                attemptJoin: jest.fn(),
                readingPickerRef,
            })
        );

        await waitFor(() =>
            expect(result.current.booksInRoom).toEqual([
                { book: dune, count: 2 },
                { book: circe, count: 1 },
            ])
        );
        expect(result.current.selfHasBook).toBe(true);
    });

    it('reports selfHasBook as false once member books have loaded and the user has none', async () => {
        (getRoomMembersByRoomId as jest.Mock).mockResolvedValue([{ user_id: 'a', book: null }]);
        const members = [{ user_id: 'a', online_at: '' }];

        const { result } = await renderHook(() =>
            useRoomBooks({
                roomId: 'room-1',
                userId: 'a',
                members,
                libraryBooks,
                isJoined: true,
                attemptJoin: jest.fn(),
                readingPickerRef,
            })
        );

        await waitFor(() => expect(getRoomMembersByRoomId).toHaveBeenCalled());
        expect(result.current.selfHasBook).toBe(false);
    });

    it('joins with the picked book when selecting one before joining', async () => {
        const attemptJoin = jest.fn();
        const { result } = await renderHook(() =>
            useRoomBooks({
                roomId: 'room-1',
                userId: 'a',
                members: [],
                libraryBooks,
                isJoined: false,
                attemptJoin,
                readingPickerRef,
            })
        );

        await act(async () => {
            await result.current.handleSelectBook('dune');
        });

        expect(attemptJoin).toHaveBeenCalledWith('dune');
        expect(updateRoomMemberBook).not.toHaveBeenCalled();
        expect(readingPickerRef.current.close).toHaveBeenCalled();
    });

    it('updates the membership row when selecting a book while already joined', async () => {
        const { result } = await renderHook(() =>
            useRoomBooks({
                roomId: 'room-1',
                userId: 'a',
                members: [],
                libraryBooks,
                isJoined: true,
                attemptJoin: jest.fn(),
                readingPickerRef,
            })
        );

        await act(async () => {
            await result.current.handleSelectBook('circe');
        });

        expect(updateRoomMemberBook).toHaveBeenCalledWith('room-1', 'a', 'circe');
    });

    it('joins with no book when skipping before joining', async () => {
        const attemptJoin = jest.fn();
        const { result } = await renderHook(() =>
            useRoomBooks({
                roomId: 'room-1',
                userId: 'a',
                members: [],
                libraryBooks,
                isJoined: false,
                attemptJoin,
                readingPickerRef,
            })
        );

        await act(async () => {
            await result.current.handleSkipBook();
        });

        expect(attemptJoin).toHaveBeenCalledWith();
    });

    it('does not re-join when skipping while already joined', async () => {
        const attemptJoin = jest.fn();
        const { result } = await renderHook(() =>
            useRoomBooks({
                roomId: 'room-1',
                userId: 'a',
                members: [],
                libraryBooks,
                isJoined: true,
                attemptJoin,
                readingPickerRef,
            })
        );

        await act(async () => {
            await result.current.handleSkipBook();
        });

        expect(attemptJoin).not.toHaveBeenCalled();
    });

    it('opens the reading picker sheet', async () => {
        const { result } = await renderHook(() =>
            useRoomBooks({
                roomId: 'room-1',
                userId: 'a',
                members: [],
                libraryBooks,
                isJoined: true,
                attemptJoin: jest.fn(),
                readingPickerRef,
            })
        );

        result.current.openReadingPicker();

        expect(readingPickerRef.current.snapToIndex).toHaveBeenCalledWith(0);
    });
});
