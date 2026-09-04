import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
    addToReadingList,
    Book,
    countActiveRoomsForBook,
    getBook,
    getUserBookForBook,
    updateReadingListEntry,
    UserBook,
    UserBookStatus,
} from '@/api/books';
import Button from '@/components/atoms/button';
import BookHero from '@/components/molecules/book-hero';
import { BookStatusChips } from '@/components/molecules/book-status-chips';
import { Header } from '@/components/molecules/header';
import { LabeledInput } from '@/components/molecules/labeled-input';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useLocalSearchParams } from 'expo-router';

export default function BookDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { session } = useAuth();
    const userId = session?.user?.id;
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    const [book, setBook] = useState<Book | null>(null);
    const [userBook, setUserBook] = useState<UserBook | null>(null);
    const [activeRoomCount, setActiveRoomCount] = useState(0);
    const [pageInput, setPageInput] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        try {
            const [bookData, roomCount] = await Promise.all([
                getBook(id),
                countActiveRoomsForBook(id),
            ]);
            setBook(bookData);
            setActiveRoomCount(roomCount);

            if (userId) {
                const entry = await getUserBookForBook(userId, id);
                setUserBook(entry);
                setPageInput(entry?.current_page != null ? String(entry.current_page) : '');
            }
        } catch (error) {
            console.error('Error loading book:', error);
        }
    }, [id, userId]);

    useEffect(() => {
        // Calling the memoized loader through a local wrapper (rather than as
        // a bare reference) keeps this a plain "refetch on dependency change"
        // effect the analyzer can see through, instead of an opaque call to
        // an externally-defined function.
        function run() {
            load();
        }
        run();
    }, [load]);

    async function handleAdd() {
        if (!userId) return;
        setSaving(true);
        try {
            const entry = await addToReadingList(userId, id, 'want_to_read');
            setUserBook(entry);
        } catch (error) {
            console.error('Error adding book to reading list:', error);
        } finally {
            setSaving(false);
        }
    }

    async function handleStatusChange(status: UserBookStatus) {
        if (!userBook || saving) return;
        setSaving(true);
        try {
            const patch: Partial<Pick<UserBook, 'status' | 'started_at' | 'finished_at'>> = { status };
            if (status === 'currently_reading' && !userBook.started_at) {
                patch.started_at = new Date().toISOString();
            }
            if (status === 'finished') {
                patch.finished_at = new Date().toISOString();
            }
            const updated = await updateReadingListEntry(userBook.id, patch);
            setUserBook(updated);
        } catch (error) {
            console.error('Error updating reading status:', error);
        } finally {
            setSaving(false);
        }
    }

    async function handleSavePage() {
        if (!userBook) return;
        const page = Number(pageInput);
        if (!pageInput || Number.isNaN(page)) return;

        setSaving(true);
        try {
            const updated = await updateReadingListEntry(userBook.id, { current_page: page });
            setUserBook(updated);
        } catch (error) {
            console.error('Error updating page progress:', error);
        } finally {
            setSaving(false);
        }
    }

    if (!book) {
        return (
            <View style={styles.container}>
                <Header title="" showBack />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Header title="" showBack />

            <BookHero book={book} activeRoomCount={activeRoomCount} />

            {book.description && (
                <Text style={styles.description}>{book.description}</Text>
            )}

            {!userBook ? (
                <Button title={saving ? t('books.addingToReadingList') : t('books.addToReadingList')} onPress={handleAdd} />
            ) : (
                <View style={styles.listSection}>
                    <Text style={styles.sectionLabel}>{t('books.statusLabel')}</Text>
                    <BookStatusChips
                        value={userBook.status}
                        onChange={handleStatusChange}
                        disabled={saving}
                    />

                    {userBook.status === 'currently_reading' && (
                        <LabeledInput
                            label={book.page_count
                                ? t('books.currentPageLabelWithTotal', { total: book.page_count })
                                : t('books.currentPageLabel')}
                            value={pageInput}
                            onChangeText={setPageInput}
                            keyboardType="number-pad"
                            placeholder="0"
                            right={<Button title={t('common.save')} size="small" onPress={handleSavePage} />}
                        />
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.six,
        gap: Spacing.four,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.textSecondary,
    },
    listSection: {
        gap: Spacing.three,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
});
