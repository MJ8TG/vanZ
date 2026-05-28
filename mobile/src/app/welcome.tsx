import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-vanz-navy items-center justify-between p-6 pt-20 pb-10">
      <View className="items-center mt-10">
        <Text className="text-vanz-teal text-4xl font-extrabold mb-4">VanZ</Text>
        <Text className="text-white text-center text-lg px-4">
          Le réseau de transporteurs et déménageurs de confiance en Tunisie.
        </Text>
      </View>

      <View className="w-full gap-4">
        <TouchableOpacity 
          onPress={() => router.push('/auth/phone')}
          className="w-full bg-vanz-teal p-5 rounded-2xl items-center shadow-lg active:opacity-90"
        >
          <Text className="text-white text-lg font-bold">Commencer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="w-full p-5 items-center"
        >
          <Text className="text-white/60 text-sm">Changer la langue (العربية)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
