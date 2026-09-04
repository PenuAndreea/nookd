import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import AuthForm from '@/components/organisms/auth-form';

const baseProps = {
    title: 'Welcome back',
    submitLabel: 'Sign in',
    footerPrompt: "Don't have an account?",
    footerActionLabel: 'Sign up',
    onFooterPress: jest.fn(),
};

async function fillAndSubmit(email: string, password: string) {
    if (email) await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), email);
    if (password) await fireEvent.changeText(screen.getByPlaceholderText('••••••••'), password);
    await fireEvent.press(screen.getByText('Sign in'));
}

beforeEach(() => jest.clearAllMocks());

describe('AuthForm', () => {
    it('renders the title and footer prompt', async () => {
        await render(<AuthForm {...baseProps} onSubmit={jest.fn()} />);

        expect(screen.getByText('Welcome back')).toBeVisible();
        expect(screen.getByText("Don't have an account? Sign up")).toBeVisible();
    });

    it('blocks submission and shows an error when fields are missing', async () => {
        const onSubmit = jest.fn();
        await render(<AuthForm {...baseProps} onSubmit={onSubmit} />);

        await fireEvent.press(screen.getByText('Sign in'));

        expect(screen.getByText('Please enter an email and password.')).toBeVisible();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('runs a custom validator before submitting', async () => {
        const onSubmit = jest.fn();
        const validate = jest.fn(() => 'Password must be at least 6 characters.');
        await render(<AuthForm {...baseProps} onSubmit={onSubmit} validate={validate} />);

        await fillAndSubmit('me@example.com', '123');

        expect(screen.getByText('Password must be at least 6 characters.')).toBeVisible();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits with the entered credentials once validation passes', async () => {
        const onSubmit = jest.fn().mockResolvedValue({ error: null });
        await render(<AuthForm {...baseProps} onSubmit={onSubmit} />);

        await fillAndSubmit('me@example.com', 'secret123');

        expect(onSubmit).toHaveBeenCalledWith('me@example.com', 'secret123');
    });

    it('shows the error returned by onSubmit', async () => {
        const onSubmit = jest.fn().mockResolvedValue({ error: 'Invalid login credentials' });
        await render(<AuthForm {...baseProps} onSubmit={onSubmit} />);

        await fillAndSubmit('me@example.com', 'wrongpass');

        await waitFor(() => expect(screen.getByText('Invalid login credentials')).toBeVisible());
    });

    it('calls onFooterPress when the footer link is tapped', async () => {
        const onFooterPress = jest.fn();
        await render(<AuthForm {...baseProps} onSubmit={jest.fn()} onFooterPress={onFooterPress} />);

        await fireEvent.press(screen.getByText("Don't have an account? Sign up"));

        expect(onFooterPress).toHaveBeenCalledTimes(1);
    });

    it('uses a custom password placeholder when given one', async () => {
        await render(
            <AuthForm {...baseProps} onSubmit={jest.fn()} passwordPlaceholder="At least 6 characters" />
        );

        expect(screen.getByPlaceholderText('At least 6 characters')).toBeVisible();
    });
});
