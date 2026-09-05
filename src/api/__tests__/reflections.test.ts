import { addToReadingList, updateReadingListEntry } from '@/api/books';
import { saveReflection } from '@/api/reflections';
import { updateReadingSession } from '@/api/rooms';

jest.mock('@/api/books', () => ({
    addToReadingList: jest.fn(),
    updateReadingListEntry: jest.fn(),
}));
jest.mock('@/api/rooms', () => ({ updateReadingSession: jest.fn() }));

const base = {
    sessionId: 'session-1',
    bookId: 'book-1',
    userId: 'user-1',
    userBook: { id: 'entry-1', current_page: 60 } as never,
};
const moodOnly = { thoughts: '', pageReached: null, mood: 'cozy', finished: false };

beforeEach(() => jest.clearAllMocks());

describe('saveReflection', () => {
    it('records the reflection and stamps the session as prompted', async () => {
        await saveReflection({ ...base, data: { ...moodOnly, thoughts: 'Lovely' } });

        expect(updateReadingSession).toHaveBeenCalledWith('session-1', expect.objectContaining({
            thoughts: 'Lovely',
            mood: 'cozy',
            reflection_prompted_at: expect.any(String),
        }));
    });

    it('records pages as the gain over the reader\'s previous page', async () => {
        await saveReflection({ ...base, data: { ...moodOnly, pageReached: 95 } });

        expect(updateReadingSession).toHaveBeenCalledWith('session-1', expect.objectContaining({
            page_reached: 95,
            pages_read: 35,
        }));
    });

    it('never records negative pages when the page went backwards', async () => {
        await saveReflection({ ...base, data: { ...moodOnly, pageReached: 20 } });

        expect(updateReadingSession).toHaveBeenCalledWith('session-1', expect.objectContaining({
            pages_read: 0,
        }));
    });

    it('counts from zero when the reader has no library entry yet', async () => {
        await saveReflection({ ...base, userBook: null, data: { ...moodOnly, pageReached: 20 } });

        expect(updateReadingSession).toHaveBeenCalledWith('session-1', expect.objectContaining({
            pages_read: 20,
        }));
        expect(addToReadingList).toHaveBeenCalledWith('user-1', 'book-1', 'currently_reading');
    });

    it('does not touch the library when a mood-only reflection changes nothing there', async () => {
        // An empty PATCH body is rejected outright, which surfaced as
        // "Couldn't save" on a reflection that had in fact been saved.
        await saveReflection({ ...base, data: moodOnly });

        expect(updateReadingSession).toHaveBeenCalled();
        expect(updateReadingListEntry).not.toHaveBeenCalled();
    });

    it('updates the library when there is something to change', async () => {
        await saveReflection({ ...base, data: { ...moodOnly, pageReached: 95, finished: true } });

        expect(updateReadingListEntry).toHaveBeenCalledWith('entry-1', expect.objectContaining({
            current_page: 95,
            status: 'finished',
        }));
    });

    it('skips the library entirely for a session with no book', async () => {
        await saveReflection({ ...base, bookId: null, data: { ...moodOnly, pageReached: 95 } });

        expect(updateReadingListEntry).not.toHaveBeenCalled();
        expect(addToReadingList).not.toHaveBeenCalled();
    });
});
