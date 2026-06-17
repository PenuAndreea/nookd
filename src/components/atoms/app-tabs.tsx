
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
    name: 'rooms',
    title: 'Rooms',
    icon: 'person.3.fill',
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
        onPress={() => router.navigate('/rooms/new')}
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
            tabBarIcon: ({ color }) => (
              <Icon name={icon} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
