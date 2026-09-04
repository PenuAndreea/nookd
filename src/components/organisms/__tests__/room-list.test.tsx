import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRooms } from '@/contexts/rooms-context';
import { useAuth } from '@/contexts/auth-context';
import RoomList from '@/components/organisms/room-list';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/contexts/rooms-context', () => ({ useRooms: jest.fn() }));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));

const otherRoom = {
    id: 'room-2',
    name: 'Sunlit Corner',
    vibe: 'quiet_company',
    members: [],
} as any;

const currentRoom = {
    id: 'room-1',
    name: 'Rainy Library',
    vibe: 'quiet_company',
    members: [{ user_id: 'me', joined_at: '' }],
} as any;

beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'me' } } });
});

describe('RoomList', () => {
    it('shows the current-room banner and other rooms', async () => {
        (useRooms as jest.Mock).mockReturnValue({
            rooms: [currentRoom, otherRoom],
            currentRoom,
            loading: false,
            refreshing: false,
            error: false,
            refresh: jest.fn(),
        });

        await render(<RoomList />);

        expect(screen.getByText('Rainy Library')).toBeVisible();
        expect(screen.getByText('Sunlit Corner')).toBeVisible();
    });

    it('shows an empty state with a create-room action when there are no rooms at all', async () => {
        (useRooms as jest.Mock).mockReturnValue({
            rooms: [],
            currentRoom: null,
            loading: false,
            refreshing: false,
            error: false,
            refresh: jest.fn(),
        });

        await render(<RoomList />);

        expect(screen.getByText('No silent rooms yet')).toBeVisible();
    });

    it('shows an error state with retry when loading rooms failed', async () => {
        const refresh = jest.fn();
        (useRooms as jest.Mock).mockReturnValue({
            rooms: [],
            currentRoom: null,
            loading: false,
            refreshing: false,
            error: true,
            refresh,
        });

        await render(<RoomList />);

        await fireEvent.press(screen.getByText('Try again'));
        expect(refresh).toHaveBeenCalled();
    });

    it('does not treat being the only member of the sole room as empty', async () => {
        (useRooms as jest.Mock).mockReturnValue({
            rooms: [currentRoom],
            currentRoom,
            loading: false,
            refreshing: false,
            error: false,
            refresh: jest.fn(),
        });

        await render(<RoomList />);

        expect(screen.queryByText('No silent rooms yet')).toBeNull();
    });
});
