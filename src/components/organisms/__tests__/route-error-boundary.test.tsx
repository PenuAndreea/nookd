import { fireEvent, render, screen } from '@testing-library/react-native';

import RouteErrorBoundary from '@/components/organisms/route-error-boundary';

describe('RouteErrorBoundary', () => {
    it('shows the generic error state', async () => {
        await render(<RouteErrorBoundary error={new Error('boom')} retry={jest.fn()} />);

        expect(screen.getByText('Something went wrong')).toBeVisible();
    });

    it('calls retry when the button is tapped', async () => {
        const retry = jest.fn();
        await render(<RouteErrorBoundary error={new Error('boom')} retry={retry} />);

        await fireEvent.press(screen.getByText('Try again'));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});
