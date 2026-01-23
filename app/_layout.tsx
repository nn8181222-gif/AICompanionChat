import { AlertProvider, AuthProvider } from '@/template';
import { CharacterProvider } from '@/contexts/CharacterContext';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <CharacterProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </CharacterProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
