import { useRouter } from 'expo-router';

import AuthForm from '@/components/organisms/auth-form';

import { useAuth } from '../../contexts/auth-context';

export default function SignInScreen() {
    const { signIn } = useAuth();
    const router = useRouter();

    return (
        <AuthForm
            title="Sign in"
            submitLabel="Sign in"
            onSubmit={signIn}
            footerPrompt="Don't have an account?"
            footerActionLabel="Sign up"
            onFooterPress={() => router.replace('/(auth)/sign-up')}
        />
    );
}
