import { renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import { useLeaveRoomGuard } from '@/hooks/use-leave-room-guard';

jest.mock('expo-router/build/react-navigation/core', () => ({
    usePreventRemove: jest.fn(),
}));

const onConfirm = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

/** Runs the callback usePreventRemove was registered with. */
function triggerDismissAttempt() {
    const callback = (usePreventRemove as jest.Mock).mock.calls.at(-1)?.[1];
    callback({ data: { action: { type: 'POP' } } });
}

/** Presses one of the buttons the Alert was configured with. */
function pressAlertButton(index: number) {
    const buttons = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2];
    buttons[index].onPress?.();
}

describe('useLeaveRoomGuard', () => {
    it('arms the guard only while the reader has joined', async () => {
        const { rerender } = await renderHook(
            ({ joined }: { joined: boolean }) => useLeaveRoomGuard(joined, onConfirm),
            { initialProps: { joined: false } }
        );

        expect(usePreventRemove).toHaveBeenLastCalledWith(false, expect.any(Function));

        await rerender({ joined: true });

        expect(usePreventRemove).toHaveBeenLastCalledWith(true, expect.any(Function));
    });

    it('asks before leaving, using real copy', async () => {
        await renderHook(() => useLeaveRoomGuard(true, onConfirm));

        triggerDismissAttempt();

        expect(Alert.alert).toHaveBeenCalledWith(
            'Leave this room?',
            'Your reading session will end and be saved.',
            expect.any(Array)
        );
        // Asking must not itself end the session.
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('leaves the room when the reader confirms', async () => {
        await renderHook(() => useLeaveRoomGuard(true, onConfirm));

        triggerDismissAttempt();
        pressAlertButton(1);

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('stays in the room when the reader cancels', async () => {
        await renderHook(() => useLeaveRoomGuard(true, onConfirm));

        triggerDismissAttempt();
        pressAlertButton(0);

        expect(onConfirm).not.toHaveBeenCalled();
    });
});
