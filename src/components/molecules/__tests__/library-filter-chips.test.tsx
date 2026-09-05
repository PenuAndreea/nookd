import { fireEvent, render, screen } from '@testing-library/react-native';

import { LibraryFilterChips } from '@/components/molecules/library-filter-chips';

describe('LibraryFilterChips', () => {
    it('offers "All" alongside every reading status', async () => {
        await render(<LibraryFilterChips value="all" onChange={jest.fn()} />);

        expect(screen.getByText('All')).toBeVisible();
        expect(screen.getByText('Want to read')).toBeVisible();
        expect(screen.getByText('Currently reading')).toBeVisible();
        expect(screen.getByText('Finished')).toBeVisible();
    });

    it('reports the chosen filter', async () => {
        const onChange = jest.fn();
        await render(<LibraryFilterChips value="all" onChange={onChange} />);

        await fireEvent.press(screen.getByText('Finished'));

        expect(onChange).toHaveBeenCalledWith('finished');
    });

    it('can select "All" again', async () => {
        const onChange = jest.fn();
        await render(<LibraryFilterChips value="finished" onChange={onChange} />);

        await fireEvent.press(screen.getByText('All'));

        expect(onChange).toHaveBeenCalledWith('all');
    });
});
