import { StyleSheet } from 'react-native';

/**
 * Non-typography style objects that showed up byte-for-byte identical
 * across many components — the RN equivalent of a shared CSS class, since
 * RN has no global stylesheet cascade to lean on. (Shared *text* styles
 * live in Typography instead — see `TypographyStyles`.) Call once per
 * component and mix the pieces into `style={[...]}` arrays.
 */
export const createCommonStyles = () => StyleSheet.create({
    // The standard pressed-state dim for a plain touchable that doesn't also
    // scale down (see individual components for the scale+opacity variant).
    pressed: {
        opacity: 0.7,
    },
});
