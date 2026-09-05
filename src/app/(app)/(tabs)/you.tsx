import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Avatar from '@/components/atoms/avatar';
import Button from '@/components/atoms/button';
import Typography from '@/components/atoms/typography';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

export default function YouScreen() {
    const { session, signOut } = useAuth();
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    const userId = session?.user.id;
    const email = session?.user.email;

    return (
        <View style={styles.container}>
            <Typography variant="title1">{t('profile.title')}</Typography>

            <View style={styles.identity}>
                {userId && <Avatar id={userId} size="xxlarge" />}
                {email && (
                    <Typography variant="subhead" color="textSecondary" numberOfLines={1}>
                        {email}
                    </Typography>
                )}
            </View>

            <Button
                title={t('profile.signOut')}
                icon="rectangle.portrait.and.arrow.right"
                onPress={signOut}
            />
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Spacing.six,
        paddingHorizontal: Spacing.three,
        // The tab bar paints over the lower edge of the screen — keep the
        // sign-out button clear of it.
        paddingBottom: BottomTabInset + Spacing.four,
        gap: Spacing.four,
    },
    identity: {
        alignItems: 'center',
        gap: Spacing.two,
        marginTop: Spacing.four,
    },
});
