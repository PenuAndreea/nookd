import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/contexts/auth-context';
import {
    getActivelyReadBooks,
    getPopularBooks,
    getUserBooks,
    searchOpenLibrary,
} from '@/api/books';
import BooksScreen from '@/app/(app)/(tabs)/books/index';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/api/books', () => ({
    addToReadingList: jest.fn(),
    getActivelyReadBooks: jest.fn(),
    getOrCreateBook: jest.fn(),
    getPopularBooks: jest.fn(),
    getUserBooks: jest.fn(),
    searchOpenLibrary: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } } });
    (getActivelyReadBooks as jest.Mock).mockResolvedValue([]);
    (getPopularBooks as jest.Mock).mockResolvedValue([]);
    (getUserBooks as jest.Mock).mockResolvedValue([
        { id: 'entry-1', book: { id: 'book-1', title: 'Harry Potter', author: 'J.K. Rowling', cover_url: null } },
    ]);
});

describe('BooksScreen', () => {
    it('shows the user\'s library by default', async () => {
        await render(<BooksScreen />);

        await waitFor(() => expect(screen.getByText('Harry Potter')).toBeVisible());
    });

    it('switches to search results once the query is 3+ characters', async () => {
        (searchOpenLibrary as jest.Mock).mockResolvedValue([
            { openLibraryKey: 'ol-1', title: 'Dune', author: 'Frank Herbert' },
        ]);
        await render(<BooksScreen />);
        await waitFor(() => expect(screen.getByText('Harry Potter')).toBeVisible());

        await fireEvent.changeText(screen.getByPlaceholderText('Search by title or author'), 'dun');

        await waitFor(() => expect(screen.getByText('Dune')).toBeVisible());
        expect(screen.queryByText('Harry Potter')).toBeNull();
    });

    it('goes back to the library view once the query is cleared', async () => {
        await render(<BooksScreen />);
        await waitFor(() => expect(screen.getByText('Harry Potter')).toBeVisible());

        const field = screen.getByPlaceholderText('Search by title or author');
        await fireEvent.changeText(field, 'dun');
        await fireEvent.changeText(field, '');

        await waitFor(() => expect(screen.getByText('Harry Potter')).toBeVisible());
    });
});
