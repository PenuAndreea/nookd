import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

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

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

export default function CreateRoomScreen() {
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

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
            Alert.alert(t('rooms.create.notCreatedTitle'), t('rooms.create.notCreatedSignedOut'));
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
            Alert.alert(t('rooms.create.notCreatedTitle'), t('rooms.create.notCreatedError'));
        }
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            stickyHeaderIndices={[0]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
        >
            <View style={styles.headerBar}>
                <Header title={t('rooms.create.headerTitle')} showBack applyTopInset={false} />
            </View>
            <View style={styles.form}>
                <LabeledInput
                    label={t('rooms.create.nameLabel')}
                    placeholder={t('rooms.create.namePlaceholder')}
                    value={name}
                    onChangeText={setName}
                />
                <LabeledInput
                    label={t('rooms.create.descriptionLabel')}
                    placeholder={t('rooms.create.descriptionPlaceholder')}
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
                <Button
                    size='medium'
                    title={isSubmitting ? t('rooms.create.submitting') : t('rooms.create.submit')}
                    onPress={handleCreateRoom}
                />
            </View>
        </ScrollView>
    )
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingBottom: Spacing.four,
    },
    // Opaque so the form doesn't show through while it is pinned.
    headerBar: {
        backgroundColor: colors.background,
    },
    form: {
        padding: Spacing.three,
        gap: Spacing.three,
    },
});
