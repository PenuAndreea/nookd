import { fireEvent, render, screen } from '@testing-library/react-native';

import Chip from '@/components/atoms/chip';

describe('Chip', () => {
    it('renders its label and optional emoji', async () => {
        await render(<Chip label="Fantasy" emoji="🐉" selected={false} onPress={jest.fn()} />);

        expect(screen.getByText('Fantasy')).toBeVisible();
        expect(screen.getByText('🐉')).toBeVisible();
    });

    it('calls onPress when tapped', async () => {
        const onPress = jest.fn();
        await render(<Chip label="Quiet Company" selected={false} onPress={onPress} />);

        await fireEvent.press(screen.getByText('Quiet Company'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', async () => {
        const onPress = jest.fn();
        await render(<Chip label="Quiet Company" selected={false} onPress={onPress} disabled />);

        await fireEvent.press(screen.getByText('Quiet Company'));

        expect(onPress).not.toHaveBeenCalled();
    });
});
