import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import AuthForm from '@/components/organisms/auth-form';

import { useAuth } from '../../contexts/auth-context';

export default function SignUpScreen() {
    const { signUp } = useAuth();
    const router = useRouter();

    async function handleSubmit(email: string, password: string) {
        const { error } = await signUp(email, password);
        if (error) return { error };

        Alert.alert(
            'Check your email',
            'We sent you a confirmation link. Please verify your email before signing in.'
        );
        router.replace('/(auth)/sign-in');
        return { error: null };
    }

    return (
        <AuthForm
            title="Create account"
            passwordPlaceholder="At least 6 characters"
            submitLabel="Sign up"
            validate={(email, password) => {
                if (!email || !password) return 'Please enter an email and password.';
                if (password.length < 6) return 'Password must be at least 6 characters.';
                return null;
            }}
            onSubmit={handleSubmit}
            footerPrompt="Already have an account?"
            footerActionLabel="Sign in"
            onFooterPress={() => router.replace('/(auth)/sign-in')}
        />
    );
}
