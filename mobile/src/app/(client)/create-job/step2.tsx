import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useJobStore } from '@/store/useJobStore';

export default function CreateJobStep2() {
  const router = useRouter();
  const { draft, updateDraft } = useJobStore();

  const vehicleSizes = ['Petit (Moto/Voiture)', 'Moyen (Fourgonnette)', 'Grand (Camion)'];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-vanz-iceblue">
      <ScrollView className="flex-1 p-6">
        <Text className="text-vanz-navy text-2xl font-bold mb-6">Détails de la mission</Text>

        <Text className="text-vanz-navy font-semibold mb-2">Taille du véhicule requise</Text>
        <View className="mb-6 gap-2">
          {vehicleSizes.map((size) => (
            <TouchableOpacity 
              key={size}
              onPress={() => updateDraft({ vehicleSize: size })}
              className={`p-4 rounded-xl border-2 ${draft.vehicleSize === size ? 'border-vanz-teal bg-vanz-teal/10' : 'border-gray-200 bg-white'}`}
            >
              <Text className={`font-semibold ${draft.vehicleSize === size ? 'text-vanz-teal' : 'text-vanz-navy'}`}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-vanz-navy font-semibold mb-2">Description des biens</Text>
        <TextInput 
          className="bg-white p-4 rounded-xl border border-gray-200 text-vanz-navy h-32 mb-6"
          placeholder="Ex: 3 cartons, 1 machine à laver. Ascenseur en panne au départ..."
          multiline
          textAlignVertical="top"
          value={draft.description}
          onChangeText={(txt) => updateDraft({ description: txt })}
        />

        <Text className="text-vanz-navy font-semibold mb-2">Date et Heure</Text>
        <TextInput 
          className="bg-white p-4 rounded-xl border border-gray-200 text-vanz-navy mb-6"
          placeholder="Ex: Le plus tôt possible, ou Demain 14:00"
          value={draft.date}
          onChangeText={(txt) => updateDraft({ date: txt })}
        />

      </ScrollView>

      <View className="p-6 bg-white border-t border-gray-100">
        <TouchableOpacity 
          onPress={() => router.push('/(client)/create-job/step3')}
          disabled={!draft.description}
          className={`w-full p-4 rounded-xl items-center ${!draft.description ? 'bg-vanz-teal/50' : 'bg-vanz-teal'}`}
        >
          <Text className="text-white text-lg font-bold">Suivant</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
