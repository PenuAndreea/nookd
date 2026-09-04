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
    /** Equal-width row (the Books tab's filter) instead of content-sized chips that wrap (a book's own status). */
    equalWidth?: boolean;
}

/**
 * The reading-list status picker — three chips shared between "filter my
 * library by status" (Books tab) and "set this book's status" (book detail).
 */
export const BookStatusChips = ({ value, onChange, disabled, equalWidth }: BookStatusChipsProps) => {
    const styles = useStyles();
    const { t } = useTranslation();

    return (
        <View style={[styles.row, equalWidth ? styles.equalWidthRow : styles.wrapRow]}>
            {BOOK_STATUS_IDS.map((id) => (
                <Chip
                    key={id}
                    label={t(`books.statusOptions.${id}`)}
                    selected={value === id}
                    onPress={() => onChange(id)}
                    disabled={disabled}
                    style={equalWidth && styles.equalWidthChip}
                />
            ))}
        </View>
    );
};

const useStyles = () => StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    equalWidthRow: {
        marginBottom: Spacing.three,
    },
    wrapRow: {
        flexWrap: 'wrap',
    },
    equalWidthChip: {
        flex: 1,
    },
});
