import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Typography from '@/components/atoms/typography';
import BookRow from '@/components/molecules/book-row';
import { EmptyState } from '@/components/molecules/empty-state';
import StatSection from '@/components/molecules/stat-section';
import StatTile from '@/components/molecules/stat-tile';
import { Spacing } from '@/constants/theme';
import type { ReadingSummary } from '@/lib/stats';
import { formatMinutes } from '@/lib/stats-format';

interface StatsBooksCardProps {
    summary: ReadingSummary;
}

/** Only the handful worth reading; the rest is a long tail of one-offs. */
const TOP_BOOKS = 5;

export default function StatsBooksCard({ summary }: StatsBooksCardProps) {
    const styles = useStyles();
    const { t } = useTranslation();

    return (
        <StatSection title={t('you.books.sectionTitle')}>
            <View style={styles.tiles}>
                <StatTile
                    label={t('you.books.pagesLabel')}
                    value={String(summary.pagesRead)}
                    caption={t('you.books.pagesCaption')}
                />
                <StatTile label={t('you.books.booksLabel')} value={String(summary.booksReadCount)} />
            </View>

            {summary.books.length === 0 ? (
                <EmptyState
                    title={t('you.books.emptyTitle')}
                    subtitle={t('you.books.emptySubtitle')}
                />
            ) : (
                <>
                    <Typography variant="sectionLabel" color="textSecondary">
                        {t('you.books.topBooksTitle')}
                    </Typography>
                    <View style={styles.books}>
                        {summary.books.slice(0, TOP_BOOKS).map((stat) => (
                            <BookRow
                                key={stat.book.id}
                                surface
                                book={stat.book}
                                belowInfo={
                                    <Typography variant="caption" color="sheetTextSecondary">
                                        {t('you.books.bookMeta', {
                                            time: formatMinutes(stat.minutes, t),
                                            count: stat.sessions,
                                        })}
                                    </Typography>
                                }
                            />
                        ))}
                    </View>
                </>
            )}

            {summary.unattributedMinutes > 0 && (
                // Stated rather than hidden: skipping the reading picker is one
                // tap, so per-book totals can be a fraction of the real total.
                // Silently presenting them as the whole picture would be the
                // one genuinely misleading thing this screen could do.
                <Typography variant="caption" color="textSecondary">
                    {t('you.books.unattributed', {
                        time: formatMinutes(summary.unattributedMinutes, t),
                    })}
                </Typography>
            )}
        </StatSection>
    );
}

const useStyles = () => StyleSheet.create({
    tiles: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    books: { gap: Spacing.two },
});
