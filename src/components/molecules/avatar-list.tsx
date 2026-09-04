import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import Avatar from "../atoms/avatar";
import Typography from "../atoms/typography";

const SHOWN = 3;

export default function AvatarList({ userIds }: { userIds?: string[] }) {
    const colors = useTheme();
    const styles = useStyles(colors);
    const { t } = useTranslation();

    const count = userIds?.length ?? 0;
    if (count === 0) {
        return <Typography variant="caption" color="sheetTextSecondary">{t('rooms.noOneYet')}</Typography>;
    }

    return (
        <View style={styles.container}>
            {userIds?.slice(0, SHOWN).map((userId, index) => (
                <View key={userId} style={[styles.avatar, index > 0 && styles.overlapped]}>
                    <Avatar id={userId} size="small" />
                </View>
            ))}
            <Typography variant="caption" color="sheetTextSecondary" style={styles.readerCount}>
                {t('rooms.reading', { count })}
            </Typography>
        </View>
    )
}

const useStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        borderRadius: 999,
        borderWidth: 2,
        borderColor: colors.white,
    },
    overlapped: {
        marginLeft: -10,
    },
    readerCount: {
        marginLeft: 8,
    },
});
