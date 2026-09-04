import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import AuthForm from '@/components/organisms/auth-form';
import i18n from '@/i18n';

import { useAuth } from '../../contexts/auth-context';

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

export default function SignUpScreen() {
    const { signUp } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();

    async function handleSubmit(email: string, password: string) {
        const { error } = await signUp(email, password);
        if (error) return { error };

        Alert.alert(
            i18n.t('auth.confirmEmailTitle'),
            i18n.t('auth.confirmEmailMessage')
        );
        router.replace('/(auth)/sign-in');
        return { error: null };
    }

    return (
        <AuthForm
            title={t('auth.signUpTitle')}
            passwordPlaceholder={t('auth.signUpPasswordPlaceholder')}
            submitLabel={t('auth.signUpSubmit')}
            validate={(email, password) => {
                if (!email || !password) return t('auth.validationMissingFields');
                if (password.length < 6) return t('auth.validationPasswordLength');
                return null;
            }}
            onSubmit={handleSubmit}
            footerPrompt={t('auth.signUpFooterPrompt')}
            footerActionLabel={t('auth.signUpFooterAction')}
            onFooterPress={() => router.replace('/(auth)/sign-in')}
        />
    );
}
