import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetTextInput,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';


import Button from '@/components/atoms/button';
import Checkbox from '@/components/atoms/checkbox';
import TextButton from '@/components/atoms/text-button';
import Typography, { TypographyStyles } from '@/components/atoms/typography';
import { SessionMoodPicker } from '@/components/molecules/picker';
import { useTheme } from '@/hooks/use-theme';

export interface ReflectionData {
    thoughts: string;
    pageReached: number | null;
    mood: string | null;
    finished: boolean;
}

interface ReflectionSheetProps {
    /**
     * Only what the sheet actually shows. Narrower than a full `books` row so
     * a caller holding a trimmed projection — the You tab fetches only the
     * columns it needs — can pass it straight in.
     */
    book: { title: string; page_count: number | null } | null;
    initialPage?: number | null;
    onSubmit: (data: ReflectionData) => Promise<void>;
    onSkip: () => void;
}

const ReflectionSheet = forwardRef<BottomSheet, ReflectionSheetProps>(
    ({ book, initialPage, onSubmit, onSkip }, ref) => {
        const colors = useTheme();
        const styles = createStyles(colors);
        const { t } = useTranslation();

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
                setError(t('rooms.reflection.saveError'));
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
                    <Typography variant="sheetTitle">{t('rooms.reflection.title')}</Typography>
                    {book && <Typography color="textSecondary" style={styles.subtitle}>{book.title}</Typography>}

                    <View style={styles.section}>
                        <Typography variant="sectionLabel" color="textSecondary">{t('rooms.reflection.thoughtsLabel')}</Typography>
                        <BottomSheetTextInput
                            style={styles.textArea}
                            placeholder={t('rooms.reflection.thoughtsPlaceholder')}
                            placeholderTextColor={colors.textSecondary}
                            value={thoughts}
                            onChangeText={setThoughts}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {book && (
                        <View style={styles.section}>
                            <Typography variant="sectionLabel" color="textSecondary">
                                {book.page_count
                                    ? t('rooms.reflection.pageReachedLabelWithTotal', { total: book.page_count })
                                    : t('rooms.reflection.pageReachedLabel')}
                            </Typography>
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
                        <Checkbox
                            label={t('rooms.reflection.finishedBook')}
                            checked={finished}
                            onPress={() => setFinished(!finished)}
                        />
                    )}

                    {error && <Typography variant="caption" color="error">{error}</Typography>}

                    <View style={styles.actions}>
                        <Button
                            title={submitting ? t('common.saving') : t('common.save')}
                            onPress={handleSubmit}
                        />
                        <TextButton
                            title={t('rooms.reflection.skip')}
                            variant="secondary"
                            onPress={onSkip}
                            disabled={submitting}
                            style={styles.skipText}
                        />
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
        backgroundColor: colors.white,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        shadowColor: colors.sheetText,
        shadowOpacity: 0.18,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: -10 },
        elevation: 12,
    },
    handleIndicator: {
        backgroundColor: colors.sheetHandle,
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 16,
    },
    subtitle: {
        marginTop: -12,
    },
    section: {
        gap: 6,
    },
    textArea: {
        ...TypographyStyles.subtitle,
        backgroundColor: colors.backgroundElement,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: colors.text,
        minHeight: 72,
        textAlignVertical: 'top',
    },
    pageInput: {
        ...TypographyStyles.subtitle,
        backgroundColor: colors.backgroundElement,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: colors.text,
    },
    actions: {
        gap: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    skipText: {
        ...TypographyStyles.bodyBold,
        color: colors.textSecondary,
    },
});
