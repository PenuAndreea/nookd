import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, Text, View } from "react-native";

import Avatar from "../atoms/avatar";

export default function AvatarList({ userIds }: { userIds?: string[] }) {
    const colors = useTheme();
    const styles = useStyles(colors);

    console.log('userIds', userIds)
    return (
        <View style={styles.container}>
            {userIds?.slice(0, 3).map((userId) => (
                <Avatar key={userId} id={userId} size="small" />
            ))}
            {userIds && userIds?.length > 0 && (
                <Text style={styles.readerCount}>{userIds?.length} reading</Text>
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