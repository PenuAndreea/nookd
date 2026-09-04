import { fireEvent, render, screen } from '@testing-library/react-native';

import BackButton from '@/components/atoms/back-button';

describe('BackButton', () => {
    it('calls onPress when tapped', async () => {
        const onPress = jest.fn();
        await render(<BackButton onPress={onPress} />);

        await fireEvent.press(screen.getByText('‹'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
