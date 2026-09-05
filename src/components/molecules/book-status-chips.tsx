import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { UserBookStatus } from '@/api/books';
import Chip from '@/components/atoms/chip';
import { Spacing } from '@/constants/theme';

export const BOOK_STATUS_IDS: UserBookStatus[] = ['want_to_read', 'currently_reading', 'finished'];

interface BookStatusChipsProps {
    value: UserBookStatus;
    onChange: (status: UserBookStatus) => void;
    disabled?: boolean;
}

/**
 * A book's own reading status, on the book detail screen. The Library's
 * filter row is LibraryFilterChips — it also carries an "All" option, which
 * is not a status a book can be in.
 */
export const BookStatusChips = ({ value, onChange, disabled }: BookStatusChipsProps) => {
    const styles = useStyles();
    const { t } = useTranslation();

    return (
        <View style={styles.row}>
            {BOOK_STATUS_IDS.map((id) => (
                <Chip
                    key={id}
                    label={t(`books.statusOptions.${id}`)}
                    selected={value === id}
                    onPress={() => onChange(id)}
                    disabled={disabled}
                />
            ))}
        </View>
    );
};

const useStyles = () => StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
});
