import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { createRoom } from '@/api/nookd';
import Button from '@/components/atoms/button';
import { BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { Room } from './types';

export default function CreateRoomScreen() {
    const colors = useTheme();
    const styles = createStyles(colors);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isbn, setIsbn] = useState('9781786892737');
    const [hostId, setHostId] = useState('1de8b434-3848-464a-8b31-9f08f262ed11');
    const [durationMinutes, setDurationMinutes] = useState('60');
    const [isSubmitting, setIsSubmitting] = useState(false);

    function createRoomId() {
        if (typeof globalThis.crypto?.randomUUID === 'function') {
            return globalThis.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    async function handleCreateRoom() {
        if (isSubmitting) return;

        const trimmedHostId = hostId.trim();
        const trimmedName = name.trim();

        if (!trimmedHostId) {
            Alert.alert('Host required', 'Enter a host id to create the room.');
            return;
        }

        setIsSubmitting(true);

        await create({
            description: description.trim() || null,
            duration_minutes: Number(durationMinutes) || null,
            host_id: trimmedHostId,
            isbn: Number(isbn) || null,
            name: trimmedName || null,
            started_at: new Date().toISOString(),
            status: 'waiting',
        });

        setIsSubmitting(false);
    }

    async function create(input: Room) {
        try {
            await createRoom(input)
            router.navigate(`/rooms/${input.id}`);
        } catch (error) {
            console.error('Error creating room:', error)
            Alert.alert('Room not created', 'Something went wrong while creating the room.');
        }

    }

    return (
        <View style={styles.container}>
            <TextInput
                autoCapitalize="sentences"
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={name}
            />
            <TextInput
                multiline
                onChangeText={setDescription}
                placeholder="Description"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, styles.textArea]}
                value={description}
            />
            <TextInput
                inputMode="numeric"
                keyboardType="number-pad"
                onChangeText={setIsbn}
                placeholder="ISBN"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={isbn}
            />
            <TextInput
                autoCapitalize="none"
                onChangeText={setHostId}
                placeholder="Host ID"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={hostId}
            />
            <TextInput
                inputMode="numeric"
                keyboardType="number-pad"
                onChangeText={setDurationMinutes}
                placeholder="Duration minutes"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={durationMinutes}
            />
            <View style={{ justifyContent: 'center' }}>
                <Button
                    size='large'
                    title={isSubmitting ? 'Creating...' : 'Create room'}
                    onPress={handleCreateRoom}
                />
            </View>

        </View>
    )
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        gap: Spacing.three,
        backgroundColor: colors.white,
        paddingVertical: Spacing.four,
        paddingHorizontal: Spacing.three,
    },
    title: {
        color: colors.text,
        fontSize: FontSizes.large,
        fontWeight: '700',
    },
    input: {
        backgroundColor: colors.backgroundElement,
        borderRadius: BorderRadius.medium,
        color: colors.text,
        fontSize: FontSizes.medium,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    textArea: {
        minHeight: 96,
        textAlignVertical: 'top',
    },
});
