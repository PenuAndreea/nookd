import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { forceLeaveRoom, getRoomMembersByRoomId } from '@/api/rooms';
import { useRooms } from '@/contexts/rooms-context';
import { useRoomBooks } from '@/hooks/use-room-books';
import { useRoomPresence } from '@/hooks/use-room-presence';
import { useRoomSession } from '@/hooks/use-room-session';

jest.mock('@/hooks/use-room-presence', () => ({ useRoomPresence: jest.fn() }));
jest.mock('@/hooks/use-room-books', () => ({ useRoomBooks: jest.fn() }));
jest.mock('@/contexts/rooms-context', () => ({ useRooms: jest.fn() }));
jest.mock('@/api/rooms', () => ({
    forceLeaveRoom: jest.fn(),
    getRoomMembersByRoomId: jest.fn(),
}));

const joinRoom = jest.fn().mockResolvedValue(undefined);
const leaveRoom = jest.fn().mockResolvedValue(undefined);
const openReadingPicker = jest.fn();
const markJoined = jest.fn();
const markLeft = jest.fn();

const bottomSheetRef = { current: { close: jest.fn() } } as any;
const reflectionSheetRef = { current: { snapToIndex: jest.fn() } } as any;
const readingPickerRef = { current: { snapToIndex: jest.fn(), close: jest.fn() } } as any;

function setup(overrides: {
    room?: any;
    currentRoom?: any;
    isJoined?: boolean;
    autojoin?: string;
} = {}) {
    return renderHook(() =>
        useRoomSession({
            roomId: 'room-1',
            userId: 'user-1',
            room: overrides.room ?? { id: 'room-1', vibe: 'quiet_company' },
            libraryBooks: [],
            autojoin: overrides.autojoin,
            bottomSheetRef,
            reflectionSheetRef,
            readingPickerRef,
        })
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    (getRoomMembersByRoomId as jest.Mock).mockResolvedValue([]);
    (useRoomPresence as jest.Mock).mockReturnValue({
        members: [],
        memberCount: 0,
        lastSessionId: null,
        isJoined: false,
        presenceError: false,
        joinRoom,
        leaveRoom,
    });
    (useRoomBooks as jest.Mock).mockReturnValue({
        booksInRoom: [],
        selfHasBook: false,
        handleSelectBook: jest.fn(),
        handleSkipBook: jest.fn(),
        openReadingPicker,
    });
    (useRooms as jest.Mock).mockReturnValue({ currentRoom: null, markJoined, markLeft });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('useRoomSession', () => {
    it('joins directly for a book-club room (no reading picker)', async () => {
        const { result } = await setup({ room: { id: 'room-1', vibe: 'book_club' } });
        await waitFor(() => expect(result.current.hasCheckedMembership).toBe(true));

        await act(async () => {
            result.current.handleJoinPress();
        });

        expect(joinRoom).toHaveBeenCalledWith(undefined);
        expect(openReadingPicker).not.toHaveBeenCalled();
        expect(markJoined).toHaveBeenCalledWith('room-1', 'user-1');
    });

    it('opens the reading picker instead of joining directly for a non-book-club room', async () => {
        const { result } = await setup();
        await waitFor(() => expect(result.current.hasCheckedMembership).toBe(true));

        await act(async () => {
            result.current.handleJoinPress();
        });

        expect(openReadingPicker).toHaveBeenCalled();
        expect(joinRoom).not.toHaveBeenCalled();
    });

    it('shows an alert instead of joining when already in a different room', async () => {
        (useRooms as jest.Mock).mockReturnValue({
            currentRoom: { id: 'other-room', name: 'Rainy Library' },
            markJoined,
            markLeft,
        });
        const { result } = await setup();
        await waitFor(() => expect(result.current.hasCheckedMembership).toBe(true));

        await act(async () => {
            result.current.handleJoinPress();
        });

        expect(Alert.alert).toHaveBeenCalledWith(
            'Leave current room?',
            'You\'re already in "Rainy Library". Leave it and join this room instead?',
            expect.any(Array)
        );
        expect(joinRoom).not.toHaveBeenCalled();
        expect(openReadingPicker).not.toHaveBeenCalled();
    });

    it('leaves the old room and proceeds to join when "Leave & Join" is chosen', async () => {
        (useRooms as jest.Mock).mockReturnValue({
            currentRoom: { id: 'other-room', name: 'Rainy Library' },
            markJoined,
            markLeft,
        });
        (forceLeaveRoom as jest.Mock).mockResolvedValue(undefined);
        const { result } = await setup({ room: { id: 'room-1', vibe: 'book_club' } });
        await waitFor(() => expect(result.current.hasCheckedMembership).toBe(true));

        await act(async () => {
            result.current.handleJoinPress();
        });
        const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
        const leaveAndJoin = buttons.find((b: any) => b.text === 'Leave & Join');

        await act(async () => {
            await leaveAndJoin.onPress();
        });

        expect(forceLeaveRoom).toHaveBeenCalledWith('other-room', 'user-1');
        expect(markLeft).toHaveBeenCalledWith('other-room', 'user-1');
        expect(joinRoom).toHaveBeenCalled();
    });

    it('does not prompt to leave when already in this same room', async () => {
        (useRooms as jest.Mock).mockReturnValue({
            currentRoom: { id: 'room-1', name: 'This room' },
            markJoined,
            markLeft,
        });
        const { result } = await setup({ room: { id: 'room-1', vibe: 'book_club' } });
        await waitFor(() => expect(result.current.hasCheckedMembership).toBe(true));

        await act(async () => {
            result.current.handleJoinPress();
        });

        expect(Alert.alert).not.toHaveBeenCalled();
        expect(joinRoom).toHaveBeenCalled();
    });

    it('silently re-joins when the user already has an open membership row', async () => {
        (getRoomMembersByRoomId as jest.Mock).mockResolvedValue([
            { user_id: 'user-1', book_id: 'book-1', joined_at: '2024-01-01T00:00:00.000Z' },
        ]);

        await setup({ room: { id: 'room-1', vibe: 'book_club' } });

        await waitFor(() => expect(joinRoom).toHaveBeenCalledWith('book-1'));
    });

    it('does not re-join automatically when the user has no existing membership', async () => {
        const { result } = await setup();
        await waitFor(() => expect(result.current.hasCheckedMembership).toBe(true));

        expect(joinRoom).not.toHaveBeenCalled();
    });

    it('auto-joins on arrival from a room card\'s "Join" button, once membership is checked', async () => {
        const { result } = await setup({ room: { id: 'room-1', vibe: 'book_club' }, autojoin: '1' });

        await waitFor(() => expect(joinRoom).toHaveBeenCalled());
        expect(result.current.hasCheckedMembership).toBe(true);
    });

    it('does not auto-join without the autojoin param', async () => {
        const { result } = await setup();
        await waitFor(() => expect(result.current.hasCheckedMembership).toBe(true));

        expect(joinRoom).not.toHaveBeenCalled();
    });

    it('handleLeaveRoom closes the sheet, leaves presence, and opens the reflection sheet', async () => {
        const { result } = await setup();
        await waitFor(() => expect(result.current.hasCheckedMembership).toBe(true));

        await act(async () => {
            await result.current.handleLeaveRoom();
        });

        expect(bottomSheetRef.current.close).toHaveBeenCalled();
        expect(leaveRoom).toHaveBeenCalled();
        expect(markLeft).toHaveBeenCalledWith('room-1', 'user-1');
        expect(reflectionSheetRef.current.snapToIndex).toHaveBeenCalledWith(0);
    });
});
