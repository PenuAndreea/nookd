import { fireEvent, render, screen } from '@testing-library/react-native';

import { BookStatusChips } from '@/components/molecules/book-status-chips';

describe('BookStatusChips', () => {
    it('renders all three status options', async () => {
        await render(<BookStatusChips value="want_to_read" onChange={jest.fn()} />);

        expect(screen.getByText('Want to read')).toBeVisible();
        expect(screen.getByText('Currently reading')).toBeVisible();
        expect(screen.getByText('Finished')).toBeVisible();
    });

    it('calls onChange with the id of the tapped status, not its label', async () => {
        const onChange = jest.fn();
        await render(<BookStatusChips value="want_to_read" onChange={onChange} />);

        await fireEvent.press(screen.getByText('Finished'));

        expect(onChange).toHaveBeenCalledWith('finished');
    });
});
