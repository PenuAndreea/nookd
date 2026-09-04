import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import CurrentRoomBanner from '@/components/organisms/current-room-banner';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const room = {
    id: 'room-1',
    name: 'Rainy Library',
    vibe: 'quiet_company',
    members: [{ user_id: 'a', joined_at: '' }],
} as any;

beforeEach(() => jest.clearAllMocks());

describe('CurrentRoomBanner', () => {
    it('shows the room name, reader count and vibe', async () => {
        await render(<CurrentRoomBanner room={room} />);

        expect(screen.getByText('Rainy Library')).toBeVisible();
        expect(screen.getByText('1 reading · quiet company')).toBeVisible();
    });

    it('navigates to the room when the banner is tapped', async () => {
        await render(<CurrentRoomBanner room={room} />);

        await fireEvent.press(screen.getByText('Return to room  →'));

        expect(router.push).toHaveBeenCalledWith({ pathname: '/room/[id]', params: { id: 'room-1' } });
    });
});
