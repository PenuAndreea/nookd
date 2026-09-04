import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { EmptyState } from '@/components/molecules/empty-state';

describe('EmptyState', () => {
    it('renders the title', async () => {
        await render(<EmptyState title="No books found" />);

        expect(screen.getByText('No books found')).toBeVisible();
    });

    it('renders an optional subtitle', async () => {
        await render(<EmptyState title="No books found" subtitle='Nothing matched "dune".' />);

        expect(screen.getByText('Nothing matched "dune".')).toBeVisible();
    });

    it('renders an optional action', async () => {
        await render(<EmptyState title="No rooms yet" action={<Text>Create one</Text>} />);

        expect(screen.getByText('Create one')).toBeVisible();
    });
});
