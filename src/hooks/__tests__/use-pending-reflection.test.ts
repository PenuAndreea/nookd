import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getUserBookForBook } from '@/api/books';
import { dismissReflection, saveReflection } from '@/api/reflections';
import { getPendingReflection } from '@/api/stats';
import { usePendingReflection } from '@/hooks/use-pending-reflection';

jest.mock('@/api/stats', () => ({ getPendingReflection: jest.fn() }));
jest.mock('@/api/books', () => ({ getUserBookForBook: jest.fn() }));
jest.mock('@/api/reflections', () => ({
    saveReflection: jest.fn(),
    dismissReflection: jest.fn(),
}));

const session = {
    id: 'session-1',
    created_at: '2026-09-05T18:00:00+00:00',
    ended_at: '2026-09-05T18:42:00+00:00',
    duration_minutes: 42,
    book_id: 'book-1',
    room_name: 'Rainy Library',
};

const reflection = { thoughts: 'Lovely', pageReached: 80, mood: 'cozy', finished: false };

beforeEach(() => {
    jest.clearAllMocks();
    (getPendingReflection as jest.Mock).mockResolvedValue(null);
    (getUserBookForBook as jest.Mock).mockResolvedValue(null);
});

describe('usePendingReflection', () => {
    it('does not query without a signed-in reader', async () => {
        await renderHook(() => usePendingReflection(undefined));

        expect(getPendingReflection).not.toHaveBeenCalled();
    });

    it('is empty when nothing is owed, which is the usual case', async () => {
        const { result } = await renderHook(() => usePendingReflection('user-1'));

        await waitFor(() => expect(getPendingReflection).toHaveBeenCalledWith('user-1'));
        expect(result.current.pending).toBeNull();
    });

    it('loads the session and the library entry needed for the page delta', async () => {
        (getPendingReflection as jest.Mock).mockResolvedValue(session);
        (getUserBookForBook as jest.Mock).mockResolvedValue({ id: 'entry-1', current_page: 60 });

        const { result } = await renderHook(() => usePendingReflection('user-1'));

        await waitFor(() => expect(result.current.pending).toEqual(session));
        expect(getUserBookForBook).toHaveBeenCalledWith('user-1', 'book-1');
        expect(result.current.userBook).toEqual({ id: 'entry-1', current_page: 60 });
    });

    it('skips the library lookup when the session had no book', async () => {
        (getPendingReflection as jest.Mock).mockResolvedValue({ ...session, book_id: null });

        const { result } = await renderHook(() => usePendingReflection('user-1'));

        await waitFor(() => expect(result.current.pending).not.toBeNull());
        expect(getUserBookForBook).not.toHaveBeenCalled();
    });

    it('saves a submitted reflection and stops offering it', async () => {
        (getPendingReflection as jest.Mock).mockResolvedValue(session);
        (getUserBookForBook as jest.Mock).mockResolvedValue({ id: 'entry-1', current_page: 60 });

        const { result } = await renderHook(() => usePendingReflection('user-1'));
        await waitFor(() => expect(result.current.pending).not.toBeNull());

        await act(async () => {
            await result.current.submit(reflection);
        });

        expect(saveReflection).toHaveBeenCalledWith({
            sessionId: 'session-1',
            bookId: 'book-1',
            userBook: { id: 'entry-1', current_page: 60 },
            userId: 'user-1',
            data: reflection,
        });
        expect(result.current.pending).toBeNull();
    });

    it('records a dismissal so the session is not offered again', async () => {
        (getPendingReflection as jest.Mock).mockResolvedValue(session);

        const { result } = await renderHook(() => usePendingReflection('user-1'));
        await waitFor(() => expect(result.current.pending).not.toBeNull());

        await act(async () => {
            await result.current.dismiss();
        });

        expect(dismissReflection).toHaveBeenCalledWith('session-1');
        expect(result.current.pending).toBeNull();
    });

    it('still clears the card when recording the dismissal fails', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        (getPendingReflection as jest.Mock).mockResolvedValue(session);
        (dismissReflection as jest.Mock).mockRejectedValue(new Error('offline'));

        const { result } = await renderHook(() => usePendingReflection('user-1'));
        await waitFor(() => expect(result.current.pending).not.toBeNull());

        await act(async () => {
            await result.current.dismiss();
        });

        // A reader who declined should not be re-asked in the same sitting
        // just because the write did not land.
        expect(result.current.pending).toBeNull();
    });

    it('does not disturb the screen when the lookup fails', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        (getPendingReflection as jest.Mock).mockRejectedValue(new Error('offline'));

        const { result } = await renderHook(() => usePendingReflection('user-1'));

        await waitFor(() => expect(getPendingReflection).toHaveBeenCalled());
        expect(result.current.pending).toBeNull();
    });
});
