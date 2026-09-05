import { render, screen } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';
import ProgressBar from '@/components/atoms/progress-bar';

/** The fill is the track's only child. */
function fillWidth(testID: string) {
    const fill = screen.getByTestId(testID).children[0] as unknown as {
        props: { style: ViewStyle };
    };
    return StyleSheet.flatten(fill.props.style).width;
}

describe('ProgressBar', () => {
    it('renders the fill at the given ratio', async () => {
        await render(<ProgressBar progress={0.42} testID="bar" />);

        expect(fillWidth('bar')).toBe('42%');
    });

    it('clamps a ratio above 1 so the fill cannot overflow its track', async () => {
        await render(<ProgressBar progress={1.8} testID="bar" />);

        expect(fillWidth('bar')).toBe('100%');
    });

    it('clamps a negative ratio to zero', async () => {
        await render(<ProgressBar progress={-0.5} testID="bar" />);

        expect(fillWidth('bar')).toBe('0%');
    });

    it('forwards its testID, which is what existing callers query by', async () => {
        await render(<ProgressBar progress={0.5} testID="book-item-progress" />);

        expect(screen.getByTestId('book-item-progress')).toBeVisible();
    });

    it('keeps the track a capsule by deriving the radius from the height', async () => {
        await render(<ProgressBar progress={0.5} height={7} testID="bar" />);

        const track = StyleSheet.flatten(screen.getByTestId('bar').props.style as ViewStyle);
        expect(track.borderRadius).toBe(3.5);
    });
});
