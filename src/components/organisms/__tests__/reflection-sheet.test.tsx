import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ReflectionSheet from '@/components/organisms/reflection-sheet';

const book = { id: 'book-1', title: 'Dune', page_count: 412 } as any;

describe('ReflectionSheet', () => {
    it('renders the book title and a page-count-aware label', async () => {
        await render(<ReflectionSheet book={book} onSubmit={jest.fn()} onSkip={jest.fn()} />);

        expect(screen.getByText('Dune')).toBeVisible();
        expect(screen.getByText('Page reached (of 412)')).toBeVisible();
    });

    it('omits book-specific fields when there is no book', async () => {
        await render(<ReflectionSheet book={null} onSubmit={jest.fn()} onSkip={jest.fn()} />);

        expect(screen.queryByText(/Page reached/)).toBeNull();
        expect(screen.queryByText('I finished this book')).toBeNull();
    });

    it('pre-fills the page field from initialPage', async () => {
        await render(<ReflectionSheet book={book} initialPage={120} onSubmit={jest.fn()} onSkip={jest.fn()} />);

        expect(screen.getByDisplayValue('120')).toBeVisible();
    });

    it('submits trimmed thoughts, a numeric page, and the finished flag', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        await render(<ReflectionSheet book={book} onSubmit={onSubmit} onSkip={jest.fn()} />);

        await fireEvent.changeText(screen.getByPlaceholderText('Anything on your mind about the reading...'), '  Great read  ');
        await fireEvent.changeText(screen.getByPlaceholderText('0'), '150');
        await fireEvent.press(screen.getByText('I finished this book'));
        await fireEvent.press(screen.getByText('Save'));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                thoughts: 'Great read',
                pageReached: 150,
                mood: null,
                finished: true,
            })
        );
    });

    it('treats a non-numeric page as unset instead of NaN', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        await render(<ReflectionSheet book={null} onSubmit={onSubmit} onSkip={jest.fn()} />);

        await fireEvent.press(screen.getByText('Save'));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ pageReached: null })
            )
        );
    });

    it('shows an error and stays open if saving fails', async () => {
        const onSubmit = jest.fn().mockRejectedValue(new Error('offline'));
        await render(<ReflectionSheet book={null} onSubmit={onSubmit} onSkip={jest.fn()} />);

        await fireEvent.press(screen.getByText('Save'));

        await waitFor(() => expect(screen.getByText("Couldn't save — try again, or skip for now.")).toBeVisible());
    });

    it('calls onSkip without submitting anything', async () => {
        const onSubmit = jest.fn();
        const onSkip = jest.fn();
        await render(<ReflectionSheet book={null} onSubmit={onSubmit} onSkip={onSkip} />);

        await fireEvent.press(screen.getByText('Skip'));

        expect(onSkip).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
