import { render, screen } from '@testing-library/react-native';
import StatTile from '@/components/molecules/stat-tile';

describe('StatTile', () => {
    it('shows its label and value', async () => {
        await render(<StatTile label="Time read" value="1h 15m" />);

        expect(screen.getByText('Time read')).toBeVisible();
        expect(screen.getByText('1h 15m')).toBeVisible();
    });

    it('shows a caption when given one', async () => {
        await render(<StatTile label="Pages read" value="70" caption="From sessions with a page" />);

        expect(screen.getByText('From sessions with a page')).toBeVisible();
    });

    it('omits the caption when there is none', async () => {
        await render(<StatTile label="Sessions" value="4" />);

        expect(screen.queryByText('From sessions with a page')).toBeNull();
    });
});
