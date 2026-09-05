import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import TextButton from '@/components/atoms/text-button';
import Typography from '@/components/atoms/typography';
import { EmptyState } from '@/components/molecules/empty-state';
import StatSection from '@/components/molecules/stat-section';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { StatsSession } from '@/api/stats';
import { parsePgTimestamp } from '@/lib/date';
import { formatShortDate } from '@/lib/stats-format';
import { useTheme } from '@/hooks/use-theme';

interface StatsJournalCardProps {
    /** Every fetched session; this card does its own filtering. */
    sessions: StatsSession[];
}

/** Enough to feel like a journal without turning the tab into one. */
const PREVIEW_COUNT = 3;

/**
 * The reader's own words, read back to them.
 *
 * Everything else on this tab is a number derived from their reading; this is
 * the one part that is theirs verbatim, so it is shown unabbreviated rather
 * than truncated to a tidy line.
 */
export default function StatsJournalCard({ sessions }: StatsJournalCardProps) {
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    const written = sessions.filter((session) => (session.thoughts ?? '').trim() !== '');
    const shown = expanded ? written : written.slice(0, PREVIEW_COUNT);

    return (
        <StatSection title={t('you.journal.sectionTitle')} subtitle={t('you.journal.subtitle')}>
            {written.length === 0 ? (
                <EmptyState
                    title={t('you.journal.emptyTitle')}
                    subtitle={t('you.journal.emptySubtitle')}
                />
            ) : (
                <>
                    <View style={styles.entries}>
                        {shown.map((session) => {
                            const ms = parsePgTimestamp(session.created_at);

                            return (
                                <View key={session.id} style={styles.entry}>
                                    <View style={styles.meta}>
                                        <Typography variant="captionBold" numberOfLines={1} style={styles.book}>
                                            {session.book?.title ?? session.room_name ?? ''}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {ms === null ? '' : formatShortDate(new Date(ms), t)}
                                        </Typography>
                                    </View>
                                    <Typography variant="subtitle">{session.thoughts}</Typography>
                                    {session.mood && (
                                        <Typography variant="caption" color="textSecondary">
                                            {t(`rooms.sessionMoods.${session.mood}`)}
                                        </Typography>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {written.length > PREVIEW_COUNT && (
                        <TextButton
                            title={expanded
                                ? t('you.journal.showFewer')
                                : t('you.journal.showAll', { count: written.length })}
                            variant="secondary"
                            onPress={() => setExpanded((open) => !open)}
                        />
                    )}
                </>
            )}
        </StatSection>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    entries: { gap: Spacing.two },
    entry: {
        gap: Spacing.one,
        padding: Spacing.three,
        borderRadius: BorderRadius.large,
        backgroundColor: colors.backgroundElement,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.two,
    },
    book: { flexShrink: 1 },
});
