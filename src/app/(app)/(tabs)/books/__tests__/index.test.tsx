import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/contexts/auth-context';
import { getUserBooks, searchOpenLibrary } from '@/api/books';
import LibraryScreen from '@/app/(app)/(tabs)/books/index';
import { useRooms } from '@/contexts/rooms-context';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn() } }));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/contexts/rooms-context', () => ({ useRooms: jest.fn() }));
jest.mock('@/api/books', () => ({
    addToReadingList: jest.fn(),
    getOrCreateBook: jest.fn(),
    getUserBooks: jest.fn(),
    searchOpenLibrary: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } } });
    (useRooms as jest.Mock).mockReturnValue({ rooms: [] });
    (getUserBooks as jest.Mock).mockResolvedValue([
        {
            id: 'entry-1',
            status: 'want_to_read',
            book: { id: 'book-1', title: 'Harry Potter', author: 'J.K. Rowling', cover_url: null },
        },
        {
            id: 'entry-2',
            status: 'currently_reading',
            book: { id: 'book-2', title: 'Dune', author: 'Frank Herbert', cover_url: null },
        },
    ]);
});

describe('LibraryScreen', () => {
    it('shows the user\'s library by default', async () => {
        await render(<LibraryScreen />);

        await waitFor(() => expect(screen.getByText('Harry Potter')).toBeVisible());
    });

    it('splits the library into a continue-reading section and the rest', async () => {
        await render(<LibraryScreen />);

        await waitFor(() => expect(screen.getByText('Continue reading')).toBeVisible());
        expect(screen.getByText('My Library')).toBeVisible();
    });

    it('shows a compact Continue button on each currently-reading book', async () => {
        await render(<LibraryScreen />);

        await waitFor(() => expect(screen.getByText('Continue')).toBeVisible());
    });

    it('offers Continue reading only on the books being read right now', async () => {
        await render(<LibraryScreen />);
        await waitFor(() => expect(screen.getByText('Dune')).toBeVisible());

        // One button, for the one currently-reading book.
        expect(screen.getByLabelText('Continue reading Dune')).toBeVisible();
        expect(screen.queryByLabelText('Continue reading Harry Potter')).toBeNull();
    });

    it('switches to search results once the query is 3+ characters', async () => {
        (searchOpenLibrary as jest.Mock).mockResolvedValue([
            { openLibraryKey: 'ol-1', title: 'Piranesi', author: 'Susanna Clarke' },
        ]);
        await render(<LibraryScreen />);
        await waitFor(() => expect(screen.getByText('Harry Potter')).toBeVisible());

        await fireEvent.changeText(screen.getByPlaceholderText('Search by title or author'), 'pir');

        await waitFor(() => expect(screen.getByText('Piranesi')).toBeVisible());
        expect(screen.queryByText('Harry Potter')).toBeNull();
    });

    it('goes back to the library view once the query is cleared', async () => {
        await render(<LibraryScreen />);
        await waitFor(() => expect(screen.getByText('Harry Potter')).toBeVisible());

        const field = screen.getByPlaceholderText('Search by title or author');
        await fireEvent.changeText(field, 'pir');
        await fireEvent.changeText(field, '');

        await waitFor(() => expect(screen.getByText('Harry Potter')).toBeVisible());
    });
});
