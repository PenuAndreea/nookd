import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/molecules/header';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

const back = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ back });
});

describe('Header', () => {
    it('renders the title', async () => {
        await render(<Header title="Create Room" />);

        expect(screen.getByText('Create Room')).toBeVisible();
    });

    it('renders no back button by default', async () => {
        await render(<Header title="Create Room" />);

        expect(screen.queryByText('‹')).toBeNull();
    });

    it('navigates back by default when the back button is tapped', async () => {
        await render(<Header title="Create Room" showBack />);

        await fireEvent.press(screen.getByText('‹'));

        expect(back).toHaveBeenCalledTimes(1);
    });

    it('calls a custom onBack instead of the router when given one', async () => {
        const onBack = jest.fn();
        await render(<Header title="Create Room" showBack onBack={onBack} />);

        await fireEvent.press(screen.getByText('‹'));

        expect(onBack).toHaveBeenCalledTimes(1);
        expect(back).not.toHaveBeenCalled();
    });

    it('renders custom right-side content', async () => {
        await render(<Header title="Room" right={<Text>Join</Text>} />);

        expect(screen.getByText('Join')).toBeVisible();
    });
});
