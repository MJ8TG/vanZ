import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function ClientProfileScreen() {
  const router = useRouter();
  const { session, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          logout();
          router.replace('/welcome');
        },
      },
    ]);
  };

  const userPhone = session?.user?.phone || '+216 XX XXX XXX';
  const userName = session?.user?.user_metadata?.full_name || 'Client';
  const initial = userName[0]?.toUpperCase() || 'C';

  return (
    <ScrollView className="flex-1 bg-vanz-iceblue">
      <View className="pt-16 pb-8 px-6 bg-vanz-navy items-center rounded-b-[40px]">
        <View className="w-24 h-24 bg-vanz-teal rounded-full items-center justify-center mb-4">
          <Text className="text-white text-3xl font-bold">{initial}</Text>
        </View>
        <Text className="text-white text-2xl font-bold">{userName}</Text>
        <Text className="text-vanz-iceblue/70">{userPhone}</Text>
      </View>

      <View className="p-6 gap-4">
        <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between">
          <Text className="text-vanz-navy text-lg font-semibold">Paramètres du compte</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between">
          <Text className="text-vanz-navy text-lg font-semibold">Langue (Français)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {
            useAuthStore.getState().setMode('driver');
            router.replace('/(driver)/');
          }}
          className="bg-vanz-yellow/20 border border-vanz-yellow p-4 rounded-xl items-center mt-4"
        >
          <Text className="text-vanz-navy font-bold text-lg">Passer en mode Transporteur</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} className="mt-8 p-4 items-center">
          <Text className="text-red-500 font-bold text-lg">Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
