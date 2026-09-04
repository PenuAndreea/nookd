import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackButton from '@/components/atoms/back-button';
import { TypographyStyles } from '@/components/atoms/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface HeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    right?: React.ReactNode;
    /**
     * Clear the status bar with the device's top safe-area inset. Pass false
     * on a screen that isn't flush with the top of the window — a formSheet
     * still reports the full notch inset, which would leave a band of dead
     * space above the title.
     */
    applyTopInset?: boolean;
}

export const Header = ({ title, showBack = false, onBack, right, applyTopInset = true }: HeaderProps) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colors = useTheme();
    const styles = createStyles(colors);

    // The -20 trims the space the screen already sits under; clamped so the
    // title can never end up with negative top padding.
    const topPadding = applyTopInset ? Math.max(insets.top - 20, Spacing.three) : Spacing.three;

    return (
        <View style={[styles.wrapper, { paddingTop: topPadding }]}>
            <View style={styles.left}>
                {showBack && (
                    <BackButton onPress={onBack ?? (() => router.back())} />
                )}
            </View>

            {title && <Text style={styles.title}>{title}</Text>}

            <View style={styles.right}>
                {right ?? null}
            </View>
        </View>
    );
};

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    left: {
        width: 40,
        alignItems: 'flex-start',
    },
    right: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    title: {
        ...TypographyStyles.navTitle,
        color: colors.text,
        flex: 1,
        textAlign: 'center',
    },
});
