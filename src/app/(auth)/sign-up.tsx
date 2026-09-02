import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';

import logo from '@/assets/images/logo.png';
import Button from '@/components/atoms/button';
import Typography from '@/components/atoms/typography';
import { LabeledInput } from '@/components/molecules/labeled-input';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from '../../contexts/auth-context';

export default function SignUpScreen() {
    const { signUp } = useAuth();
    const router = useRouter();
    const colors = useTheme();
    const styles = createStyles(colors);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async () => {
        setError(null);

        if (!email || !password) {
            setError('Please enter an email and password.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        const { error } = await signUp(email, password);
        setLoading(false);

        if (error) {
            setError(error);
            return;
        }

        Alert.alert(
            'Check your email',
            'We sent you a confirmation link. Please verify your email before signing in.'
        );
        router.replace('/(auth)/sign-in');
    };

    return (
        <View style={styles.container}>
            <Image source={logo} style={styles.logo} />
            <Typography style={{ alignSelf: 'center' }} variant="h1">Create account</Typography>

            <LabeledInput
                label="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <LabeledInput
                label="Password"
                placeholder="At least 6 characters"
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
                <Button title="Sign up" onPress={handleSignUp} />
            )}

            <Text style={styles.link} onPress={() => router.replace('/(auth)/sign-in')}>
                Already have an account? Sign in
            </Text>
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
    error: {
        color: '#e24b4a',
        fontSize: 13,
    },
    link: {
        marginTop: Spacing.two,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
