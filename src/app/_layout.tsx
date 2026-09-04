import { Lora_700Bold, useFonts } from '@expo-google-fonts/lora';
import { Slot } from 'expo-router';

import '../i18n';
import { AuthProvider } from '../contexts/auth-context';

export default function RootLayout() {
    // Loaded once here rather than inside Typography, which re-ran useFonts on
    // every heading and rendered nothing at all until the font arrived. Not
    // gated on the result: headings fall back to the system font for a moment
    // instead of being invisible.
    useFonts({ Lora_700Bold });

    return (
        <AuthProvider>
            <Slot />
        </AuthProvider>
    );
}
