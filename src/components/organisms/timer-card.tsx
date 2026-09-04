import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "../atoms/icon";

const MAX_MEMBERS = 10;

function formatDuration(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function TimerCard({ elapsedSeconds, duration, memberCount, onPress }: { elapsedSeconds: number, duration: number | null, memberCount: number, onPress: () => void }) {
    // House rooms have no duration — they never end, so there is nothing to
    // count down to. Count up through the session instead.
    const isOpenEnded = duration == null
    const durationSeconds = (duration ?? 0) * 60
    const remainingSeconds = Math.max(durationSeconds - elapsedSeconds, 0)
    const progress = durationSeconds === 0 ? 0 : Math.min(elapsedSeconds / durationSeconds, 1)
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    return (
        <Pressable hitSlop={10} onPress={onPress} style={styles.timerCard}>
            <Text style={styles.timerValue}>
                {formatDuration(isOpenEnded ? elapsedSeconds : remainingSeconds)}
            </Text>
            <Text style={styles.timerLabel}>
                {isOpenEnded ? t('rooms.timer.reading') : t('rooms.timer.remaining')}
            </Text>
            {isOpenEnded ? (
                <View style={styles.openSpacer} />
            ) : (
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
            )}
            <View style={styles.timerFooterRow}>
                <Text style={styles.timerFooterText}>
                    {isOpenEnded ? t('rooms.timer.alwaysOpen') : t('rooms.timer.goal', { duration })}
                </Text>
                <View style={styles.timerFooterRight}>
                    <Icon name="person.2" color={colors.timerCardText} />
                    <Text style={styles.timerFooterText}>
                        {memberCount}/{MAX_MEMBERS}
                    </Text>
                </View>
            </View>
        </Pressable>
    )
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    timerCard: {
        position: 'absolute',
        left: '50%',
        top: '60%',
        transform: [{ translateX: -107 }, { translateY: -90 }],
        width: 214,
        backgroundColor: colors.timerCardBackground,
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 19,
        shadowColor: colors.sheetText,
        shadowOpacity: 0.16,
        shadowRadius: 44,
        shadowOffset: { width: 0, height: 18 },
        elevation: 8,
    },
    timerValue: { fontSize: 44, fontWeight: '700', color: colors.timerCardText, textAlign: 'center', letterSpacing: -1.5 },
    timerLabel: { fontSize: 15, fontWeight: '500', color: colors.timerCardText, textAlign: 'center', marginTop: 5 },
    progressTrack: { height: 7, borderRadius: 4, backgroundColor: colors.timerCardTrack, marginVertical: 16, overflow: 'hidden' },
    openSpacer: { height: 7, marginVertical: 16 },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.accent },
    timerFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timerFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    timerFooterText: { fontSize: 13, fontWeight: '600', color: colors.timerCardText },
})
