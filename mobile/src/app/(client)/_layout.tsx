import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import TabIcon from '@/components/ui/TabIcon';
import { useI18n } from '@/i18n';

export default function ClientTabLayout() {
  const { t } = useI18n();
  
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#38B6FF', // vanz-teal
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#ffffff',
          position: 'absolute',
          elevation: 0,
          borderTopWidth: 0,
          height: 88,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
        },
        tabBarBackground: () => (
          <BlurView 
            tint="light" 
            intensity={80} 
            style={StyleSheet.absoluteFill} 
            className="border-t border-white/50"
          />
        ),
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: '', // Custom label inside TabIcon
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="🏠" label={t('client.home') || 'Accueil'} focused={focused} color={color as string} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="missions" 
        options={{ 
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="📋" label={t('client.missions')} focused={focused} color={color as string} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="👤" label={t('client.profile')} focused={focused} color={color as string} />
          ),
        }} 
      />
      {/* Hide the job detail route from tabs */}
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
    </Tabs>
  );
}
