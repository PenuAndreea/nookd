import { fireEvent, render, screen } from '@testing-library/react-native';

import Checkbox from '@/components/atoms/checkbox';

describe('Checkbox', () => {
    it('renders its label and reflects the checked state', async () => {
        await render(<Checkbox label="Remember me" checked onPress={jest.fn()} />);

        expect(screen.getByText('Remember me')).toBeVisible();
        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('reflects an unchecked state', async () => {
        await render(<Checkbox label="Remember me" checked={false} onPress={jest.fn()} />);

        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('calls onPress when tapped', async () => {
        const onPress = jest.fn();
        await render(<Checkbox label="Remember me" checked={false} onPress={onPress} />);

        await fireEvent.press(screen.getByRole('checkbox'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
