import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    right?: React.ReactNode;
}

export const Header = ({ title, showBack = false, onBack, right }: HeaderProps) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrapper, { paddingTop: insets.top - 20 }]}>
            <View style={styles.left}>
                {showBack && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack ?? (() => router.back())}
                        hitSlop={8}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                )}
            </View>

            {title && <Text style={styles.title}>{title}</Text>}

            <View style={styles.right}>
                {right ?? null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        // backgroundColor: '#f5f3ef'
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
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a1a',
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        fontSize: 24,
        color: '#1a1a1a',
        lineHeight: 28,
    },
});