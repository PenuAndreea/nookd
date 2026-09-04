import { render, screen } from '@testing-library/react-native';

import ReaderList from '@/components/molecules/reader-list';

const membersOf = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ user_id: `user-${i}` }));

describe('ReaderList', () => {
    it('labels the current user as "You"', async () => {
        await render(<ReaderList members={membersOf(2)} currentUserId="user-0" />);

        expect(screen.getByText('You')).toBeVisible();
    });

    it('shows no overflow tile at or under the shown limit', async () => {
        await render(<ReaderList members={membersOf(5)} />);

        expect(screen.queryByText(/^\+\d+$/)).toBeNull();
    });

    it('shows an overflow tile past the shown limit', async () => {
        await render(<ReaderList members={membersOf(8)} />);

        expect(screen.getByText('+3')).toBeVisible();
        expect(screen.getByText('More')).toBeVisible();
    });
});
