import { render, screen } from '@testing-library/react-native';

import Avatar from '@/components/atoms/avatar';

describe('Avatar', () => {
    it('falls back to a Dicebear image keyed by id', async () => {
        await render(<Avatar id="user-42" size="medium" />);

        const image = screen.getByLabelText('User Avatar');
        expect(image.props.source.uri).toBe('https://api.dicebear.com/9.x/lorelei/png?seed=user-user-42');
    });

    it('prefers an explicit url over the id-derived one', async () => {
        await render(<Avatar id="user-42" size="medium" url="https://example.com/avatar.png" />);

        const image = screen.getByLabelText('User Avatar');
        expect(image.props.source.uri).toBe('https://example.com/avatar.png');
    });
});
