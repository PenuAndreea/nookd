import { SymbolView } from "expo-symbols";
import { ColorValue } from "react-native";

import { Colors } from "../../constants/theme";

export const IconSizes = {
    small: 16,
    medium: 24,
    large: 32,
}

export type IconName = Parameters<typeof SymbolView>[0]["name"];

type IconProps = {
    name: IconName;
    size?: number;
    color?: ColorValue;
}

export function Icon({
    name,
    size = IconSizes.medium,
    color = Colors.light.accent
}: IconProps) {
    return (
        <SymbolView
            name={name}
            size={size}
            tintColor={color}
        />
    );
}           
