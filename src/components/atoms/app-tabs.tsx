
import { BlurView } from 'expo-blur';
import { router, Stack } from 'expo-router';
import { BottomTabBar, BottomTabBarProps, Tabs } from 'expo-router/tabs';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { Colors } from '../../constants/theme';
import Button from './button';
import { Icon } from './icon';

type Route = {
  name: string;
  title: string;
  icon: Parameters<typeof SymbolView>[0]["name"];
  options?: Parameters<typeof Stack.Screen>[0]["options"];
}

const routes: Route[] = [
  {
    name: 'index',
    title: 'Home',
    icon: 'house',
  },
  {
    name: 'books',
    title: 'Books',
    icon: 'book.closed',
  },
]

function TabBarWithCreateButton(props: BottomTabBarProps) {
  return (
    <View>
      <BottomTabBar {...props} />
      <Button
        floating
        icon="plus"
        size="medium"
        // create-room is a root-level modal (sibling to the tabs group, see
        // app/(app)/_layout.tsx), not nested inside any one tab's stack —
        // so it overlays whatever tab/screen is currently showing, and
        // dismissing it (swipe or back) always returns there.
        onPress={() => router.push('/create-room')}
      />
    </View>
  );
}

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      tabBar={(props) => <TabBarWithCreateButton {...props} />}
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text,
        headerShown: false,
        popToTopOnBlur: true,
        tabBarBackground: () => (
          <BlurView tint="light" intensity={100} style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
        ),
      }}
    >
      {routes.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
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
