import BottomSheet from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import logo from '@/assets/images/logo.png';
import Avatar from '@/components/atoms/avatar';
import { Icon } from '@/components/atoms/icon';
import Typography from '@/components/atoms/typography';
import ProfileSheet from '@/components/organisms/profile-sheet';
import RoomList from '@/components/organisms/room-list';
import { createCommonStyles } from '@/constants/common-styles';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import { useTheme } from '@/hooks/use-theme';

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
  const minutes = Math.floor((Date.now() - Date.parse(joinedAt.replace(/(\.\d{3})\d+/, '$1'))) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return null;
  return minutes < 60
    ? t('home.minutesIn', { count: minutes })
    : t('home.hoursIn', { count: Math.floor(minutes / 60) });
}

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const colors = useTheme();
  const styles = useStyles(colors);
  const common = createCommonStyles();
  const userId = session?.user.id;
  const { t } = useTranslation();

  const profileSheetRef = useRef<BottomSheet>(null);

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

  async function handleSignOut() {
    profileSheetRef.current?.close();
    await signOut();
  }

  return (
    <View style={styles.center}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} />
          <Typography variant="h1">Readfolk</Typography>
        </View>

        <View style={styles.actions}>
          {userId && (
            <Pressable
              onPress={() => profileSheetRef.current?.snapToIndex(0)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('home.openProfile')}
              style={({ pressed }) => pressed && common.pressed}
            >
              <View>
                <Avatar id={userId} size="xlarge" />
                <View style={styles.presenceDot} />
              </View>
            </Pressable>
          )}
          <Icon name="bell" color={colors.text} />
        </View>
      </View>

      <View style={styles.greeting}>
        <Typography variant="h1">
          {greetingFor(new Date().getHours(), t)}, {DISPLAY_NAME}
        </Typography>
        <Typography variant="subtitle" color="textSecondary">{subtitle}</Typography>
      </View>

      <RoomList />

      {userId && (
        <ProfileSheet
          ref={profileSheetRef}
          userId={userId}
          email={session?.user.email}
          onSignOut={handleSignOut}
        />
      )}
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.presenceOnline,
    borderWidth: 2.5,
    // Matches the page, so the ring reads as a cut-out around the dot.
    borderColor: colors.background,
  },
  greeting: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.half,
  },
});
