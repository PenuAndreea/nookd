import { fireEvent, render, screen } from '@testing-library/react-native';

import ProfileSheet from '@/components/organisms/profile-sheet';

describe('ProfileSheet', () => {
    it('shows the user\'s email when given one', async () => {
        await render(<ProfileSheet userId="user-1" email="me@example.com" onSignOut={jest.fn()} />);

        expect(screen.getByText('me@example.com')).toBeVisible();
    });

    it('renders without an email', async () => {
        await render(<ProfileSheet userId="user-1" onSignOut={jest.fn()} />);

        expect(screen.getByText('Sign out')).toBeVisible();
    });

    it('calls onSignOut when the button is tapped', async () => {
        const onSignOut = jest.fn();
        await render(<ProfileSheet userId="user-1" onSignOut={onSignOut} />);

        await fireEvent.press(screen.getByText('Sign out'));

        expect(onSignOut).toHaveBeenCalledTimes(1);
    });
});
