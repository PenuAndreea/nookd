import { render, screen } from '@testing-library/react-native';
import BarChart, { type BarDatum } from '@/components/molecules/bar-chart';

const data: BarDatum[] = [
    { key: 'mon', label: 'Mon', value: 30 },
    { key: 'tue', label: 'Tue', value: 0 },
    { key: 'wed', label: 'Wed', value: 60 },
];

describe('BarChart', () => {
    it('labels the whole chart for a screen reader rather than every bar', async () => {
        await render(
            <BarChart data={data} accessibilityLabel="Minutes read per day" testID="chart" />
        );

        expect(screen.getByLabelText('Minutes read per day')).toBeVisible();
    });

    it('renders a label per datum', async () => {
        await render(<BarChart data={data} accessibilityLabel="chart" />);

        expect(screen.getByText('Mon')).toBeVisible();
        expect(screen.getByText('Tue')).toBeVisible();
        expect(screen.getByText('Wed')).toBeVisible();
    });

    it('omits labels for a dense series', async () => {
        await render(<BarChart data={data} showLabels={false} accessibilityLabel="chart" />);

        expect(screen.queryByText('Mon')).toBeNull();
    });

    it('renders all-zero data without dividing by zero', async () => {
        const flat: BarDatum[] = [
            { key: 'a', label: 'A', value: 0 },
            { key: 'b', label: 'B', value: 0 },
        ];

        await render(<BarChart data={flat} accessibilityLabel="chart" testID="chart" />);

        expect(screen.getByTestId('chart')).toBeVisible();
    });

    it('renders with no data at all', async () => {
        await render(<BarChart data={[]} accessibilityLabel="chart" testID="chart" />);

        expect(screen.getByTestId('chart')).toBeVisible();
    });
});
