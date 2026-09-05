import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import {
    addToReadingList,
    getOrCreateBook,
    getUserBooks,
    searchOpenLibrary,
} from '@/api/books';
import { useBooksLibrary } from '@/hooks/use-books-library';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('@/api/books', () => ({
    addToReadingList: jest.fn(),
    getOrCreateBook: jest.fn(),
    getUserBooks: jest.fn(),
    searchOpenLibrary: jest.fn(),
}));

const library = [
    { id: 'e1', status: 'currently_reading', book: { id: 'b1', title: 'Dune' } },
    { id: 'e2', status: 'want_to_read', book: { id: 'b2', title: 'Circe' } },
    { id: 'e3', status: 'finished', book: { id: 'b3', title: 'Piranesi' } },
];

beforeEach(() => {
    jest.clearAllMocks();
    (getUserBooks as jest.Mock).mockResolvedValue([]);
});

describe('useBooksLibrary', () => {
    it('loads the whole library on mount, unfiltered by status', async () => {
        const { result } = await renderHook(() => useBooksLibrary('user-1'));

        await waitFor(() => expect(getUserBooks).toHaveBeenCalledWith('user-1'));
        expect(result.current.loadingList).toBe(false);
    });

    it('picks out the currently-reading books for the carousel', async () => {
        (getUserBooks as jest.Mock).mockResolvedValue(library);
        const { result } = await renderHook(() => useBooksLibrary('user-1'));

        await waitFor(() => expect(result.current.currentlyReading).toHaveLength(1));
        expect(result.current.currentlyReading[0].id).toBe('e1');
    });

    it('shows the whole library under the default "all" filter', async () => {
        (getUserBooks as jest.Mock).mockResolvedValue(library);
        const { result } = await renderHook(() => useBooksLibrary('user-1'));

        await waitFor(() => expect(result.current.filteredBooks).toHaveLength(3));
        expect(result.current.filter).toBe('all');
    });

    it('narrows the list to one status without refetching', async () => {
        (getUserBooks as jest.Mock).mockResolvedValue(library);
        const { result } = await renderHook(() => useBooksLibrary('user-1'));
        await waitFor(() => expect(getUserBooks).toHaveBeenCalledTimes(1));

        await act(async () => {
            result.current.setFilter('finished');
        });

        expect(result.current.filteredBooks.map((entry) => entry.id)).toEqual(['e3']);
        // Filtering is in-memory over the single fetch.
        expect(getUserBooks).toHaveBeenCalledTimes(1);
    });

    it('does not query the library without a signed-in user', async () => {
        await renderHook(() => useBooksLibrary(undefined));

        expect(getUserBooks).not.toHaveBeenCalled();
    });

    it('clears results and does not search below the 3-character threshold', async () => {
        const { result } = await renderHook(() => useBooksLibrary('user-1'));

        await act(async () => {
            await result.current.search('du');
        });

        expect(searchOpenLibrary).not.toHaveBeenCalled();
        expect(result.current.searchResults).toEqual([]);
        expect(result.current.isSearching).toBe(false);
    });

    it('searches once the query reaches 3 characters', async () => {
        const results = [{ openLibraryKey: 'k1', title: 'Dune', author: 'Frank Herbert' }];
        (searchOpenLibrary as jest.Mock).mockResolvedValue(results);
        const { result } = await renderHook(() => useBooksLibrary('user-1'));

        await act(async () => {
            await result.current.search('dun');
        });

        expect(searchOpenLibrary).toHaveBeenCalledWith('dun');
        expect(result.current.searchResults).toEqual(results);
        expect(result.current.isSearching).toBe(true);
    });

    it('surfaces a search error and clears stale results', async () => {
        (searchOpenLibrary as jest.Mock).mockRejectedValue(new Error('network down'));
        const { result } = await renderHook(() => useBooksLibrary('user-1'));

        await act(async () => {
            await result.current.search('dune');
        });

        expect(result.current.searchError).toBe(true);
        expect(result.current.searchResults).toEqual([]);
    });

    it('quick-adds a search result to the reading list and reloads the library', async () => {
        const book = { id: 'book-1' };
        (getOrCreateBook as jest.Mock).mockResolvedValue(book);
        const { result } = await renderHook(() => useBooksLibrary('user-1'));
        await waitFor(() => expect(getUserBooks).toHaveBeenCalledTimes(1));

        await act(async () => {
            await result.current.quickAdd({ openLibraryKey: 'k1', title: 'Dune', author: 'Frank Herbert' });
        });

        expect(addToReadingList).toHaveBeenCalledWith('user-1', 'book-1', 'want_to_read');
        // The list is no longer status-filtered, so an add always belongs in it.
        expect(getUserBooks).toHaveBeenCalledTimes(2);
    });

    it('opens the book on tapping a search result', async () => {
        const book = { id: 'book-1' };
        (getOrCreateBook as jest.Mock).mockResolvedValue(book);
        const { result } = await renderHook(() => useBooksLibrary('user-1'));

        await act(async () => {
            await result.current.openResult({ openLibraryKey: 'k1', title: 'Dune', author: 'Frank Herbert' });
        });

        expect(router.navigate).toHaveBeenCalledWith('/books/book-1');
    });
});
