import { Tabs } from 'expo-router/tabs';
import { SymbolView } from 'expo-symbols';
import { useColorScheme } from 'react-native';

import { Colors, FontWeights } from '../../constants/theme';
import { Icon } from './icon';
import Logo from './logo';

type Route = {
  name: string;
  title: string;
  icon: Parameters<typeof SymbolView>[0]["name"];
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

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: FontWeights.semibold },
        headerLeft: () => <Logo />,
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
