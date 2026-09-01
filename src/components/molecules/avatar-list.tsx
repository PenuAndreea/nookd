import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, Text, View } from "react-native";

import Avatar from "../atoms/avatar";

const SHOWN = 3;

export default function AvatarList({ userIds }: { userIds?: string[] }) {
    const colors = useTheme();
    const styles = useStyles(colors);

    const count = userIds?.length ?? 0;
    if (count === 0) {
        return <Text style={styles.readerCount}>No one yet</Text>;
    }

    return (
        <View style={styles.container}>
            {userIds?.slice(0, SHOWN).map((userId, index) => (
                <View key={userId} style={[styles.avatar, index > 0 && styles.overlapped]}>
                    <Avatar id={userId} size="small" />
                </View>
            ))}
            <Text style={styles.readerCount}>{count} reading</Text>
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
        color: colors.textSecondary,
        marginLeft: 8,
        fontSize: 13,
    },
});
