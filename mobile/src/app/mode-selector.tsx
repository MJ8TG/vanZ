import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export default function ModeSelectorScreen() {
  const router = useRouter();
  const { setMode } = useAuthStore();

  const handleSelectMode = (mode: 'client' | 'driver') => {
    setMode(mode);
    // The AuthProvider in _layout.tsx will automatically redirect, but we can also push manually if needed.
    if (mode === 'client') router.replace('/(client)/');
    else router.replace('/(driver)/');
  };

  return (
    <View className="flex-1 bg-vanz-navy items-center justify-center p-6">
      <View className="mb-10 items-center">
        <Text className="text-vanz-iceblue text-3xl font-bold mb-2">Bienvenue sur VanZ</Text>
        <Text className="text-vanz-iceblue/80 text-center text-lg">
          Choisissez comment vous souhaitez utiliser l'application.
        </Text>
      </View>

      <View className="w-full gap-6">
        <TouchableOpacity 
          onPress={() => handleSelectMode('client')}
          className="w-full bg-vanz-teal p-6 rounded-2xl items-center justify-center shadow-lg active:opacity-90"
        >
          <Text className="text-white text-xl font-bold">Je cherche un transporteur</Text>
          <Text className="text-white/90 text-sm mt-2 text-center">
            Pour expédier des colis, déménager ou transporter des marchandises
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handleSelectMode('driver')}
          className="w-full bg-vanz-yellow p-6 rounded-2xl items-center justify-center shadow-lg active:opacity-90"
        >
          <Text className="text-vanz-navy text-xl font-bold">Je suis un transporteur</Text>
          <Text className="text-vanz-navy/80 text-sm mt-2 text-center">
            Pour trouver des missions et rentabiliser vos trajets
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
