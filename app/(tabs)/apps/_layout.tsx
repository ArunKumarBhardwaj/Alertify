import { Stack } from 'expo-router/stack';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppsLayout() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: 'bold' },
        headerLargeTitle: true,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Applications',
        }} 
      />
    </Stack>
  );
}
