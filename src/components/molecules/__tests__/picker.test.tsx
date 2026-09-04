import { fireEvent, render, screen } from '@testing-library/react-native';

import { DurationPicker, SessionMoodPicker, VibePicker } from '@/components/molecules/picker';

describe('VibePicker', () => {
    it('renders every vibe option with its translated label', async () => {
        await render(<VibePicker value={null} onChange={jest.fn()} />);

        expect(screen.getByText('Vibe')).toBeVisible();
        expect(screen.getByText('BookClub')).toBeVisible();
        expect(screen.getByText('Fantasy')).toBeVisible();
        expect(screen.getByText('Quiet Company')).toBeVisible();
    });

    it('calls onChange with the vibe id, not its label', async () => {
        const onChange = jest.fn();
        await render(<VibePicker value={null} onChange={onChange} />);

        await fireEvent.press(screen.getByText('Fantasy'));

        expect(onChange).toHaveBeenCalledWith('fantasy');
    });
});

describe('SessionMoodPicker', () => {
    it('renders every mood option', async () => {
        await render(<SessionMoodPicker value={null} onChange={jest.fn()} />);

        expect(screen.getByText('How was this session?')).toBeVisible();
        expect(screen.getByText('Focused')).toBeVisible();
        expect(screen.getByText('Cozy')).toBeVisible();
        expect(screen.getByText('Distracted')).toBeVisible();
        expect(screen.getByText('Restless')).toBeVisible();
    });
});

describe('DurationPicker', () => {
    it('renders every duration option in minutes', async () => {
        await render(<DurationPicker value="60" onChange={jest.fn()} />);

        expect(screen.getByText('Duration')).toBeVisible();
        expect(screen.getByText('10 min')).toBeVisible();
        expect(screen.getByText('60 min')).toBeVisible();
    });

    it('calls onChange with the numeric minutes id', async () => {
        const onChange = jest.fn();
        await render(<DurationPicker value="60" onChange={onChange} />);

        await fireEvent.press(screen.getByText('30 min'));

        expect(onChange).toHaveBeenCalledWith('30');
    });
});
