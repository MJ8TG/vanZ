import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function DriverProfileScreen() {
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
  const userName = session?.user?.user_metadata?.full_name || 'Transporteur';
  const initial = userName[0]?.toUpperCase() || 'T';

  return (
    <ScrollView className="flex-1 bg-vanz-iceblue">
      <View className="pt-16 pb-8 px-6 bg-vanz-navy items-center rounded-b-[40px]">
        <View className="w-24 h-24 bg-vanz-yellow rounded-full items-center justify-center mb-4 relative">
          <Text className="text-vanz-navy text-3xl font-bold">{initial}</Text>
          {/* Unverified Badge */}
          <View className="absolute bottom-0 right-0 bg-red-500 w-6 h-6 rounded-full items-center justify-center border-2 border-vanz-navy">
            <Text className="text-white text-xs font-bold">!</Text>
          </View>
        </View>
        <Text className="text-white text-2xl font-bold">{userName}</Text>
        <Text className="text-vanz-iceblue/70 mb-2">{userPhone}</Text>
        <View className="bg-red-500/20 px-3 py-1 rounded-full border border-red-500">
          <Text className="text-red-400 font-semibold text-sm">Compte non vérifié</Text>
        </View>
      </View>

      <View className="p-6 gap-4">
        <TouchableOpacity 
          onPress={() => router.push('/(driver)/verify')}
          className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between border-l-4 border-red-500"
        >
          <View>
            <Text className="text-vanz-navy text-lg font-semibold">Vérifier mon compte</Text>
            <Text className="text-vanz-navy/60 text-sm">Scanner CIN & permis</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between">
          <Text className="text-vanz-navy text-lg font-semibold">Véhicules</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between">
          <Text className="text-vanz-navy text-lg font-semibold">Paramètres du compte</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {
            useAuthStore.getState().setMode('client');
            router.replace('/(client)/');
          }}
          className="bg-vanz-teal/20 border border-vanz-teal p-4 rounded-xl items-center mt-4"
        >
          <Text className="text-vanz-navy font-bold text-lg">Passer en mode Client</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} className="mt-8 p-4 items-center">
          <Text className="text-red-500 font-bold text-lg">Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
