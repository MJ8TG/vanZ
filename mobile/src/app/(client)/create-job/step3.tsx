import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useJobStore } from '@/store/useJobStore';

export default function CreateJobStep3() {
  const router = useRouter();
  const { draft, updateDraft } = useJobStore();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-vanz-iceblue">
      <ScrollView className="flex-1 p-6">
        <Text className="text-vanz-navy text-2xl font-bold mb-2">Votre budget estimé</Text>
        <Text className="text-vanz-navy/70 mb-8">
          Indiquez combien vous êtes prêt à payer. Les transporteurs pourront vous faire des offres autour de ce prix.
        </Text>

        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center">
          <View className="flex-row items-end">
            <TextInput 
              className="text-vanz-navy text-5xl font-extrabold min-w-[100px] text-center"
              placeholder="0"
              keyboardType="numeric"
              value={draft.budget}
              onChangeText={(txt) => updateDraft({ budget: txt })}
            />
            <Text className="text-vanz-navy text-2xl font-bold ml-2 pb-2">TND</Text>
          </View>
        </View>

        <View className="bg-vanz-yellow/20 p-4 rounded-xl mt-6">
          <Text className="text-vanz-navy font-semibold text-sm">
            💡 Astuce : Un budget réaliste attire plus vite des transporteurs de qualité !
          </Text>
        </View>

      </ScrollView>

      <View className="p-6 bg-white border-t border-gray-100 flex-row gap-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="flex-1 p-4 rounded-xl items-center border-2 border-gray-200"
        >
          <Text className="text-vanz-navy font-bold text-lg">Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/(client)/create-job/step4')}
          disabled={!draft.budget}
          className={`flex-1 p-4 rounded-xl items-center ${!draft.budget ? 'bg-vanz-teal/50' : 'bg-vanz-teal'}`}
        >
          <Text className="text-white text-lg font-bold">Aperçu</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
