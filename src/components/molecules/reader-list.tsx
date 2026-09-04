import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Avatar from '@/components/atoms/avatar';
import Typography from '@/components/atoms/typography';
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
    const { t } = useTranslation();

    const shown = members.slice(0, SHOWN);
    const overflow = members.length - shown.length;

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {shown.map((member) => (
                <View key={member.user_id} style={styles.cell}>
                    <Avatar id={member.user_id} size="xlarge" />
                    <Typography variant="small" color="sheetTextSecondary" numberOfLines={1}>
                        {member.user_id === currentUserId ? t('rooms.readerList.you') : ''}
                    </Typography>
                </View>
            ))}
            {overflow > 0 && (
                <View style={styles.cell}>
                    <View style={styles.moreCircle}>
                        <Typography variant="captionBold" style={{ color: colors.statusQuietFg }}>
                            {t('rooms.readerList.overflow', { count: overflow })}
                        </Typography>
                    </View>
                    <Typography variant="small" color="sheetTextSecondary">{t('rooms.readerList.more')}</Typography>
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
    moreCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.statusQuietBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
