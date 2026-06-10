import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, Text, View } from "react-native";

import Avatar from "../atoms/avatar";

export default function AvatarList({ userIds }: { userIds?: string[] }) {
    const colors = useTheme();
    const styles = useStyles(colors);

    return (
        <View style={styles.container}>
            {userIds?.slice(0, 3).map((userId) => (
                <Avatar key={userId} id={userId} size="small" />
            ))}
            {userIds && userIds?.length > 3 && (
                <Text style={styles.readerCount}>+{userIds?.length - 3} readers</Text>
            )}
        </View>
    )
}

const useStyles = (colors: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    readerCount: {
        color: colors.textSecondary,
        marginLeft: 8,
    },
});