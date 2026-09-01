import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
import { Header } from '@/components/molecules/header';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useLocalSearchParams } from 'expo-router';

const STATUS_OPTIONS: { id: UserBookStatus; label: string }[] = [
    { id: 'want_to_read', label: 'Want to read' },
    { id: 'currently_reading', label: 'Currently reading' },
    { id: 'finished', label: 'Finished' },
];

export default function BookDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { session } = useAuth();
    const userId = session?.user?.id;
    const colors = useTheme();
    const styles = createStyles(colors);

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
        load();
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

            <View style={styles.heroRow}>
                <View style={[styles.cover, book.cover_url && styles.coverNoBackground]}>
                    {book.cover_url ? (
                        <Image source={{ uri: book.cover_url }} style={styles.coverImage} resizeMode="contain" />
                    ) : (
                        <Text style={{ fontSize: 28 }}>📖</Text>
                    )}
                </View>
                <View style={styles.heroInfo}>
                    <Text style={styles.title}>{book.title}</Text>
                    {book.author && <Text style={styles.author}>{book.author}</Text>}
                    {activeRoomCount > 0 && (
                        <Text style={styles.activeReaders}>
                            {activeRoomCount} {activeRoomCount === 1 ? 'room is' : 'rooms are'} reading this
                        </Text>
                    )}
                </View>
            </View>

            {book.description && (
                <Text style={styles.description}>{book.description}</Text>
            )}

            {!userBook ? (
                <Button title={saving ? 'Adding...' : 'Add to reading list'} onPress={handleAdd} />
            ) : (
                <View style={styles.listSection}>
                    <Text style={styles.sectionLabel}>Status</Text>
                    <View style={styles.statusRow}>
                        {STATUS_OPTIONS.map((option) => {
                            const selected = userBook.status === option.id;
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.statusChip, selected && styles.statusChipSelected]}
                                    onPress={() => handleStatusChange(option.id)}
                                    disabled={saving}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.statusText, selected && styles.statusTextSelected]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {userBook.status === 'currently_reading' && (
                        <View style={styles.pageSection}>
                            <Text style={styles.sectionLabel}>
                                Current page{book.page_count ? ` (of ${book.page_count})` : ''}
                            </Text>
                            <View style={styles.pageRow}>
                                <TextInput
                                    style={styles.pageInput}
                                    value={pageInput}
                                    onChangeText={setPageInput}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Button title="Save" size="small" onPress={handleSavePage} />
                            </View>
                        </View>
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
    heroRow: {
        flexDirection: 'row',
        gap: Spacing.three,
    },
    cover: {
        width: 96,
        height: 130,
        borderRadius: BorderRadius.medium,
        backgroundColor: colors.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    coverNoBackground: {
        backgroundColor: 'transparent',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    heroInfo: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    title: {
        fontFamily: 'Lora_700Bold',
        fontSize: 20,
        color: colors.text,
    },
    author: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    activeReaders: {
        fontSize: 12,
        color: colors.accent,
        marginTop: 4,
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
    statusRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
    },
    statusChipSelected: {
        backgroundColor: '#FFF3D6',
        borderWidth: 1.5,
        borderColor: '#f0b429',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },
    statusTextSelected: {
        color: '#5a3a00',
    },
    pageSection: {
        gap: 6,
    },
    pageRow: {
        flexDirection: 'row',
        gap: Spacing.two,
        alignItems: 'center',
    },
    pageInput: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
});
