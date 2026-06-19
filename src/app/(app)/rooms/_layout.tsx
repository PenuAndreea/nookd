import { Stack } from 'expo-router';

type Route = {
  name: string;
  options?: Parameters<typeof Stack.Screen>[0]["options"];
}

const route: Route[] = [{ name: 'index' }, { name: '[id]' }, {
  name: 'new', options: {
    presentation: 'formSheet',
  }
}]

export default function RoomsLayout() {
  return <Stack screenOptions={{ headerShown: false }}>
    {route.map(({ name, options }) => (
      <Stack.Screen
        key={name}
        name={name}
        options={options}
      />
    ))}
  </Stack>
}