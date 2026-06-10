
import { router, Stack } from 'expo-router';
import { BottomTabBar, BottomTabBarProps, Tabs } from 'expo-router/tabs';
import { SymbolView } from 'expo-symbols';
import { useColorScheme, View } from 'react-native';

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
    icon: 'apple.books.pages.fill',
  },
]

function TabBarWithCreateButton(props: BottomTabBarProps) {
  return (
    <View>
      <BottomTabBar {...props} />
      <Button
        floating
        title="+"
        size="large"
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
        headerShown: false
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
