import { useRemainingTime } from '@/hooks/use-remaining-time';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CIRCUM_FERENCE = 2 * Math.PI * 68;

export default function SessionTimer({
    startedAt,
    durationMinutes,
}: {
    startedAt: string;
    durationMinutes: number;
}) {
    const { remainingSeconds, isExpired } = useRemainingTime(startedAt, durationMinutes);

    const totalSeconds = durationMinutes * 60;
    const ratio = remainingSeconds / totalSeconds;
    const elapsed = totalSeconds - remainingSeconds;

    const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
    const ss = String(remainingSeconds % 60).padStart(2, '0');
    const elapsedFmt = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

    const color = ratio > 0.5 ? '#1D9E75' : ratio > 0.25 ? '#EF9F27' : '#eea8a8';
    const strokeOffset = CIRCUM_FERENCE * (1 - ratio);

    const badgeLabel = isExpired ? 'expired' : ratio < 0.25 ? 'ending soon' : 'active';


    const getBadgeStyle = (ratio: number, isExpired: boolean) => {
        if (isExpired || ratio === 0) {
            return { color: '#E24B4A', backgroundColor: '#FCEBEB' };  // red
        }
        if (ratio < 0.25) {
            return { color: '#E24B4A', backgroundColor: '#FCEBEB' };  // red — ending soon
        }
        if (ratio < 0.5) {
            return { color: '#BA7517', backgroundColor: '#FAEEDA' };  // amber
        }
        return { color: '#0F6E56', backgroundColor: '#E1F5EE' };    // green — active
    };

    return (
        <View style={styles.card}>
            <Text style={styles.label}>SESSION TIMER</Text>
            <View style={[styles.badge, getBadgeStyle(ratio, isExpired)]}>
                <Text style={{ color: getBadgeStyle(ratio, isExpired).color }}>{badgeLabel}</Text>
            </View>

            <View style={styles.ringWrap}>
                <Svg width={160} height={160} viewBox="0 0 160 160">
                    <Circle cx={80} cy={80} r={68} fill="none" stroke="#e0e0e0" strokeWidth={8} />
                    <Circle
                        cx={80}
                        cy={80}
                        r={68}
                        fill="none"
                        stroke={color}
                        strokeWidth={8}
                        strokeLinecap="round"
                        strokeDasharray={CIRCUM_FERENCE}
                        strokeDashoffset={strokeOffset}
                    />
                </Svg>
                <View style={styles.ringCenter}>
                    <Text style={styles.timeDisplay}>{mm}:{ss}</Text>
                    <Text style={styles.timeSub}>{isExpired ? 'expired' : 'remaining'}</Text>
                </View>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.meta}>elapsed: {elapsedFmt}</Text>
                <Text style={styles.meta}>total: {durationMinutes} min</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 16,
        backgroundColor: '#fff',
        maxWidth: 320
    },
    label: {
        fontSize: 12,
        color: '#888',
        letterSpacing: 1,
        marginBottom: 8
    },
    badge: {
        fontSize: 12,
        marginBottom: 16,
        padding: 6,
        borderRadius: 12,
        fontWeight: '500'
    },
    ringWrap: {
        width: 160,
        height: 160,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    ringCenter: {
        position: 'absolute',
        alignItems: 'center'
    },
    timeDisplay: {
        fontSize: 28,
        fontWeight: '500',
        color: '#111'
    },
    timeSub: {
        fontSize: 12,
        color: '#888',
        marginTop: 4
    },
    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 99,
        overflow: 'hidden',
        marginBottom: 12
    },
    progressFill: {
        height: '100%',
        borderRadius: 99
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    meta: {
        fontSize: 12,
        color: '#888'
    },
});