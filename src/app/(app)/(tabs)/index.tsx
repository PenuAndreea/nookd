import { StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/atoms/avatar';
import Button from '@/components/atoms/button';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth-context';
import RoomList from '@/components/organisms/room-list';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const colors = useTheme();
  const styles = useStyles(colors);
  const name = session?.user.email?.split('@')[0];

  return (
    <View style={styles.center}>
      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          {session?.user.id && <Avatar id={session.user.id} size="large" />}
          <Text style={styles.welcome}>Hello, {name}</Text>
        </View>
        <Button title="Sign Out" size="small" onPress={signOut} />
      </View>
      <RoomList />
    </View>
  );
}

const useStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  center: { flex: 1, top: Spacing.six, },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    padding: Spacing.three,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.background,
    borderRadius: BorderRadius.medium,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  welcome: { fontSize: 16, fontWeight: '600', color: colors.text },
});
