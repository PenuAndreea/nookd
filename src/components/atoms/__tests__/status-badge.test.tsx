import { render, screen } from '@testing-library/react-native';

import StatusBadge, { POPULAR_FROM } from '@/components/atoms/status-badge';

describe('StatusBadge', () => {
    it('shows "Quiet" for an empty room', async () => {
        await render(<StatusBadge memberCount={0} />);

        expect(screen.getByText('Quiet')).toBeVisible();
    });

    it('shows "Live" once someone is in the room', async () => {
        await render(<StatusBadge memberCount={1} />);

        expect(screen.getByText('Live')).toBeVisible();
    });

    it('shows "Popular" with a fire emoji at the popular threshold', async () => {
        await render(<StatusBadge memberCount={POPULAR_FROM} />);

        expect(screen.getByText('Popular')).toBeVisible();
        expect(screen.getByText('🔥')).toBeVisible();
    });

    it('stays "Live" just under the popular threshold', async () => {
        await render(<StatusBadge memberCount={POPULAR_FROM - 1} />);

        expect(screen.getByText('Live')).toBeVisible();
        expect(screen.queryByText('🔥')).toBeNull();
    });
});
