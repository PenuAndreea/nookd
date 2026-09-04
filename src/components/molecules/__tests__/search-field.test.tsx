import { render, screen } from '@testing-library/react-native';

import { SearchField } from '@/components/molecules/search-field';

describe('SearchField', () => {
    it('renders the placeholder', async () => {
        await render(<SearchField placeholder="Search by title or author" value="" onChangeText={jest.fn()} />);

        expect(screen.getByPlaceholderText('Search by title or author')).toBeVisible();
    });

    it('shows a spinner while loading', async () => {
        await render(<SearchField value="" onChangeText={jest.fn()} loading />);

        expect(screen.getByTestId('search-field-loading')).toBeVisible();
    });

    it('shows no spinner when not loading', async () => {
        await render(<SearchField value="" onChangeText={jest.fn()} />);

        expect(screen.queryByTestId('search-field-loading')).toBeNull();
    });
});
