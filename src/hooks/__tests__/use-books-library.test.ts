import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import {
    addToReadingList,
    getActivelyReadBooks,
    getOrCreateBook,
    getPopularBooks,
    getUserBooks,
    searchOpenLibrary,
} from '@/api/books';
import { useBooksLibrary } from '@/hooks/use-books-library';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
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
    (getActivelyReadBooks as jest.Mock).mockResolvedValue([]);
    (getPopularBooks as jest.Mock).mockResolvedValue([]);
    (getUserBooks as jest.Mock).mockResolvedValue([]);
});

describe('useBooksLibrary', () => {
    it('loads the user\'s library for the default status on mount', async () => {
        const { result } = await renderHook(() => useBooksLibrary('user-1'));

        await waitFor(() => expect(getUserBooks).toHaveBeenCalledWith('user-1', 'currently_reading'));
        expect(result.current.loadingList).toBe(false);
    });

    it('does not query the library without a signed-in user', async () => {
        await renderHook(() => useBooksLibrary(undefined));

        expect(getUserBooks).not.toHaveBeenCalled();
    });

    it('reloads the library when the status filter changes', async () => {
        const { result } = await renderHook(() => useBooksLibrary('user-1'));
        await waitFor(() => expect(getUserBooks).toHaveBeenCalledTimes(1));

        await act(async () => {
            result.current.setStatus('finished');
        });

        await waitFor(() => expect(getUserBooks).toHaveBeenLastCalledWith('user-1', 'finished'));
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

    it('quick-adds a search result to the reading list and reloads only if the filter matches', async () => {
        const book = { id: 'book-1' };
        (getOrCreateBook as jest.Mock).mockResolvedValue(book);
        const { result } = await renderHook(() => useBooksLibrary('user-1'));

        // Currently viewing "currently_reading" — a want_to_read add shouldn't reload it.
        await act(async () => {
            await result.current.quickAdd({ openLibraryKey: 'k1', title: 'Dune', author: 'Frank Herbert' });
        });

        expect(addToReadingList).toHaveBeenCalledWith('user-1', 'book-1', 'want_to_read');
        expect(getUserBooks).toHaveBeenCalledTimes(1); // only the initial mount load

        await act(async () => {
            result.current.setStatus('want_to_read');
        });
        await waitFor(() => expect(getUserBooks).toHaveBeenCalledTimes(2));

        await act(async () => {
            await result.current.quickAdd({ openLibraryKey: 'k2', title: 'Circe', author: 'Madeline Miller' });
        });

        // Now the filter matches the added status, so the list reloads again.
        expect(getUserBooks).toHaveBeenCalledTimes(3);
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
