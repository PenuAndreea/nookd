import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import RoomsScreen from '@/app/(app)/(tabs)/index';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
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

describe('RoomsScreen', () => {
    it('greets the user based on the time of day', async () => {
        mockHour(9);
        await render(<RoomsScreen />);

        expect(screen.getByText('Good morning, Mira')).toBeVisible();
    });

    it('shows a generic subtitle with no current room', async () => {
        mockHour(9);
        await render(<RoomsScreen />);

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

        await render(<RoomsScreen />);

        expect(screen.getByText('You left off in Rainy Library, 1 minute in.')).toBeVisible();
    });

    it('opens the You tab from the avatar', async () => {
        mockHour(9);
        await render(<RoomsScreen />);

        await fireEvent.press(screen.getByLabelText('You'));

        expect(router.navigate).toHaveBeenCalledWith('/you');
    });
});
