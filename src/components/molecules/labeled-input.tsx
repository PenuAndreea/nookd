import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface LabeledInputProps extends TextInputProps {
    label: string;
    error?: string;
}

export const LabeledInput = ({ label, error, ...props }: LabeledInputProps) => {
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    focused && styles.inputFocused,
                    error && styles.inputError,
                ]}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholderTextColor="#aaa"
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        color: '#1a1a1a',
    },
    inputFocused: {
        borderWidth: 1.5,
        borderColor: '#f0b429',
    },
    inputError: {
        borderWidth: 1.5,
        borderColor: '#e24b4a',
    },
    error: {
        fontSize: 12,
        color: '#e24b4a',
    },
});