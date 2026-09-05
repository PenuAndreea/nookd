import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { UserBookStatus } from '@/api/books';
import Chip from '@/components/atoms/chip';
import { BOOK_STATUS_IDS } from '@/components/molecules/book-status-chips';
import { Spacing } from '@/constants/theme';

/** "all" is a filter-only pseudo-status; it is never written to a book. */
export type LibraryFilter = UserBookStatus | 'all';

interface LibraryFilterChipsProps {
    value: LibraryFilter;
    onChange: (filter: LibraryFilter) => void;
}

/**
 * The Library list's filter row. Deliberately separate from BookStatusChips:
 * that one *sets* a book's own status and can only ever be one of the three
 * real statuses, while this one also carries "All" and only narrows a list.
 */
export const LibraryFilterChips = ({ value, onChange }: LibraryFilterChipsProps) => {
    const { t } = useTranslation();

    const filters: { id: LibraryFilter; label: string }[] = [
        { id: 'all', label: t('books.filterAll') },
        ...BOOK_STATUS_IDS.map((id) => ({ id, label: t(`books.statusOptions.${id}`) })),
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
        >
            {filters.map(({ id, label }) => (
                <Chip
                    key={id}
                    label={label}
                    selected={value === id}
                    onPress={() => onChange(id)}
                    onWhite
                />
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    row: {
        gap: Spacing.two,
        paddingRight: Spacing.three,
    },
});
