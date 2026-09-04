import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackButton from '@/components/atoms/back-button';
import { TypographyStyles } from '@/components/atoms/typography';
import { useTheme } from '@/hooks/use-theme';

interface HeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    right?: React.ReactNode;
}

export const Header = ({ title, showBack = false, onBack, right }: HeaderProps) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colors = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={[styles.wrapper, { paddingTop: insets.top - 20 }]}>
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
