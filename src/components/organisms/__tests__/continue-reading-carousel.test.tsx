import { fireEvent, render, screen } from '@testing-library/react-native';

import ContinueReadingCarousel from '@/components/organisms/continue-reading-carousel';

const dune = {
    id: 'entry-1',
    status: 'currently_reading',
    current_page: 150,
    book: { id: 'book-1', title: 'Dune', author: 'Frank Herbert', cover_url: null, page_count: 412 },
} as any;

const circe = {
    id: 'entry-2',
    status: 'currently_reading',
    current_page: null,
    book: { id: 'book-2', title: 'Circe', author: 'Madeline Miller', cover_url: null, page_count: null },
} as any;

describe('ContinueReadingCarousel', () => {
    it('renders a card per book', async () => {
        await render(<ContinueReadingCarousel books={[dune, circe]} onContinue={jest.fn()} />);

        expect(screen.getByText('Dune')).toBeVisible();
        expect(screen.getByText('Frank Herbert')).toBeVisible();
        expect(screen.getByText('Circe')).toBeVisible();
    });

    it('shows how far through each book the reader is', async () => {
        await render(<ContinueReadingCarousel books={[dune]} onContinue={jest.fn()} />);

        expect(screen.getByText('36% · 262 pages left')).toBeVisible();
    });

    it('omits the progress line for a book with no known page count', async () => {
        await render(<ContinueReadingCarousel books={[circe]} onContinue={jest.fn()} />);

        expect(screen.queryByText(/pages left/)).toBeNull();
        // The card is still actionable — you just can't say how far in you are.
        expect(screen.getByLabelText('Continue reading Circe')).toBeVisible();
    });

    it('hands the book back when Continue is pressed', async () => {
        const onContinue = jest.fn();
        await render(<ContinueReadingCarousel books={[dune]} onContinue={onContinue} />);

        await fireEvent.press(screen.getByLabelText('Continue reading Dune'));

        expect(onContinue).toHaveBeenCalledWith(dune.book);
    });

    it('renders nothing when there is nothing in progress', async () => {
        await render(<ContinueReadingCarousel books={[]} onContinue={jest.fn()} />);

        expect(screen.queryByText(/Continue/)).toBeNull();
    });
});
