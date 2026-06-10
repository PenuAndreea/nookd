import { useTheme } from "@/hooks/use-theme";
import { Image, StyleSheet } from "react-native";

const AVATAR_URL = `https://api.dicebear.com/9.x/lorelei/png?seed=user-`
const avatarSizes = {
    small: 20,
    medium: 24,
    large: 32,
}

export default function Avatar({ id, size }: { id: string; size: keyof typeof avatarSizes }) {
    const avatarUrl = `${AVATAR_URL}${id}`;
    const avatarSize = avatarSizes[size] || avatarSizes.medium;
    const colors = useTheme();
    const styles = useStyles(avatarSize, colors);

    return (
        <Image
            source={{ uri: avatarUrl }}
            style={styles.image}
            accessibilityLabel="User Avatar"
        />
    )
}

const useStyles = (size: number, colors: any) =>
    StyleSheet.create({
        image: {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.backgroundElement,
        },
    })