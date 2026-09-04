import { render, screen } from '@testing-library/react-native';

import Typography, { TypographyStyles } from '@/components/atoms/typography';
import { Colors } from '@/constants/theme';

describe('Typography', () => {
    it('renders its children', async () => {
        await render(<Typography>Hello there</Typography>);

        expect(screen.getByText('Hello there')).toBeVisible();
    });

    it('defaults to the body variant and text color', async () => {
        await render(<Typography>Body copy</Typography>);

        const text = screen.getByText('Body copy');
        expect(text.props.style).toEqual(
            expect.arrayContaining([
                TypographyStyles.body,
                { color: Colors.light.text },
            ])
        );
    });

    it('applies the requested variant and color', async () => {
        await render(<Typography variant="h1" color="error">Careful</Typography>);

        const text = screen.getByText('Careful');
        expect(text.props.style).toEqual(
            expect.arrayContaining([
                TypographyStyles.h1,
                { color: Colors.light.error },
            ])
        );
    });
});
