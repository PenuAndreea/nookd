import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppTabs from "../components/atoms/app-tabs";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppTabs />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
