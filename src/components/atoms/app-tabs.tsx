
import { BlurView } from 'expo-blur';
import { Stack } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { SymbolView } from 'expo-symbols';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from './icon';

type Route = {
  name: string;
  titleKey: string;
  icon: Parameters<typeof SymbolView>[0]["name"];
  options?: Parameters<typeof Stack.Screen>[0]["options"];
}

const routes: Route[] = [
  {
    name: 'index',
    titleKey: 'tabs.rooms',
    icon: 'house',
  },
  {
    name: 'books',
    titleKey: 'tabs.library',
    icon: 'books.vertical',
  },
  {
    name: 'explore',
    titleKey: 'tabs.explore',
    icon: 'sparkles',
  },
  {
    name: 'you',
    titleKey: 'tabs.you',
    icon: 'person',
  },
]

export default function AppTabs() {
  const colors = useTheme();
  // Only needed for the blur tint below — colors themselves come from
  // useTheme(), which already normalizes the 'unspecified' scheme to light.
  const isDark = useColorScheme() === 'dark';
  const { t } = useTranslation();

  return (
    // Creating a room is not a global action: from Library and Explore the
    // useful create is "a room with *this* book", so each tab offers its own
    // entry point and the Rooms tab owns the blank one. Hence no custom tabBar.
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text,
        headerShown: false,
        popToTopOnBlur: true,
        tabBarBackground: () => (
          <BlurView tint={isDark ? 'dark' : 'light'} intensity={100} style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
        ),
      }}
    >
      {routes.map(({ name, titleKey, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(titleKey),
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Icon name={icon} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
