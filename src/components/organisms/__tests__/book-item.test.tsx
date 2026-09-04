import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import BookItem from '@/components/organisms/book-item';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

const userBook = {
    id: 'entry-1',
    status: 'currently_reading',
    current_page: 150,
    book: { id: 'book-1', title: 'Dune', author: 'Frank Herbert', cover_url: null, page_count: 412 },
} as any;

beforeEach(() => jest.clearAllMocks());

describe('BookItem', () => {
    it('renders the title and author', async () => {
        await render(<BookItem userBook={userBook} />);

        expect(screen.getByText('Dune')).toBeVisible();
        expect(screen.getByText('Frank Herbert')).toBeVisible();
    });

    it('navigates to the book on press', async () => {
        await render(<BookItem userBook={userBook} />);

        await fireEvent.press(screen.getByText('Dune'));

        expect(router.navigate).toHaveBeenCalledWith('/books/book-1');
    });

    it('shows a progress bar for a book currently being read with a known page count', async () => {
        await render(<BookItem userBook={userBook} />);

        expect(screen.getByTestId('book-item-progress')).toBeVisible();
    });

    it('shows no progress bar for a book that is not currently being read', async () => {
        await render(<BookItem userBook={{ ...userBook, status: 'want_to_read' }} />);

        expect(screen.queryByTestId('book-item-progress')).toBeNull();
    });

    it('shows no progress bar when the book has no known page count', async () => {
        await render(<BookItem userBook={{ ...userBook, book: { ...userBook.book, page_count: null } }} />);

        expect(screen.queryByTestId('book-item-progress')).toBeNull();
    });
});
