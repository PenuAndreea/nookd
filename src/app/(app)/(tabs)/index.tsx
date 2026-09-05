import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import logo from '@/assets/images/logo.png';
import Avatar from '@/components/atoms/avatar';
import Typography from '@/components/atoms/typography';
import RoomList from '@/components/organisms/room-list';
import { createCommonStyles } from '@/constants/common-styles';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import { useTheme } from '@/hooks/use-theme';
import { parsePgTimestamp } from '@/lib/date';

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

function greetingFor(hour: number, t: (key: string) => string) {
  if (hour < 12) return t('home.greetingMorning');
  if (hour < 18) return t('home.greetingAfternoon');
  return t('home.greetingEvening');
}

// Placeholder: shown to every user until there is a profiles table holding a
// real display name. Deriving it from the email local part reads badly
// ("Andreeapenu"), so this is hardcoded for now.
const DISPLAY_NAME = 'Mira';

// "…, 40 minutes in." — only once there is enough elapsed to be worth saying.
function timeInRoom(joinedAt: string | null | undefined, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!joinedAt) return null;
  const joinedAtMs = parsePgTimestamp(joinedAt);
  if (joinedAtMs === null) return null;

  const minutes = Math.floor((Date.now() - joinedAtMs) / 60000);
  if (minutes < 1) return null;
  return minutes < 60
    ? t('home.minutesIn', { count: minutes })
    : t('home.hoursIn', { count: Math.floor(minutes / 60) });
}

export default function RoomsScreen() {
  const { session } = useAuth();
  const colors = useTheme();
  const styles = useStyles(colors);
  const common = createCommonStyles();
  const userId = session?.user.id;
  const { t } = useTranslation();

  const { currentRoom } = useRooms();
  const elapsed = timeInRoom(
    currentRoom?.members?.find((member) => member.user_id === userId)?.joined_at,
    t
  );
  const subtitle = currentRoom
    ? (elapsed
      ? t('home.subtitleReturnTo', { roomName: currentRoom.name ?? t('home.fallbackRoomName'), elapsed })
      : t('home.subtitleReturnToNoElapsed', { roomName: currentRoom.name ?? t('home.fallbackRoomName') }))
    : t('home.subtitleDefault');

  return (
    <View style={styles.center}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} />
          <Typography variant="sheetTitle">Readfolk</Typography>
        </View>
      </View>
      <View style={styles.greeting}>
        <View>
          <Typography variant="title1">
            {greetingFor(new Date().getHours(), t)}, {DISPLAY_NAME}
          </Typography>
          <Typography variant="subtitle" color="textSecondary">{subtitle}</Typography>
        </View>
        <View style={styles.actions}>
          {userId && (
            <Pressable
              onPress={() => router.navigate('/you')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('profile.title')}
              style={({ pressed }) => pressed && common.pressed}
            >
              <View>
                <Avatar id={userId} size="xxlarge" />
                <View style={styles.presenceDot} />
              </View>
            </Pressable>
          )}
        </View>
      </View>
      <RoomList />
    </View>
  );
}

const useStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  center: { flex: 1, top: Spacing.six },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.three,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.medium,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  presenceDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 8,
    backgroundColor: colors.presenceOnline,
    borderWidth: 2.5,
    // Matches the page, so the ring reads as a cut-out around the dot.
    borderColor: colors.background,
  },
  greeting: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.half,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
});
