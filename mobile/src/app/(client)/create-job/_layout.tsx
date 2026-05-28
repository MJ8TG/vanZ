import { Stack } from 'expo-router';

export default function CreateJobLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: true, 
      headerTintColor: '#0B1021',
      headerStyle: { backgroundColor: '#F0F6FA' },
      headerShadowVisible: false,
    }}>
      <Stack.Screen name="index" options={{ title: 'Étape 1: Trajet' }} />
      <Stack.Screen name="step2" options={{ title: 'Étape 2: Détails' }} />
      <Stack.Screen name="step3" options={{ title: 'Étape 3: Budget' }} />
      <Stack.Screen name="step4" options={{ title: 'Confirmation' }} />
    </Stack>
  );
}
