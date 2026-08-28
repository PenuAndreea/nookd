import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { getOrCreateBook } from '@/api/books';
import { createRoom, RoomInsert } from '@/api/rooms';
import Button from '@/components/atoms/button';
import { Header } from '@/components/molecules/header';
import { LabeledInput } from '@/components/molecules/labeled-input';
import { DurationPicker, VibePicker } from '@/components/molecules/picker';
import { Book, BookSearch } from '@/components/molecules/search-input';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

export default function CreateRoomScreen() {
    const colors = useTheme();
    const styles = createStyles(colors);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vibe, setVibe] = useState<string | null>(null);
    const [duration, setDuration] = useState<string | null>('60');
    const [book, setBook] = useState<Book | null>(null);

    const { session } = useAuth()
    const { addRoom } = useRooms()

    async function handleCreateRoom() {
        if (isSubmitting) return;

        const hostId = session?.user.id;
        if (!hostId) {
            Alert.alert('Room not created', 'You need to be signed in to create a room.');
            return;
        }

        const trimmedName = name.trim();

        setIsSubmitting(true);

        const isBookClub = vibe === 'book_club';

        let bookId: string | null = null;
        if (isBookClub && book) {
            try {
                const cachedBook = await getOrCreateBook({
                    openLibraryKey: book.openLibraryKey,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.thumbnail,
                    pageCount: book.pageCount,
                });
                bookId = cachedBook.id;
            } catch (error) {
                // Don't block room creation on a flaky book cache — the room
                // doesn't strictly need a book attached.
                console.error('Error caching selected book:', error);
            }
        }

        await create({
            book_id: bookId,
            description: description.trim() || null,
            duration_minutes: Number(duration) || null,
            host_id: hostId,
            name: trimmedName || null,
            started_at: new Date().toISOString(),
            vibe,
        });

        setIsSubmitting(false);
    }

    async function create(input: RoomInsert) {
        try {
            const room = await createRoom(input)
            addRoom(room)
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
                <VibePicker
                    value={vibe}
                    onChange={(id) => {
                        setVibe(id);
                        if (id !== 'book_club') setBook(null);
                    }}
                />
                <DurationPicker value={duration} onChange={setDuration} />
                {vibe === 'book_club' && <BookSearch value={book} onChange={setBook} />}
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
});
