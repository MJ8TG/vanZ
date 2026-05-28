import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function DriverTabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#F5C800', // vanz-yellow
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#0B1021', // Navy background for driver mode tab bar
          borderTopColor: '#1e293b',
        }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Missions',
          tabBarIcon: ({ color }) => (
            <View className="w-6 h-6 rounded bg-gray-800 items-center justify-center">
              <Text style={{color}} className="font-bold text-xs">M</Text>
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="trips" 
        options={{ 
          title: 'Trajets',
          tabBarIcon: ({ color }) => (
            <View className="w-6 h-6 rounded bg-gray-800 items-center justify-center">
              <Text style={{color}} className="font-bold text-xs">T</Text>
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="wallet" 
        options={{ 
          title: 'Gains',
          tabBarIcon: ({ color }) => (
            <View className="w-6 h-6 rounded bg-gray-800 items-center justify-center">
              <Text style={{color}} className="font-bold text-xs">€</Text>
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <View className="w-6 h-6 rounded bg-gray-800 items-center justify-center">
              <Text style={{color}} className="font-bold text-xs">P</Text>
            </View>
          ),
        }} 
      />
    </Tabs>
  );
}
