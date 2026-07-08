import { colors } from '@/theme/colors';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabIcon from '@/components/ui/TabIcon';
import { Home, Package, MessageCircle, User } from 'lucide-react-native';
import { useI18n } from '@/i18n';
import { useThemeColors } from '@/theme/useThemeColors';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';

export default function ClientTabLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal, // vanz-teal
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : c.surfaceElevated,
          position: 'absolute',
          elevation: 0,
          borderTopWidth: 0,
          height: 60 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <BlurView
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            intensity={80}
            style={StyleSheet.absoluteFill}
            className="border-t border-line"
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} label={t('nav.home')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Package} label={t('nav.missions')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={MessageCircle} label={t('nav.messages')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} label={t('nav.profile')} focused={focused} />
          ),
        }}
      />
      {/* Hide detail routes from tabs */}
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
      <Tabs.Screen name="chat/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="review/[jobId]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="addresses" options={{ href: null }} />
      <Tabs.Screen name="become-driver" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="referral" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
    </Tabs>
  );
}
