import { Stack } from 'expo-router';

type Route = {
  name: string;
  options?: Parameters<typeof Stack.Screen>[0]["options"];
}

const route: Route[] = [{
  name: 'index',
  options: {
    headerShown: false,
  }
},
{
  name: '[id]',
  options: {
    title: 'Room details',
    headerBackVisible: true,
    headerBackButtonDisplayMode: 'minimal'
  }
},
{
  name: 'new',
  options: {
    title: 'Create Room',
    headerBackVisible: true,
    headerBackButtonDisplayMode: 'minimal'
  }
}]

export default function RoomsLayout() {
  return <Stack>
    {route.map(({ name, options }) => (
      <Stack.Screen
        key={name}
        name={name}
        options={options}
      />
    ))}
  </Stack>
}