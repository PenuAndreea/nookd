import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import RoomItem from '@/components/organisms/room-item';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));

const baseRoom = {
    id: 'room-1',
    name: 'Sunlit Corner',
    description: 'A warm patch of afternoon light.',
    vibe: 'quiet_company',
    book: null,
    members: [{ user_id: 'a', joined_at: '' }],
} as any;

beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'me' } } });
});

describe('RoomItem', () => {
    it('renders the room name and description', async () => {
        await render(<RoomItem room={baseRoom} />);

        expect(screen.getByText('Sunlit Corner')).toBeVisible();
        expect(screen.getByText('A warm patch of afternoon light.')).toBeVisible();
    });

    it('shows the book title when the room has one', async () => {
        await render(<RoomItem room={{ ...baseRoom, book: { title: 'Dune' } }} />);

        expect(screen.getByText('📖 Dune')).toBeVisible();
    });

    it('shows a Join button for a room the user has not joined', async () => {
        await render(<RoomItem room={baseRoom} />);

        expect(screen.getByText('Join')).toBeVisible();
    });

    it('hides the Join button once the user is already a member', async () => {
        await render(<RoomItem room={{ ...baseRoom, members: [{ user_id: 'me', joined_at: '' }] }} />);

        expect(screen.queryByText('Join')).toBeNull();
    });

    it('navigates to the room (without autojoin) when the card itself is tapped', async () => {
        await render(<RoomItem room={baseRoom} />);

        await fireEvent.press(screen.getByText('Sunlit Corner'));

        expect(router.push).toHaveBeenCalledWith({ pathname: '/room/[id]', params: { id: 'room-1' } });
    });

    it('navigates with autojoin when the Join button is tapped', async () => {
        await render(<RoomItem room={baseRoom} />);

        await fireEvent.press(screen.getByText('Join'));

        expect(router.push).toHaveBeenCalledWith({
            pathname: '/room/[id]',
            params: { id: 'room-1', autojoin: '1' },
        });
    });
});
