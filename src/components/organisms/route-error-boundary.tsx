import type { ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/molecules/error-state';
import { useTheme } from '@/hooks/use-theme';

/**
 * The fallback Expo Router renders in place of a screen that threw while
 * rendering. Exported as `ErrorBoundary` from each route file (Expo Router's
 * convention — see https://docs.expo.dev/router/error-handling) so one
 * broken screen shows a recoverable error instead of taking the whole app
 * down with a red screen.
 */
export default function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
    const colors = useTheme();

    if (__DEV__) {
        console.error(error);
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ErrorState onRetry={retry} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
});
