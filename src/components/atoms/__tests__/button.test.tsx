import { fireEvent, render, screen } from '@testing-library/react-native';

import Button from '@/components/atoms/button';

describe('Button', () => {
    it('renders its title', async () => {
        await render(<Button title="Create room" onPress={jest.fn()} />);

        expect(screen.getByText('Create room')).toBeVisible();
    });

    it('calls onPress when tapped', async () => {
        const onPress = jest.fn();
        await render(<Button title="Join" onPress={onPress} />);

        await fireEvent.press(screen.getByText('Join'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('renders without a title for icon-only buttons', async () => {
        await render(<Button icon="chevron.left" onPress={jest.fn()} round />);

        expect(screen.queryByText(/./)).toBeNull();
    });
});
