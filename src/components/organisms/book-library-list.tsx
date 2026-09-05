import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet } from 'react-native';

import { UserBookWithBook } from '@/api/books';
import Button from '@/components/atoms/button';
import Typography from '@/components/atoms/typography';
import { EmptyState } from '@/components/molecules/empty-state';
import { ErrorState } from '@/components/molecules/error-state';
import BookItem from '@/components/organisms/book-item';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useContinueReading } from '@/hooks/use-continue-reading';

interface BookLibraryListProps {
    currentlyReading: UserBookWithBook[];
    otherBooks: UserBookWithBook[];
    loadingList: boolean;
    listError: boolean;
    onRetry: () => void;
}

/**
 * The Library tab's default view: everything the reader owns, with the books
 * they're part-way through pulled into their own section on top so the
 * "Continue" action is the first thing on the screen.
 */
export default function BookLibraryList({
    currentlyReading,
    otherBooks,
    loadingList,
    listError,
    onRetry,
}: BookLibraryListProps) {
    const { t } = useTranslation();
    const continueReading = useContinueReading();

    const sections = [
        { key: 'currently_reading', title: t('books.continueReadingSection'), data: currentlyReading },
        { key: 'library', title: t('books.myLibrary'), data: otherBooks },
        // An empty section still renders its header, which reads as a broken
        // shelf — the empty state below covers the nothing-at-all case.
    ].filter((section) => section.data.length > 0);

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section }) => (
                <Typography variant="sectionLabel" color="textSecondary" style={styles.sectionLabel}>
                    {section.title}
                </Typography>
            )}
            ListEmptyComponent={loadingList ? null : listError ? (
                <ErrorState
                    title={t('books.listErrorTitle')}
                    subtitle={t('books.listErrorSubtitle')}
                    onRetry={onRetry}
                />
            ) : (
                <EmptyState title={t('books.emptyLibraryTitle')} subtitle={t('books.emptyLibrarySubtitle')} />
            )}
            renderItem={({ item, section }) => (
                <BookItem
                    userBook={item}
                    action={section.key === 'currently_reading' ? (
                        <Button
                            size="small"
                            title={t('books.continueReading')}
                            accessibilityLabel={t('books.continueReadingAccessibility', { title: item.book.title })}
                            onPress={() => continueReading(item.book)}
                        />
                    ) : undefined}
                />
            )}
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: BottomTabInset + Spacing.four,
    },
    sectionLabel: {
        marginBottom: Spacing.two,
    },
});
