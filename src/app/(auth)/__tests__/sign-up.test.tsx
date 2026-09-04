import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import SignUpScreen from '@/app/(auth)/sign-up';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));

const replace = jest.fn();
const signUp = jest.fn();

async function fillAndSubmit(email: string, password: string) {
    if (email) await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), email);
    if (password) await fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), password);
    await fireEvent.press(screen.getByText('Sign up'));
}

beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    (useAuth as jest.Mock).mockReturnValue({ signUp });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('SignUpScreen', () => {
    it('validates the password length before calling signUp', async () => {
        await render(<SignUpScreen />);

        await fillAndSubmit('me@example.com', '123');

        expect(screen.getByText('Password must be at least 6 characters.')).toBeVisible();
        expect(signUp).not.toHaveBeenCalled();
    });

    it('on success, confirms by email and redirects to sign-in', async () => {
        signUp.mockResolvedValue({ error: null });
        await render(<SignUpScreen />);

        await fillAndSubmit('me@example.com', 'secret123');

        await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Check your email', expect.any(String)));
        expect(replace).toHaveBeenCalledWith('/(auth)/sign-in');
    });

    it('shows a signup error instead of redirecting', async () => {
        signUp.mockResolvedValue({ error: 'Email already registered' });
        await render(<SignUpScreen />);

        await fillAndSubmit('me@example.com', 'secret123');

        await waitFor(() => expect(screen.getByText('Email already registered')).toBeVisible());
        expect(replace).not.toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('navigates to sign-in when the footer link is tapped', async () => {
        await render(<SignUpScreen />);

        await fireEvent.press(screen.getByText('Already have an account? Sign in'));

        expect(replace).toHaveBeenCalledWith('/(auth)/sign-in');
    });
});
