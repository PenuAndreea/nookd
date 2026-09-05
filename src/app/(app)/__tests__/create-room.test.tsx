import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getOrCreateBook, searchOpenLibrary } from '@/api/books';
import { createRoom } from '@/api/rooms';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import CreateRoomScreen from '@/app/(app)/create-room';

jest.mock('expo-router', () => ({
    router: { back: jest.fn(), replace: jest.fn() },
    useRouter: jest.fn(() => ({ back: jest.fn() })),
    useLocalSearchParams: jest.fn(() => ({})),
}));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/contexts/rooms-context', () => ({ useRooms: jest.fn() }));
jest.mock('@/api/books', () => ({
    getOrCreateBook: jest.fn(),
    searchOpenLibrary: jest.fn(),
}));
jest.mock('@/api/rooms', () => ({ createRoom: jest.fn() }));

const addRoom = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } } });
    (useRooms as jest.Mock).mockReturnValue({ addRoom });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('CreateRoomScreen', () => {
    it('creates a room with the entered name and default duration', async () => {
        (createRoom as jest.Mock).mockResolvedValue({ id: 'room-1', name: 'Sunday deep work' });
        await render(<CreateRoomScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('e.g. Sunday deep work'), 'Sunday deep work');
        await fireEvent.press(screen.getByText('Start silent room'));

        await waitFor(() =>
            expect(createRoom).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Sunday deep work',
                    host_id: 'user-1',
                    duration_minutes: 60,
                    book_id: null,
                    vibe: null,
                })
            )
        );
        expect(addRoom).toHaveBeenCalledWith({ id: 'room-1', name: 'Sunday deep work' });
        // Creating a room puts the host in it, rather than dropping them back
        // on the list to join their own room by hand.
        expect(router.replace).toHaveBeenCalledWith('/room/room-1?autojoin=1');
    });

    it('blocks creation and warns when signed out', async () => {
        (useAuth as jest.Mock).mockReturnValue({ session: null });
        await render(<CreateRoomScreen />);

        await fireEvent.press(screen.getByText('Start silent room'));

        expect(Alert.alert).toHaveBeenCalledWith('Room not created', 'You need to be signed in to create a room.');
        expect(createRoom).not.toHaveBeenCalled();
    });

    it('shows an error and does not navigate back when creation fails', async () => {
        (createRoom as jest.Mock).mockRejectedValue(new Error('offline'));
        await render(<CreateRoomScreen />);

        await fireEvent.press(screen.getByText('Start silent room'));

        await waitFor(() =>
            expect(Alert.alert).toHaveBeenCalledWith('Room not created', 'Something went wrong while creating the room.')
        );
        expect(addRoom).not.toHaveBeenCalled();
        expect(router.back).not.toHaveBeenCalled();
    });

    it('caches the selected book and attaches it for a book-club room', async () => {
        (searchOpenLibrary as jest.Mock).mockResolvedValue([
            { openLibraryKey: 'ol-1', title: 'Dune', author: 'Frank Herbert' },
        ]);
        (getOrCreateBook as jest.Mock).mockResolvedValue({ id: 'book-1' });
        (createRoom as jest.Mock).mockResolvedValue({ id: 'room-1' });
        await render(<CreateRoomScreen />);

        await fireEvent.press(screen.getByText('BookClub'));
        await fireEvent.changeText(screen.getByPlaceholderText('Search by title or author'), 'dune');
        await waitFor(() => expect(screen.getByText('Dune')).toBeVisible());
        await fireEvent.press(screen.getByText('Dune'));

        await act(async () => {
            await fireEvent.press(screen.getByText('Start silent room'));
        });

        expect(getOrCreateBook).toHaveBeenCalledWith(
            expect.objectContaining({ openLibraryKey: 'ol-1', title: 'Dune', author: 'Frank Herbert' })
        );
        await waitFor(() =>
            expect(createRoom).toHaveBeenCalledWith(expect.objectContaining({ book_id: 'book-1', vibe: 'book_club' }))
        );
    });

    it('still creates the room if caching the selected book fails', async () => {
        (searchOpenLibrary as jest.Mock).mockResolvedValue([
            { openLibraryKey: 'ol-1', title: 'Dune', author: 'Frank Herbert' },
        ]);
        (getOrCreateBook as jest.Mock).mockRejectedValue(new Error('offline'));
        (createRoom as jest.Mock).mockResolvedValue({ id: 'room-1' });
        await render(<CreateRoomScreen />);

        await fireEvent.press(screen.getByText('BookClub'));
        await fireEvent.changeText(screen.getByPlaceholderText('Search by title or author'), 'dune');
        await waitFor(() => expect(screen.getByText('Dune')).toBeVisible());
        await fireEvent.press(screen.getByText('Dune'));

        await act(async () => {
            await fireEvent.press(screen.getByText('Start silent room'));
        });

        await waitFor(() =>
            expect(createRoom).toHaveBeenCalledWith(expect.objectContaining({ book_id: null, vibe: 'book_club' }))
        );
        expect(addRoom).toHaveBeenCalled();
    });

    it('clears the selected book when switching away from book club', async () => {
        await render(<CreateRoomScreen />);

        await fireEvent.press(screen.getByText('BookClub'));
        expect(screen.getByPlaceholderText('Search by title or author')).toBeVisible();

        await fireEvent.press(screen.getByText('Fantasy'));

        expect(screen.queryByPlaceholderText('Search by title or author')).toBeNull();
    });

    describe('with a book preselected from the library', () => {
        beforeEach(() => {
            (useLocalSearchParams as jest.Mock).mockReturnValue({
                bookId: 'book-1',
                bookTitle: 'Dune',
                bookAuthor: 'Frank Herbert',
            });
        });

        it('shows the chosen book instead of the search field', async () => {
            await render(<CreateRoomScreen />);

            expect(screen.getByText('Dune')).toBeVisible();
            expect(screen.getByText('Frank Herbert')).toBeVisible();
            expect(screen.queryByPlaceholderText('Search by title or author')).toBeNull();
        });

        it('attaches the book without a second Open Library lookup', async () => {
            (createRoom as jest.Mock).mockResolvedValue({ id: 'room-1' });
            await render(<CreateRoomScreen />);

            await act(async () => {
                await fireEvent.press(screen.getByText('Start silent room'));
            });

            // The book is already a `books` row — nothing to cache.
            expect(getOrCreateBook).not.toHaveBeenCalled();
            await waitFor(() =>
                expect(createRoom).toHaveBeenCalledWith(expect.objectContaining({
                    book_id: 'book-1',
                    vibe: 'book_club',
                }))
            );
        });
    });
});
