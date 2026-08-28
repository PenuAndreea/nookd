import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider } from "expo-router";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useAuth } from "../../contexts/auth-context";
import { RoomsProvider } from "../../contexts/rooms-context";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RoomsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            {/* A room is pushed on this root stack rather than inside the
                rooms tab: it is reachable from both the Home and Rooms tabs,
                and a screen pushed into one tab's stack from another tab is
                left behind there when you switch back, so rooms would pile up
                and "back" would land on a previously visited room. */}
            <Stack.Screen name="room/[id]" />
            <Stack.Screen name="create-room" options={{ presentation: 'formSheet' }} />
          </Stack>
        </RoomsProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
