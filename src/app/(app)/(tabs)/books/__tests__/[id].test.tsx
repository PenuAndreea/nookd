import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
    addToReadingList,
    countActiveRoomsForBook,
    getBook,
    getUserBookForBook,
    updateReadingListEntry,
} from '@/api/books';
import { useAuth } from '@/contexts/auth-context';
import BookDetailScreen from '@/app/(app)/(tabs)/books/[id]';

jest.mock('expo-router', () => ({
    useLocalSearchParams: jest.fn(),
    useRouter: jest.fn(() => ({ back: jest.fn() })),
}));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/api/books', () => ({
    addToReadingList: jest.fn(),
    countActiveRoomsForBook: jest.fn(),
    getBook: jest.fn(),
    getUserBookForBook: jest.fn(),
    updateReadingListEntry: jest.fn(),
}));

const book = { id: 'book-1', title: 'Dune', author: 'Frank Herbert', cover_url: null, description: null, page_count: 412 };

beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'book-1' });
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } } });
    (getBook as jest.Mock).mockResolvedValue(book);
    (countActiveRoomsForBook as jest.Mock).mockResolvedValue(0);
    (getUserBookForBook as jest.Mock).mockResolvedValue(null);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('BookDetailScreen', () => {
    it('shows an error state with retry when loading fails', async () => {
        (getBook as jest.Mock).mockRejectedValue(new Error('offline'));
        await render(<BookDetailScreen />);

        await waitFor(() => expect(screen.getByText("Couldn't load this book")).toBeVisible());

        (getBook as jest.Mock).mockResolvedValueOnce(book);
        await fireEvent.press(screen.getByText('Try again'));

        await waitFor(() => expect(screen.getByText('Dune')).toBeVisible());
    });

    it('shows the book and an add-to-list button when not yet in the library', async () => {
        await render(<BookDetailScreen />);

        await waitFor(() => expect(screen.getByText('Dune')).toBeVisible());
        expect(screen.getByText('Add to reading list')).toBeVisible();
    });

    it('adds the book to the reading list', async () => {
        const entry = { id: 'entry-1', status: 'want_to_read', current_page: null, started_at: null };
        (addToReadingList as jest.Mock).mockResolvedValue(entry);
        await render(<BookDetailScreen />);
        await waitFor(() => expect(screen.getByText('Add to reading list')).toBeVisible());

        await fireEvent.press(screen.getByText('Add to reading list'));

        await waitFor(() => expect(screen.getByText('Want to read')).toBeVisible());
        expect(addToReadingList).toHaveBeenCalledWith('user-1', 'book-1', 'want_to_read');
    });

    it('shows status chips and a page field for a book already being read', async () => {
        (getUserBookForBook as jest.Mock).mockResolvedValue({
            id: 'entry-1', status: 'currently_reading', current_page: 120, started_at: '2024-01-01T00:00:00.000Z',
        });
        await render(<BookDetailScreen />);

        await waitFor(() => expect(screen.getByText('Currently reading')).toBeVisible());
        expect(screen.getByDisplayValue('120')).toBeVisible();
        expect(screen.getByText('Current page (of 412)')).toBeVisible();
    });

    it('sets started_at only the first time a book moves to currently reading', async () => {
        (getUserBookForBook as jest.Mock).mockResolvedValue({ id: 'entry-1', status: 'want_to_read', current_page: null, started_at: null });
        (updateReadingListEntry as jest.Mock).mockResolvedValue({ id: 'entry-1', status: 'currently_reading', current_page: null, started_at: '2024-01-01T00:00:00.000Z' });
        await render(<BookDetailScreen />);
        await waitFor(() => expect(screen.getByText('Want to read')).toBeVisible());

        await fireEvent.press(screen.getByText('Currently reading'));

        await waitFor(() =>
            expect(updateReadingListEntry).toHaveBeenCalledWith(
                'entry-1',
                expect.objectContaining({ status: 'currently_reading', started_at: expect.any(String) })
            )
        );
    });

    it('stamps finished_at when marking a book finished', async () => {
        (getUserBookForBook as jest.Mock).mockResolvedValue({ id: 'entry-1', status: 'currently_reading', current_page: 400, started_at: '2024-01-01T00:00:00.000Z' });
        (updateReadingListEntry as jest.Mock).mockResolvedValue({ id: 'entry-1', status: 'finished', current_page: 400, started_at: '2024-01-01T00:00:00.000Z', finished_at: '2024-06-01T00:00:00.000Z' });
        await render(<BookDetailScreen />);
        await waitFor(() => expect(screen.getByText('Currently reading')).toBeVisible());

        await fireEvent.press(screen.getByText('Finished'));

        await waitFor(() =>
            expect(updateReadingListEntry).toHaveBeenCalledWith(
                'entry-1',
                expect.objectContaining({ status: 'finished', finished_at: expect.any(String) })
            )
        );
    });

    it('saves page progress via the inline Save button', async () => {
        (getUserBookForBook as jest.Mock).mockResolvedValue({ id: 'entry-1', status: 'currently_reading', current_page: 100, started_at: '2024-01-01T00:00:00.000Z' });
        (updateReadingListEntry as jest.Mock).mockResolvedValue({ id: 'entry-1', status: 'currently_reading', current_page: 200, started_at: '2024-01-01T00:00:00.000Z' });
        await render(<BookDetailScreen />);
        await waitFor(() => expect(screen.getByDisplayValue('100')).toBeVisible());

        await fireEvent.changeText(screen.getByDisplayValue('100'), '200');
        await fireEvent.press(screen.getByText('Save'));

        await waitFor(() => expect(updateReadingListEntry).toHaveBeenCalledWith('entry-1', { current_page: 200 }));
    });

    it('shows an error alert when saving the status fails', async () => {
        (getUserBookForBook as jest.Mock).mockResolvedValue({ id: 'entry-1', status: 'want_to_read', current_page: null, started_at: null });
        (updateReadingListEntry as jest.Mock).mockRejectedValue(new Error('offline'));
        await render(<BookDetailScreen />);
        await waitFor(() => expect(screen.getByText('Want to read')).toBeVisible());

        await fireEvent.press(screen.getByText('Finished'));

        await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't update status", 'Something went wrong. Please try again.'));
    });
});
