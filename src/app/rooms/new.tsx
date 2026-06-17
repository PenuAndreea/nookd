import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { createRoom } from '@/api/nookd';
import Button from '@/components/atoms/button';
import { Header } from '@/components/molecules/header';
import { LabeledInput } from '@/components/molecules/labeled-input';
import { DurationPicker, MoodPicker } from '@/components/molecules/picker';
import { Book, BookSearch } from '@/components/molecules/search-input';
import { BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { Room } from './types';

export default function CreateRoomScreen() {
    const colors = useTheme();
    const styles = createStyles(colors);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mood, setMood] = useState<string | null>(null);
    const [duration, setDuration] = useState<string | null>('60');
    const [book, setBook] = useState<Book | null>(null);

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
            id: createRoomId(),
            description: description.trim() || null,
            duration_minutes: Number(duration) || null,
            host_id: '1de8b434-3848-464a-8b31-9f08f262ed11', // the host id from the profile
            isbn: 9781786892737, // optional
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
            <Header title="Create Room" showBack />
            <View style={{ marginHorizontal: 16, gap: 16 }}>
                <LabeledInput
                    label="Room name"
                    placeholder="e.g. Sunday deep work"
                    value={name}
                    onChangeText={setName}
                />
                <LabeledInput
                    label="Description"
                    placeholder="What's the vibe?"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                // error="Description is required"
                />
                <MoodPicker value={mood} onChange={setMood} />
                <DurationPicker value={duration} onChange={setDuration} />
                <BookSearch value={book} onChange={setBook} />
                <View style={{ justifyContent: 'center' }}>
                    <Button
                        size='medium'
                        title={isSubmitting ? 'Creating...' : 'Create room'}
                        onPress={handleCreateRoom}
                    />
                </View>
            </View>
        </View>
    )
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        gap: Spacing.three,
        backgroundColor: colors.background,
        paddingVertical: Spacing.four,
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
