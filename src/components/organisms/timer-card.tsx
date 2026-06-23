import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "../atoms/icon";

export default function TimerCard({ remaining, duration, memberCount, onPress }: { remaining: number, duration: number, memberCount: number, onPress: () => void }) {
    const progress = duration / remaining
    const colors = useTheme();

    return (
        <Pressable hitSlop={10} onPress={onPress} style={styles.timerCard}>
            <Text style={styles.timerValue}>
                {remaining === 0 ? '00:00' : remaining}
            </Text>
            <Text style={styles.timerLabel}>
                Remaining
            </Text>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <View style={styles.timerFooterRow}>
                <Text style={styles.timerFooterText}>
                    Goal: {duration} min
                </Text>
                <View style={styles.timerFooterRight}>
                    <Icon name="person.2" color={colors.text} />
                    <Text style={styles.timerFooterText}>
                        {memberCount}/{10}
                    </Text>
                </View>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    timerCard: {
        position: 'absolute',
        left: '50%',
        top: '70%',
        transform: [{ translateX: -107 }, { translateY: -90 }],
        width: 214,
        backgroundColor: 'rgba(255,253,250,0.97)',
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 19,
        shadowColor: '#263238',
        shadowOpacity: 0.16,
        shadowRadius: 44,
        shadowOffset: { width: 0, height: 18 },
        elevation: 8,
    },
    timerValue: { fontSize: 44, fontWeight: '700', color: '#1A1D2E', textAlign: 'center', letterSpacing: -1.5 },
    timerLabel: { fontSize: 15, fontWeight: '500', color: '#1A1D2E', textAlign: 'center', marginTop: 5 },
    progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#EDE6D8', marginVertical: 16, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#FFC83D' },
    timerFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timerFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    timerFooterText: { fontSize: 13, fontWeight: '600', color: '#1A1D2E' },

})