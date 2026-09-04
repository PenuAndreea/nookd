import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AuthForm from '@/components/organisms/auth-form';

import { useAuth } from '../../contexts/auth-context';

export default function SignInScreen() {
    const { signIn } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <AuthForm
            title={t('auth.signInTitle')}
            submitLabel={t('auth.signInSubmit')}
            onSubmit={signIn}
            footerPrompt={t('auth.signInFooterPrompt')}
            footerActionLabel={t('auth.signInFooterAction')}
            onFooterPress={() => router.replace('/(auth)/sign-up')}
        />
    );
}
