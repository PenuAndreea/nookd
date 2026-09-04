import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/atoms/avatar';
import { useTheme } from '@/hooks/use-theme';

const SHOWN = 5;

interface ReaderListProps {
    members: { user_id: string }[];
    /** The signed-in user's id, labeled "You" instead of left blank. */
    currentUserId?: string;
}

/** A horizontally-scrolling row of reader avatars, with a "+N More" tile past the first few. */
export default function ReaderList({ members, currentUserId }: ReaderListProps) {
    const colors = useTheme();
    const styles = createStyles(colors);

    const shown = members.slice(0, SHOWN);
    const overflow = members.length - shown.length;

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {shown.map((member) => (
                <View key={member.user_id} style={styles.cell}>
                    <Avatar id={member.user_id} size="xlarge" />
                    <Text style={styles.name} numberOfLines={1}>
                        {member.user_id === currentUserId ? 'You' : ''}
                    </Text>
                </View>
            ))}
            {overflow > 0 && (
                <View style={styles.cell}>
                    <View style={styles.moreCircle}>
                        <Text style={styles.moreText}>+{overflow}</Text>
                    </View>
                    <Text style={styles.name}>More</Text>
                </View>
            )}
        </ScrollView>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    cell: {
        alignItems: 'center',
        width: 52,
        marginRight: 14,
        gap: 6,
    },
    name: {
        fontSize: 12,
        color: colors.sheetTextSecondary,
    },
    moreCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.statusQuietBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.statusQuietFg,
    },
});
