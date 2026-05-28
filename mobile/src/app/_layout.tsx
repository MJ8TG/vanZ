import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Platform, View, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, setSession, mode } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'welcome';

    if (!session) {
      if (!inAuthGroup) {
        // Redirect to welcome if not logged in and not in auth screens
        router.replace('/welcome');
      }
    } else {
      if (inAuthGroup || segments[0] === '(client)' || segments[0] === '(driver)' || !segments[0]) {
        // If logged in but trying to access auth screens or app root
        if (!mode && segments[0] !== 'mode-selector') {
          router.replace('/mode-selector');
        } else if (mode === 'client' && segments[0] !== '(client)') {
          router.replace('/(client)/');
        } else if (mode === 'driver' && segments[0] !== '(driver)') {
          router.replace('/(driver)/');
        }
      }
    }
  }, [session, mode, segments, isReady]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-vanz-iceblue">
        <ActivityIndicator size="large" color="#2BBFDF" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
      }
    }
    requestPermissions();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="mode-selector" />
        {/* Client & Driver Mode Stacks */}
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="auth" />
      </Stack>
    </AuthProvider>
  );
}
