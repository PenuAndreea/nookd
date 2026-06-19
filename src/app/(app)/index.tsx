import { Button, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../contexts/auth-context';

export default function HomeScreen() {
  const { session, signOut } = useAuth();

  return (
    <View style={styles.center}>
      <Text style={styles.welcome}>Signed in as {session?.user.email}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  welcome: { fontSize: 18, marginBottom: 12 },
});
