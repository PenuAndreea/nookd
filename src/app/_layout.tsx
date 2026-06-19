import { Slot } from 'expo-router';

import { AuthProvider } from '../contexts/auth-context';

export default function RootLayout() {
    return (
        <AuthProvider>
            <Slot />
        </AuthProvider>
    );
}
