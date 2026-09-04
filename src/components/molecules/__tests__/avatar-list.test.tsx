import { render, screen } from '@testing-library/react-native';

import AvatarList from '@/components/molecules/avatar-list';

describe('AvatarList', () => {
    it('shows "No one yet" for an empty room', async () => {
        await render(<AvatarList userIds={[]} />);

        expect(screen.getByText('No one yet')).toBeVisible();
    });

    it('shows "No one yet" when userIds is undefined', async () => {
        await render(<AvatarList />);

        expect(screen.getByText('No one yet')).toBeVisible();
    });

    it('shows the reader count for a non-empty room', async () => {
        await render(<AvatarList userIds={['a', 'b', 'c']} />);

        expect(screen.getByText('3 reading')).toBeVisible();
    });

    it('caps rendered avatars at 3 even with more readers', async () => {
        await render(<AvatarList userIds={['a', 'b', 'c', 'd', 'e']} />);

        expect(screen.getAllByLabelText('User Avatar')).toHaveLength(3);
        expect(screen.getByText('5 reading')).toBeVisible();
    });
});
