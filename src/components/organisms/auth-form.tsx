import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import logo from '@/assets/images/logo.png';
import Button from '@/components/atoms/button';
import TextButton from '@/components/atoms/text-button';
import Typography from '@/components/atoms/typography';
import { LabeledInput } from '@/components/molecules/labeled-input';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AuthFormProps {
    title: string;
    passwordPlaceholder?: string;
    submitLabel: string;
    /** Runs before onSubmit; returning a string blocks submission and shows it as the error. */
    validate?: (email: string, password: string) => string | null;
    onSubmit: (email: string, password: string) => Promise<{ error: string | null }>;
    footerPrompt: string;
    footerActionLabel: string;
    onFooterPress: () => void;
}

/**
 * The shared shell behind sign-in and sign-up: logo, title, email/password
 * fields, an error line, the submit button, and a footer link to the other
 * screen. The two screens differ only in copy, validation, and what they do
 * with a successful submit — all passed in as props.
 */
export default function AuthForm({
    title,
    passwordPlaceholder,
    submitLabel,
    validate,
    onSubmit,
    footerPrompt,
    footerActionLabel,
    onFooterPress,
}: AuthFormProps) {
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        setError(null);

        const validationError = validate?.(email, password) ?? (!email || !password
            ? t('auth.validationMissingFields')
            : null);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        const { error } = await onSubmit(email, password);
        setLoading(false);

        if (error) setError(error);
    }

    return (
        <View style={styles.container}>
            <Image source={logo} style={styles.logo} />
            <Typography style={styles.title} variant="h1">{title}</Typography>

            <LabeledInput
                label={t('auth.emailLabel')}
                placeholder={t('auth.emailPlaceholder')}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <LabeledInput
                label={t('auth.passwordLabel')}
                placeholder={passwordPlaceholder ?? t('auth.passwordPlaceholder')}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {loading ? (
                <ActivityIndicator color={colors.accent} />
            ) : (
                <Button title={submitLabel} onPress={handleSubmit} />
            )}

            <TextButton
                variant="secondary"
                title={`${footerPrompt} ${footerActionLabel}`}
                onPress={onFooterPress}
                style={styles.footer}
            />
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: Spacing.four,
        gap: Spacing.three,
        backgroundColor: colors.background,
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.medium,
        alignSelf: 'center',
    },
    title: {
        alignSelf: 'center',
    },
    error: {
        color: colors.error,
        fontSize: 13,
    },
    footer: {
        marginTop: Spacing.two,
    },
});
