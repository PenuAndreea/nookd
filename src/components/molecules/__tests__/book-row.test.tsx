import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import BookRow from '@/components/molecules/book-row';

const book = { title: 'Dune', author: 'Frank Herbert', cover_url: null };

describe('BookRow', () => {
    it('renders the title and author', async () => {
        await render(<BookRow book={book} />);

        expect(screen.getByText('Dune')).toBeVisible();
        expect(screen.getByText('Frank Herbert')).toBeVisible();
    });

    it('shows a placeholder emoji when there is no cover', async () => {
        await render(<BookRow book={book} />);

        expect(screen.getByText('📖')).toBeVisible();
    });

    it('renders a cover image when a cover_url is given', async () => {
        await render(<BookRow book={{ ...book, cover_url: 'https://example.com/cover.png' }} />);

        expect(screen.queryByText('📖')).toBeNull();
    });

    it('omits the author line when there is none', async () => {
        await render(<BookRow book={{ title: 'Untitled', author: null }} />);

        expect(screen.queryByText('Frank Herbert')).toBeNull();
    });

    it('calls onPress when tapped', async () => {
        const onPress = jest.fn();
        await render(<BookRow book={book} onPress={onPress} />);

        await fireEvent.press(screen.getByText('Dune'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('renders trailing and belowInfo content', async () => {
        await render(
            <BookRow
                book={book}
                trailing={<Text>+ Add</Text>}
                belowInfo={<Text>3 rooms</Text>}
            />
        );

        expect(screen.getByText('+ Add')).toBeVisible();
        expect(screen.getByText('3 rooms')).toBeVisible();
    });
});
