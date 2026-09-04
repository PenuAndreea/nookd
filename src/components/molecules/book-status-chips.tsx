import { StyleSheet, View } from 'react-native';

import { UserBookStatus } from '@/api/books';
import Chip from '@/components/atoms/chip';
import { Spacing } from '@/constants/theme';

export const BOOK_STATUS_OPTIONS: { id: UserBookStatus; label: string }[] = [
    { id: 'want_to_read', label: 'Want to read' },
    { id: 'currently_reading', label: 'Currently reading' },
    { id: 'finished', label: 'Finished' },
];

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

    return (
        <View style={[styles.row, equalWidth ? styles.equalWidthRow : styles.wrapRow]}>
            {BOOK_STATUS_OPTIONS.map((option) => (
                <Chip
                    key={option.id}
                    label={option.label}
                    selected={value === option.id}
                    onPress={() => onChange(option.id)}
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
