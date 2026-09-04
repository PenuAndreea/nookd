import { fireEvent, render, screen } from '@testing-library/react-native';

import TimerCard from '@/components/organisms/timer-card';

describe('TimerCard', () => {
    it('counts down the remaining time for a timed room', async () => {
        await render(<TimerCard elapsedSeconds={125} duration={60} memberCount={2} onPress={jest.fn()} />);

        // 60 min goal - 125s elapsed = 3475s remaining = 57:55
        expect(screen.getByText('57:55')).toBeVisible();
        expect(screen.getByText('Remaining')).toBeVisible();
        expect(screen.getByText('Goal: 60 min')).toBeVisible();
        expect(screen.getByText('2/10')).toBeVisible();
    });

    it('never shows negative remaining time once the room has run over', async () => {
        await render(<TimerCard elapsedSeconds={4000} duration={60} memberCount={1} onPress={jest.fn()} />);

        expect(screen.getByText('00:00')).toBeVisible();
    });

    it('counts up and labels an open-ended (house) room', async () => {
        await render(<TimerCard elapsedSeconds={65} duration={null} memberCount={1} onPress={jest.fn()} />);

        expect(screen.getByText('01:05')).toBeVisible();
        expect(screen.getByText('Reading')).toBeVisible();
        expect(screen.getByText('Always open')).toBeVisible();
    });

    it('calls onPress when tapped', async () => {
        const onPress = jest.fn();
        await render(<TimerCard elapsedSeconds={0} duration={60} memberCount={0} onPress={onPress} />);

        await fireEvent.press(screen.getByText('Remaining'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
