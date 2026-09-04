import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorState } from '@/components/molecules/error-state';

describe('ErrorState', () => {
    it('falls back to the generic error copy', async () => {
        await render(<ErrorState />);

        expect(screen.getByText('Something went wrong')).toBeVisible();
        expect(screen.getByText('This screen ran into a problem. You can try again.')).toBeVisible();
    });

    it('renders custom copy when given', async () => {
        await render(<ErrorState title="Could not load room" subtitle="Check your connection." />);

        expect(screen.getByText('Could not load room')).toBeVisible();
        expect(screen.getByText('Check your connection.')).toBeVisible();
    });

    it('renders no retry button without an onRetry handler', async () => {
        await render(<ErrorState />);

        expect(screen.queryByText('Try again')).toBeNull();
    });

    it('calls onRetry when the retry button is tapped', async () => {
        const onRetry = jest.fn();
        await render(<ErrorState onRetry={onRetry} />);

        await fireEvent.press(screen.getByText('Try again'));

        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('supports a custom retry label', async () => {
        await render(<ErrorState onRetry={jest.fn()} retryLabel="Reload" />);

        expect(screen.getByText('Reload')).toBeVisible();
    });
});
