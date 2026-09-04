import { fireEvent, render, screen } from '@testing-library/react-native';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import HomeScreen from '@/app/(app)/(tabs)/index';

jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/contexts/rooms-context', () => ({ useRooms: jest.fn() }));

const session = { user: { id: 'user-1', email: 'me@example.com' } };

beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session, signOut: jest.fn() });
    (useRooms as jest.Mock).mockReturnValue({
        rooms: [],
        currentRoom: null,
        loading: false,
        refreshing: false,
        error: false,
        refresh: jest.fn(),
    });
});

// A fixed hour keeps the greeting deterministic across test runs/timezones.
function mockHour(hour: number) {
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(hour);
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe('HomeScreen', () => {
    it('greets the user based on the time of day', async () => {
        mockHour(9);
        await render(<HomeScreen />);

        expect(screen.getByText('Good morning, Mira')).toBeVisible();
    });

    it('shows a generic subtitle with no current room', async () => {
        mockHour(9);
        await render(<HomeScreen />);

        expect(screen.getByText('Find your quiet place to read.')).toBeVisible();
    });

    it('shows a "return to room" subtitle when the user is in one', async () => {
        mockHour(9);
        (useRooms as jest.Mock).mockReturnValue({
            rooms: [],
            currentRoom: {
                id: 'room-1',
                name: 'Rainy Library',
                members: [{ user_id: 'user-1', joined_at: new Date(Date.now() - 60_000).toISOString() }],
            },
            loading: false,
            refreshing: false,
            error: false,
            refresh: jest.fn(),
        });

        await render(<HomeScreen />);

        expect(screen.getByText('You left off in Rainy Library, 1 minute in.')).toBeVisible();
    });

    it('wires the signed-in user into the profile sheet', async () => {
        mockHour(9);
        await render(<HomeScreen />);

        // The mocked BottomSheet always renders its content regardless of
        // open/closed state, so this checks the sheet receives the right
        // user rather than that tapping visually opens it.
        expect(screen.getByText('me@example.com')).toBeVisible();
    });

    it('does not crash when the avatar is tapped', async () => {
        mockHour(9);
        await render(<HomeScreen />);

        await fireEvent.press(screen.getByLabelText('Open profile'));
    });
});
