import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import SignInScreen from '@/app/(auth)/sign-in';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));

const replace = jest.fn();
const signIn = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    (useAuth as jest.Mock).mockReturnValue({ signIn });
});

describe('SignInScreen', () => {
    it('submits the entered credentials to signIn', async () => {
        signIn.mockResolvedValue({ error: null });
        await render(<SignInScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'me@example.com');
        await fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
        await fireEvent.press(screen.getAllByText('Sign in')[1]);

        await waitFor(() => expect(signIn).toHaveBeenCalledWith('me@example.com', 'secret123'));
    });

    it('shows the error returned by signIn', async () => {
        signIn.mockResolvedValue({ error: 'Invalid login credentials' });
        await render(<SignInScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'me@example.com');
        await fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'wrongpass');
        await fireEvent.press(screen.getAllByText('Sign in')[1]);

        await waitFor(() => expect(screen.getByText('Invalid login credentials')).toBeVisible());
    });

    it('navigates to sign-up when the footer link is tapped', async () => {
        await render(<SignInScreen />);

        await fireEvent.press(screen.getByText("Don't have an account? Sign up"));

        expect(replace).toHaveBeenCalledWith('/(auth)/sign-up');
    });
});
