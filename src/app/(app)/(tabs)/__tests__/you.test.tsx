import { fireEvent, render, screen } from '@testing-library/react-native';

import YouScreen from '@/app/(app)/(tabs)/you';
import { useAuth } from '@/contexts/auth-context';

jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));

const signOut = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
        session: { user: { id: 'user-1', email: 'me@example.com' } },
        signOut,
    });
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
});
