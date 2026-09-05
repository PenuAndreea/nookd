import { fireEvent, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useRoomData } from '@/hooks/use-room-data';
import { useRoomReflection } from '@/hooks/use-room-reflection';
import { useRoomSession } from '@/hooks/use-room-session';
import SilentRoomScreen from '@/app/(app)/room/[id]';

jest.mock('expo-router', () => ({
    useLocalSearchParams: jest.fn(),
    useRouter: jest.fn(() => ({ back: jest.fn() })),
}));
jest.mock('@/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/use-room-data', () => ({ useRoomData: jest.fn() }));
jest.mock('@/hooks/use-room-session', () => ({ useRoomSession: jest.fn() }));
jest.mock('@/hooks/use-room-reflection', () => ({ useRoomReflection: jest.fn() }));
// Reaches into navigation context via usePreventRemove, which has no container
// in a bare render. Covered on its own in use-leave-room-guard.test.ts.
jest.mock('@/hooks/use-leave-room-guard', () => ({ useLeaveRoomGuard: jest.fn() }));

const room = { id: 'room-1', name: 'Rainy Library', description: null, duration_minutes: 60, book: null };
const theme = { source: 1, background: '#F7ECE1' };

const handleJoinPress = jest.fn();
const handleLeaveRoom = jest.fn();

function mockRoomData(overrides: Partial<ReturnType<typeof useRoomData>> = {}) {
    (useRoomData as jest.Mock).mockReturnValue({
        room,
        roomError: false,
        retryRoom: jest.fn(),
        userBookForRoom: null,
        libraryBooks: [],
        libraryError: false,
        retryLibrary: jest.fn(),
        theme,
        ...overrides,
    });
}

function mockRoomSession(overrides: Partial<ReturnType<typeof useRoomSession>> = {}) {
    (useRoomSession as jest.Mock).mockReturnValue({
        members: [],
        memberCount: 0,
        lastSessionId: null,
        isJoined: false,
        presenceError: false,
        hasCheckedMembership: true,
        displayedElapsedSeconds: 0,
        booksInRoom: [],
        selfHasBook: false,
        handleJoinPress,
        handleLeaveRoom,
        handleSelectBook: jest.fn(),
        handleSkipBook: jest.fn(),
        openReadingPicker: jest.fn(),
        ...overrides,
    });
}

beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'room-1', autojoin: undefined });
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } } });
    (useRoomReflection as jest.Mock).mockReturnValue({
        handleReflectionSubmit: jest.fn(),
        handleReflectionSkip: jest.fn(),
    });
    mockRoomData();
    mockRoomSession();
});

describe('SilentRoomScreen', () => {
    it('shows a full-screen error with retry when the room fails to load', async () => {
        const retryRoom = jest.fn();
        mockRoomData({ room: undefined, roomError: true, retryRoom });

        await render(<SilentRoomScreen />);

        expect(screen.getByText("Couldn't load this room")).toBeVisible();
        await fireEvent.press(screen.getByText('Try again'));
        expect(retryRoom).toHaveBeenCalledTimes(1);
    });

    it('shows a Join button once membership is checked and the user has not joined', async () => {
        await render(<SilentRoomScreen />);

        await fireEvent.press(screen.getByText('Join'));

        expect(handleJoinPress).toHaveBeenCalledTimes(1);
    });

    it('hides the Join button before membership has been checked', async () => {
        mockRoomSession({ hasCheckedMembership: false });

        await render(<SilentRoomScreen />);

        expect(screen.queryByText('Join')).toBeNull();
    });

    it('hides the Join button once the user has joined', async () => {
        mockRoomSession({ isJoined: true });

        await render(<SilentRoomScreen />);

        expect(screen.queryByText('Join')).toBeNull();
    });

    it('shows a presence warning only when joined and presence has an error', async () => {
        mockRoomSession({ isJoined: true, presenceError: true });

        await render(<SilentRoomScreen />);

        expect(screen.getByText('Live presence is temporarily unavailable — others may not see you here yet.')).toBeVisible();
    });

    it('does not show the presence warning when not joined, even with a presence error', async () => {
        mockRoomSession({ isJoined: false, presenceError: true });

        await render(<SilentRoomScreen />);

        expect(screen.queryByText('Live presence is temporarily unavailable — others may not see you here yet.')).toBeNull();
    });

    it('renders the timer and the room details sheet for the loaded room', async () => {
        mockRoomSession({ memberCount: 3, displayedElapsedSeconds: 90 });

        await render(<SilentRoomScreen />);

        expect(screen.getByText('Rainy Library')).toBeVisible();
        expect(screen.getByText('3/10')).toBeVisible();
    });

    it('leaves the room when the sheet\'s leave action fires', async () => {
        mockRoomSession({ isJoined: true });

        await render(<SilentRoomScreen />);

        await fireEvent.press(screen.getByText('Leave room'));

        expect(handleLeaveRoom).toHaveBeenCalledTimes(1);
    });
});
