import { renderHook, waitFor } from '@testing-library/react-native';

import { getActivelyReadBooks, getPopularBooks } from '@/api/books';
import { useExplore } from '@/hooks/use-explore';

jest.mock('@/api/books', () => ({
    getActivelyReadBooks: jest.fn(),
    getPopularBooks: jest.fn(),
}));

const dune = { id: 'book-1', title: 'Dune', cover_url: null };
const circe = { id: 'book-2', title: 'Circe', cover_url: null };

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
    (getActivelyReadBooks as jest.Mock).mockResolvedValue([]);
    (getPopularBooks as jest.Mock).mockResolvedValue([]);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('useExplore', () => {
    it('keys the "others reading" shelf by room, not by book', async () => {
        (getActivelyReadBooks as jest.Mock).mockResolvedValue([
            { id: 'room-1', book: dune },
            // Same book, a second room — both must survive as separate items.
            { id: 'room-2', book: dune },
        ]);
        const { result } = await renderHook(() => useExplore());

        await waitFor(() => expect(result.current.activelyReadItems).toHaveLength(2));
        expect(result.current.activelyReadItems.map((item) => item.key)).toEqual(['room-1', 'room-2']);
    });

    it('labels popular books with their room count', async () => {
        (getPopularBooks as jest.Mock).mockResolvedValue([{ book: circe, roomCount: 3 }]);
        const { result } = await renderHook(() => useExplore());

        await waitFor(() => expect(result.current.popularBookItems).toHaveLength(1));
        expect(result.current.popularBookItems[0]).toEqual({ key: 'book-2', book: circe, subtitle: '3 rooms' });
    });

    it('keeps one shelf when the other fails', async () => {
        (getActivelyReadBooks as jest.Mock).mockRejectedValue(new Error('network down'));
        (getPopularBooks as jest.Mock).mockResolvedValue([{ book: circe, roomCount: 1 }]);
        const { result } = await renderHook(() => useExplore());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.activelyReadItems).toEqual([]);
        expect(result.current.popularBookItems).toHaveLength(1);
    });
});
