import BottomSheet from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import logo from '@/assets/images/logo.png';
import Avatar from '@/components/atoms/avatar';
import { Icon } from '@/components/atoms/icon';
import Typography from '@/components/atoms/typography';
import ProfileSheet from '@/components/organisms/profile-sheet';
import RoomList from '@/components/organisms/room-list';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import { useTheme } from '@/hooks/use-theme';

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Placeholder: shown to every user until there is a profiles table holding a
// real display name. Deriving it from the email local part reads badly
// ("Andreeapenu"), so this is hardcoded for now.
const DISPLAY_NAME = 'Mira';

// "…, 40 minutes in." — only once there is enough elapsed to be worth saying.
function timeInRoom(joinedAt?: string | null) {
  if (!joinedAt) return null;
  const minutes = Math.floor((Date.now() - Date.parse(joinedAt.replace(/(\.\d{3})\d+/, '$1'))) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return null;
  return minutes < 60
    ? `${minutes} minute${minutes === 1 ? '' : 's'} in`
    : `${Math.floor(minutes / 60)} hour${minutes < 120 ? '' : 's'} in`;
}

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const colors = useTheme();
  const styles = useStyles(colors);
  const userId = session?.user.id;

  const profileSheetRef = useRef<BottomSheet>(null);

  const { currentRoom } = useRooms();
  const elapsed = timeInRoom(
    currentRoom?.members?.find((member) => member.user_id === userId)?.joined_at
  );
  const subtitle = currentRoom
    ? `You left off in ${currentRoom.name ?? 'a room'}${elapsed ? `, ${elapsed}` : ''}.`
    : 'Find your quiet place to read.';

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
              accessibilityLabel="Open profile"
              style={({ pressed }) => pressed && styles.pressed}
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
          {greetingFor(new Date().getHours())}, {DISPLAY_NAME}
        </Typography>
        <Text style={styles.subtitle}>{subtitle}</Text>
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
    backgroundColor: '#3BB273',
    borderWidth: 2.5,
    // Matches the page, so the ring reads as a cut-out around the dot.
    borderColor: colors.background,
  },
  greeting: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.half,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.7 },
});
