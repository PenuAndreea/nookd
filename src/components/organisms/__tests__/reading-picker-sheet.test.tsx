import { fireEvent, render, screen } from '@testing-library/react-native';

import ReadingPickerSheet from '@/components/organisms/reading-picker-sheet';

const books = [
    { id: 'entry-1', book_id: 'dune', book: { id: 'dune', title: 'Dune', author: 'Frank Herbert', cover_url: null } },
    { id: 'entry-2', book_id: 'circe', book: { id: 'circe', title: 'Circe', author: 'Madeline Miller', cover_url: null } },
] as any;

describe('ReadingPickerSheet', () => {
    it('lists the user\'s library', async () => {
        await render(<ReadingPickerSheet books={books} onSelect={jest.fn()} onSkip={jest.fn()} />);

        expect(screen.getByText('Dune')).toBeVisible();
        expect(screen.getByText('Circe')).toBeVisible();
    });

    it('calls onSelect with the book_id, not the entry id, when a row is tapped', async () => {
        const onSelect = jest.fn();
        await render(<ReadingPickerSheet books={books} onSelect={onSelect} onSkip={jest.fn()} />);

        await fireEvent.press(screen.getByText('Circe'));

        expect(onSelect).toHaveBeenCalledWith('circe');
    });

    it('shows an empty-library message when there are no books', async () => {
        await render(<ReadingPickerSheet books={[]} onSelect={jest.fn()} onSkip={jest.fn()} />);

        expect(screen.getByText('Your library is empty')).toBeVisible();
    });

    it('shows an error state with retry instead of the empty message when loading failed', async () => {
        const onRetry = jest.fn();
        await render(<ReadingPickerSheet books={[]} error onRetry={onRetry} onSelect={jest.fn()} onSkip={jest.fn()} />);

        expect(screen.queryByText('Your library is empty')).toBeNull();
        expect(screen.getByText("Couldn't load your library")).toBeVisible();

        await fireEvent.press(screen.getByText('Try again'));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onSkip when "Not reading anything specific" is tapped', async () => {
        const onSkip = jest.fn();
        await render(<ReadingPickerSheet books={books} onSelect={jest.fn()} onSkip={onSkip} />);

        await fireEvent.press(screen.getByText('Not reading anything specific'));

        expect(onSkip).toHaveBeenCalledTimes(1);
    });
});
