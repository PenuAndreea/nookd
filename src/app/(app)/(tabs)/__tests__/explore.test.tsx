import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { getActivelyReadBooks, getPopularBooks } from '@/api/books';
import ExploreScreen from '@/app/(app)/(tabs)/explore';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
jest.mock('@/api/books', () => ({
    getActivelyReadBooks: jest.fn(),
    getPopularBooks: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
    (getActivelyReadBooks as jest.Mock).mockResolvedValue([
        { id: 'room-1', book: { id: 'book-1', title: 'Dune', cover_url: null } },
    ]);
    (getPopularBooks as jest.Mock).mockResolvedValue([
        { book: { id: 'book-2', title: 'Circe', cover_url: null }, roomCount: 3 },
    ]);
});

describe('ExploreScreen', () => {
    it('shows both discovery shelves', async () => {
        await render(<ExploreScreen />);

        await waitFor(() => expect(screen.getByText('What others are currently reading')).toBeVisible());
        expect(screen.getByText('Popular books')).toBeVisible();
        expect(screen.getByText('Dune')).toBeVisible();
        expect(screen.getByText('Circe')).toBeVisible();
        expect(screen.getByText('3 rooms')).toBeVisible();
    });

    it('takes you into the room when tapping what someone is reading', async () => {
        await render(<ExploreScreen />);
        await waitFor(() => expect(screen.getByText('Dune')).toBeVisible());

        await fireEvent.press(screen.getByText('Dune'));

        expect(router.push).toHaveBeenCalledWith({ pathname: '/room/[id]', params: { id: 'room-1' } });
    });

    it('opens the book detail when tapping a popular book', async () => {
        await render(<ExploreScreen />);
        await waitFor(() => expect(screen.getByText('Circe')).toBeVisible());

        await fireEvent.press(screen.getByText('Circe'));

        expect(router.navigate).toHaveBeenCalledWith('/books/book-2');
    });

    it('shows an empty state when there is nothing to explore', async () => {
        (getActivelyReadBooks as jest.Mock).mockResolvedValue([]);
        (getPopularBooks as jest.Mock).mockResolvedValue([]);

        await render(<ExploreScreen />);

        await waitFor(() => expect(screen.getByText('Nothing to explore yet')).toBeVisible());
    });
});
