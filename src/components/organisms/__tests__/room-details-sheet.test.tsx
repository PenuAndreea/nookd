import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import RoomDetailsSheet from '@/components/organisms/room-details-sheet';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const dune = { id: 'dune', title: 'Dune', author: 'Frank Herbert', cover_url: null } as any;

const baseProps = {
    room: { id: 'room-1', name: 'Rainy Library', description: null } as any,
    memberCount: 0,
    members: [],
    userId: 'me',
    booksInRoom: [],
    isJoined: false,
    selfHasBook: false,
    onAddBook: jest.fn(),
    onLeaveRoom: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('RoomDetailsSheet', () => {
    it('falls back to a generic title when the room has not loaded', async () => {
        await render(<RoomDetailsSheet {...baseProps} room={undefined} />);

        expect(screen.getByText('Room details')).toBeVisible();
    });

    it('shows the room name and description', async () => {
        await render(<RoomDetailsSheet {...baseProps} room={{ id: 'r', name: 'Rainy Library', description: 'Quiet and warm.' } as any} />);

        expect(screen.getByText('Rainy Library')).toBeVisible();
        expect(screen.getByText('Quiet and warm.')).toBeVisible();
    });

    it('shows "No one is here yet" for an empty room', async () => {
        await render(<RoomDetailsSheet {...baseProps} />);

        expect(screen.getByText('No one is here yet.')).toBeVisible();
    });

    it('shows the reader list once someone has joined', async () => {
        await render(
            <RoomDetailsSheet {...baseProps} memberCount={1} members={[{ user_id: 'me' }]} />
        );

        expect(screen.queryByText('No one is here yet.')).toBeNull();
        expect(screen.getByText('You')).toBeVisible();
    });

    it('lists the books currently being read, with a reader count', async () => {
        await render(<RoomDetailsSheet {...baseProps} booksInRoom={[{ book: dune, count: 2 }]} />);

        expect(screen.getByText('Dune')).toBeVisible();
        expect(screen.getByText('2 reading this book')).toBeVisible();
    });

    it('navigates to a book when its row is tapped', async () => {
        await render(<RoomDetailsSheet {...baseProps} booksInRoom={[{ book: dune, count: 1 }]} />);

        await fireEvent.press(screen.getByText('Dune'));

        expect(router.push).toHaveBeenCalledWith('/books/dune');
    });

    it('shows "Nothing yet" when no one has picked a book and the user has not joined', async () => {
        await render(<RoomDetailsSheet {...baseProps} />);

        expect(screen.getByText('Nothing yet.')).toBeVisible();
    });

    it('offers to add a book once joined, if the user has not picked one', async () => {
        const onAddBook = jest.fn();
        await render(<RoomDetailsSheet {...baseProps} isJoined onAddBook={onAddBook} />);

        expect(screen.queryByText('Nothing yet.')).toBeNull();
        await fireEvent.press(screen.getByText("+ Add what you're reading"));
        expect(onAddBook).toHaveBeenCalledTimes(1);
    });

    it('hides the add-book prompt once the user already has a book', async () => {
        await render(<RoomDetailsSheet {...baseProps} isJoined selfHasBook />);

        expect(screen.queryByText("+ Add what you're reading")).toBeNull();
    });

    it('shows a leave-room button only once joined, and calls onLeaveRoom', async () => {
        const onLeaveRoom = jest.fn();
        await render(<RoomDetailsSheet {...baseProps} isJoined onLeaveRoom={onLeaveRoom} />);

        await fireEvent.press(screen.getByText('Leave room'));
        expect(onLeaveRoom).toHaveBeenCalledTimes(1);
    });

    it('shows no leave-room button before joining', async () => {
        await render(<RoomDetailsSheet {...baseProps} />);

        expect(screen.queryByText('Leave room')).toBeNull();
    });
});
