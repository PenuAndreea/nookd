import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/atoms/avatar';
import Button from '@/components/atoms/button';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ProfileSheetProps {
    userId: string;
    email?: string;
    onSignOut: () => void;
}

// NOTE: this is a temporary component until we have a proper profile screen
const ProfileSheet = forwardRef<BottomSheet, ProfileSheetProps>(
    ({ userId, email, onSignOut }, ref) => {
        const colors = useTheme();
        const styles = createStyles(colors);

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    pressBehavior="close"
                    opacity={0.35}
                />
            ),
            []
        );

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={['36%']}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <BottomSheetView style={styles.content}>
                    <View style={styles.identity}>
                        <Avatar id={userId} size="xxlarge" />
                        {email && (
                            <Text style={styles.email} numberOfLines={1}>
                                {email}
                            </Text>
                        )}
                    </View>

                    <Button
                        title="Sign out"
                        icon="rectangle.portrait.and.arrow.right"
                        onPress={onSignOut}
                    />
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

ProfileSheet.displayName = 'ProfileSheet';

export default ProfileSheet;

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    sheetBackground: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        shadowColor: colors.sheetText,
        shadowOpacity: 0.18,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: -10 },
        elevation: 12,
    },
    handleIndicator: {
        backgroundColor: colors.sheetHandle,
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.two,
        // This sheet lives inside a tab screen, so the tab bar paints over its
        // lower edge — keep the actions clear of it.
        paddingBottom: BottomTabInset + Spacing.four,
        gap: Spacing.four,
    },
    identity: {
        alignItems: 'center',
        gap: Spacing.two,
    },
    email: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.sheetText,
    },
});
