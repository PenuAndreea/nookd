import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { createRoom } from '@/api/readfolk';
import Button from '@/components/atoms/button';
import { Header } from '@/components/molecules/header';
import { LabeledInput } from '@/components/molecules/labeled-input';
import { DurationPicker, MoodPicker } from '@/components/molecules/picker';
import { Book, BookSearch } from '@/components/molecules/search-input';
import { BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
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

    const { session } = useAuth()

    async function handleCreateRoom() {
        if (isSubmitting) return;

        const trimmedName = name.trim();

        setIsSubmitting(true);

        await create({
            description: description.trim() || null,
            duration_minutes: Number(duration) || null,
            host_id: session?.user.id,
            name: trimmedName || null,
            started_at: new Date().toISOString(),
        });

        setIsSubmitting(false);
    }

    async function create(input: Room) {
        try {
            await createRoom(input)
            router.back()
        } catch (error) {
            console.error('Error creating room:', error, input)
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
