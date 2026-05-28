import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function ClientTabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#2BBFDF', // vanz-teal
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
        }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Accueil',
          // Icon placeholder
          tabBarIcon: ({ color }) => (
            <View className="w-6 h-6 rounded bg-gray-200 items-center justify-center">
              <Text style={{color}} className="font-bold text-xs">H</Text>
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="missions" 
        options={{ 
          title: 'Mes Missions',
          tabBarIcon: ({ color }) => (
            <View className="w-6 h-6 rounded bg-gray-200 items-center justify-center">
              <Text style={{color}} className="font-bold text-xs">M</Text>
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <View className="w-6 h-6 rounded bg-gray-200 items-center justify-center">
              <Text style={{color}} className="font-bold text-xs">P</Text>
            </View>
          ),
        }} 
      />
    </Tabs>
  );
}
