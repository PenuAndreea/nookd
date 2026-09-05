import { fireEvent, render, screen } from '@testing-library/react-native';
import type { StatsSession } from '@/api/stats';
import StatsJournalCard from '@/components/organisms/stats-journal-card';

function session(id: string, overrides: Partial<StatsSession> = {}): StatsSession {
    return {
        id,
        created_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_minutes: 30,
        ended_reason: 'left',
        mood: null,
        page_reached: null,
        pages_read: null,
        thoughts: null,
        room_id: 'room-1',
        room_name: 'Rainy Library',
        room_vibe: 'quiet_company',
        book_id: null,
        reflection_prompted_at: null,
        book: null,
        ...overrides,
    } as StatsSession;
}

const book = {
    id: 'book-1', title: 'Klara and the Sun', author: 'Kazuo Ishiguro',
    cover_url: null, page_count: 303,
};

describe('StatsJournalCard', () => {
    it('shows what the reader wrote, verbatim', async () => {
        await render(
            <StatsJournalCard
                sessions={[session('a', { thoughts: 'Got properly lost in this one tonight.' })]}
            />
        );

        expect(screen.getByText('Got properly lost in this one tonight.')).toBeVisible();
    });

    it('shows the book and mood alongside the note', async () => {
        await render(
            <StatsJournalCard
                sessions={[session('a', { thoughts: 'Slow going.', mood: 'cozy', book_id: 'book-1', book })]}
            />
        );

        expect(screen.getByText('Klara and the Sun')).toBeVisible();
        expect(screen.getByText('Cozy')).toBeVisible();
    });

    it('falls back to the room name when no book was logged', async () => {
        await render(<StatsJournalCard sessions={[session('a', { thoughts: 'Quiet one.' })]} />);

        expect(screen.getByText('Rainy Library')).toBeVisible();
    });

    it('ignores sessions with no note, and whitespace-only notes', async () => {
        await render(
            <StatsJournalCard
                sessions={[session('a'), session('b', { thoughts: '   ' })]}
            />
        );

        expect(screen.getByText('Nothing written yet')).toBeVisible();
    });

    it('previews a few and expands to the rest on request', async () => {
        const sessions = ['a', 'b', 'c', 'd', 'e'].map((id) =>
            session(id, { thoughts: `Note ${id}` })
        );

        await render(<StatsJournalCard sessions={sessions} />);

        expect(screen.getByText('Note a')).toBeVisible();
        expect(screen.queryByText('Note e')).toBeNull();

        await fireEvent.press(screen.getByText('Show all 5'));

        expect(screen.getByText('Note e')).toBeVisible();

        await fireEvent.press(screen.getByText('Show fewer'));

        expect(screen.queryByText('Note e')).toBeNull();
    });

    it('does not offer to expand when everything already fits', async () => {
        await render(<StatsJournalCard sessions={[session('a', { thoughts: 'Only one.' })]} />);

        expect(screen.queryByText(/Show all/)).toBeNull();
    });
});
