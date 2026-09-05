import { fireEvent, render, screen } from '@testing-library/react-native';

import YouScreen from '@/app/(app)/(tabs)/you';
import { useAuth } from '@/contexts/auth-context';
import { useReadingStats } from '@/hooks/use-reading-stats';
import { summarize } from '@/lib/stats';

jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/use-reading-stats', () => ({ useReadingStats: jest.fn() }));

const signOut = jest.fn();
const setRange = jest.fn();
const reload = jest.fn();

/** The real summarize(), so the screen is asserted against real shapes. */
function summaryOf(sessions: Parameters<typeof summarize>[0]) {
    return summarize(sessions);
}

function mockStats(overrides: Partial<ReturnType<typeof useReadingStats>> = {}) {
    (useReadingStats as jest.Mock).mockReturnValue({
        summary: summaryOf([]),
        sessions: [],
        loading: false,
        error: false,
        range: 'week',
        setRange,
        reload,
        ...overrides,
    });
}

function session(minutes: number, overrides: Record<string, unknown> = {}) {
    return {
        id: `session-${minutes}`,
        created_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_minutes: minutes,
        ended_reason: 'left',
        mood: null,
        page_reached: null,
        thoughts: null,
        room_id: 'room-1',
        room_name: 'Rainy Library',
        room_vibe: 'quiet_company',
        book_id: null,
        reflection_prompted_at: null,
        book: null,
        ...overrides,
    } as unknown as Parameters<typeof summarize>[0][number];
}

beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
        session: { user: { id: 'user-1', email: 'me@example.com' } },
        signOut,
    });
    mockStats();
});

describe('YouScreen', () => {
    it('shows the signed-in email', async () => {
        await render(<YouScreen />);

        expect(screen.getByText('me@example.com')).toBeVisible();
    });

    it('renders without an email', async () => {
        (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, signOut });

        await render(<YouScreen />);

        expect(screen.getByText('Sign out')).toBeVisible();
    });

    it('signs out when the button is tapped', async () => {
        await render(<YouScreen />);

        await fireEvent.press(screen.getByText('Sign out'));

        expect(signOut).toHaveBeenCalledTimes(1);
    });

    it('shows the empty state for a reader with no sessions', async () => {
        await render(<YouScreen />);

        expect(screen.getByText('No sessions yet')).toBeVisible();
        expect(screen.queryByText('Time & sessions')).toBeNull();
    });

    it('still shows the empty state when the only session was a sub-minute bounce', async () => {
        mockStats({ summary: summaryOf([session(0)]) });

        await render(<YouScreen />);

        expect(screen.getByText('No sessions yet')).toBeVisible();
    });

    it('renders every stats section once there is reading to show', async () => {
        mockStats({ summary: summaryOf([session(45)]) });

        await render(<YouScreen />);

        expect(screen.getByText('Time & sessions')).toBeVisible();
        expect(screen.getByText('Books & pages')).toBeVisible();
        expect(screen.getByText('Habits & reflection')).toBeVisible();
    });

    it('shows the total time read', async () => {
        mockStats({ summary: summaryOf([session(45), session(30)]) });

        await render(<YouScreen />);

        // 75 minutes formatted as hours and minutes.
        expect(screen.getByText('1h 15m')).toBeVisible();
    });

    it('states time that belongs to no book, rather than hiding it', async () => {
        const book = {
            id: 'book-1', title: 'Klara and the Sun', author: 'Kazuo Ishiguro',
            cover_url: null, page_count: 303,
        };
        mockStats({
            summary: summaryOf([session(40, { book_id: 'book-1', book }), session(20)]),
        });

        await render(<YouScreen />);

        expect(screen.getByText('20m with no book logged')).toBeVisible();
    });

    it('switches range when a chip is tapped', async () => {
        await render(<YouScreen />);

        await fireEvent.press(screen.getByText('Month'));

        expect(setRange).toHaveBeenCalledWith('month');
    });

    it('shows a spinner while the first load is in flight', async () => {
        mockStats({ loading: true });

        await render(<YouScreen />);

        expect(screen.getByTestId('you-loading')).toBeVisible();
    });

    it('offers a retry when the load failed', async () => {
        mockStats({ error: true });

        await render(<YouScreen />);

        expect(screen.getByText("Couldn't load your stats")).toBeVisible();

        await fireEvent.press(screen.getByText('Try again'));

        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('keeps showing stats when a refresh fails, rather than blanking them', async () => {
        mockStats({ error: true, summary: summaryOf([session(45)]) });

        await render(<YouScreen />);

        expect(screen.getByText('Time & sessions')).toBeVisible();
        expect(screen.queryByText("Couldn't load your stats")).toBeNull();
    });
});
