import { fireEvent, render, screen } from '@testing-library/react-native';

import TextButton from '@/components/atoms/text-button';

describe('TextButton', () => {
    it('renders its title', async () => {
        await render(<TextButton title="Sign up" onPress={jest.fn()} />);

        expect(screen.getByText('Sign up')).toBeVisible();
    });

    it('calls onPress when tapped', async () => {
        const onPress = jest.fn();
        await render(<TextButton title="Sign up" onPress={onPress} />);

        await fireEvent.press(screen.getByText('Sign up'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', async () => {
        const onPress = jest.fn();
        await render(<TextButton title="Sign up" onPress={onPress} disabled />);

        await fireEvent.press(screen.getByText('Sign up'));

        expect(onPress).not.toHaveBeenCalled();
    });
});
