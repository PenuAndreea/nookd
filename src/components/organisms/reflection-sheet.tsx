import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetTextInput,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Book } from '@/api/books';
import Button from '@/components/atoms/button';
import { SessionMoodPicker } from '@/components/molecules/picker';
import { useTheme } from '@/hooks/use-theme';

export interface ReflectionData {
    thoughts: string;
    pageReached: number | null;
    mood: string | null;
    finished: boolean;
}

interface ReflectionSheetProps {
    book: Book | null;
    initialPage?: number | null;
    onSubmit: (data: ReflectionData) => Promise<void>;
    onSkip: () => void;
}

const ReflectionSheet = forwardRef<BottomSheet, ReflectionSheetProps>(
    ({ book, initialPage, onSubmit, onSkip }, ref) => {
        const colors = useTheme();
        const styles = createStyles(colors);

        const [thoughts, setThoughts] = useState('');
        const [pageInput, setPageInput] = useState(initialPage != null ? String(initialPage) : '');
        const [mood, setMood] = useState<string | null>(null);
        const [finished, setFinished] = useState(false);
        const [submitting, setSubmitting] = useState(false);
        const [error, setError] = useState<string | null>(null);

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    pressBehavior="none"
                    opacity={0.35}
                />
            ),
            []
        );

        // TODO: this should be a proper form component, not just a bunch of state variables. Separate component
        async function handleSubmit() {
            setSubmitting(true);
            setError(null);
            try {
                const page = pageInput ? Number(pageInput) : null;
                await onSubmit({
                    thoughts: thoughts.trim(),
                    pageReached: page != null && !Number.isNaN(page) ? page : null,
                    mood,
                    finished,
                });
            } catch {
                setError("Couldn't save — try again, or skip for now.");
            } finally {
                setSubmitting(false);
            }
        }

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={['70%']}
                enablePanDownToClose={false}
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <BottomSheetView style={styles.content}>
                    <Text style={styles.title}>How did that feel?</Text>
                    {book && <Text style={styles.subtitle}>{book.title}</Text>}

                    <View style={styles.section}>
                        <Text style={styles.label}>Thoughts</Text>
                        <BottomSheetTextInput
                            style={styles.textArea}
                            placeholder="Anything on your mind about the reading..."
                            placeholderTextColor={colors.textSecondary}
                            value={thoughts}
                            onChangeText={setThoughts}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {book && (
                        <View style={styles.section}>
                            <Text style={styles.label}>
                                Page reached{book.page_count ? ` (of ${book.page_count})` : ''}
                            </Text>
                            <BottomSheetTextInput
                                style={styles.pageInput}
                                placeholder="0"
                                placeholderTextColor={colors.textSecondary}
                                value={pageInput}
                                onChangeText={setPageInput}
                                keyboardType="number-pad"
                            />
                        </View>
                    )}

                    <SessionMoodPicker value={mood} onChange={setMood} />

                    {book && (
                        <TouchableOpacity
                            style={styles.finishedRow}
                            onPress={() => setFinished(!finished)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, finished && styles.checkboxChecked]} />
                            <Text style={styles.finishedLabel}>I finished this book</Text>
                        </TouchableOpacity>
                    )}

                    {error && <Text style={styles.error}>{error}</Text>}

                    <View style={styles.actions}>
                        <Button
                            title={submitting ? 'Saving...' : 'Save'}
                            onPress={handleSubmit}
                        />
                        <TouchableOpacity onPress={onSkip} disabled={submitting} style={styles.skipButton}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

ReflectionSheet.displayName = 'ReflectionSheet';

export default ReflectionSheet;

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    sheetBackground: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        shadowColor: '#263238',
        shadowOpacity: 0.18,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: -10 },
        elevation: 12,
    },
    handleIndicator: {
        backgroundColor: '#d8d2c4',
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: -12,
    },
    section: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    textArea: {
        backgroundColor: colors.backgroundElement,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
        minHeight: 72,
        textAlignVertical: 'top',
    },
    pageInput: {
        backgroundColor: colors.backgroundElement,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    finishedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: colors.accent,
    },
    checkboxChecked: {
        backgroundColor: colors.accent,
    },
    finishedLabel: {
        fontSize: 14,
        color: colors.text,
    },
    error: {
        fontSize: 13,
        color: '#e24b4a',
    },
    actions: {
        gap: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});
