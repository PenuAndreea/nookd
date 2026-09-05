// `usePreventRemove` is not part of expo-router's public API — expo-router 57
// vendors React Navigation rather than depending on it, so there is no
// `@react-navigation/native` package to import from, and the barrel at
// `expo-router` does not re-export this hook.
//
// It is worth reaching for anyway. The documented alternative, a `beforeRemove`
// listener, is explicitly unreliable on the native stack this app uses --
// `usePreventRemove` exists precisely because of that. Everything is funnelled
// through this one import so an expo-router upgrade that moves it breaks here,
// loudly, at typecheck, rather than silently letting readers leave a room
// without their session being closed.
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import { Alert } from 'react-native';

import i18n from '@/i18n';

/**
 * Leaving the room screen *is* leaving the room, so dismissing it needs the
 * same confirmation the explicit Leave button implies. Guards the header's back
 * button and the iOS swipe-back gesture alike: the swipe begins, then cancels
 * when the action is prevented.
 *
 * `onConfirm` is the normal leave path — it ends the session and opens the
 * reflection sheet, which navigates back itself once the reader is done. That
 * is why the prevented action is never re-dispatched here: doing so would pop
 * the screen out from under the reflection sheet.
 *
 * Pass `enabled: false` while the reader has not joined, so browsing a room
 * without joining leaves back working normally.
 */
export function useLeaveRoomGuard(enabled: boolean, onConfirm: () => void) {
    usePreventRemove(enabled, () => {
        Alert.alert(
            i18n.t('rooms.leaveConfirmTitle'),
            i18n.t('rooms.leaveConfirmMessage'),
            [
                { text: i18n.t('common.cancel'), style: 'cancel' },
                {
                    text: i18n.t('rooms.leaveConfirmAction'),
                    style: 'destructive',
                    onPress: onConfirm,
                },
            ]
        );
    });
}
