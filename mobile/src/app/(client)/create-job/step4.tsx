import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useJobStore } from '@/store/useJobStore';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function CreateJobStep4() {
  const router = useRouter();
  const { draft, resetDraft } = useJobStore();
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const submitJob = async () => {
    if (!session?.user?.id) {
      Alert.alert('Erreur', 'Veuillez vous reconnecter.');
      return;
    }

    setLoading(true);
    try {
      // Check active jobs limit (max 2)
      const { count, error: countError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .in('status', ['open', 'payment_pending', 'matched', 'in_progress']);
      
      if (countError) throw countError;
      if (count && count >= 2) {
        Alert.alert('Limite atteinte', 'Vous avez déjà 2 missions actives. Veuillez attendre qu\'une soit terminée avant d\'en publier une nouvelle.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('jobs').insert({
        user_id: session.user.id,
        service_type: draft.vehicleSize,
        pickup_address: draft.pickup?.name,
        pickup_lat: draft.pickup?.lat,
        pickup_lon: draft.pickup?.lon,
        dropoff_address: draft.dropoff?.name,
        dropoff_lat: draft.dropoff?.lat,
        dropoff_lon: draft.dropoff?.lon,
        description: draft.description,
        budget: parseFloat(draft.budget),
        status: 'open',
      });
      
      if (error) throw error;
      
      Alert.alert('Succès !', 'Votre mission a été publiée avec succès.', [
        { 
          text: 'OK', 
          onPress: () => {
            resetDraft();
            router.dismissAll();
            router.push('/(client)/');
          }
        }
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <ScrollView className="flex-1 p-6">
        <Text className="text-vanz-navy text-2xl font-bold mb-6">Résumé de la mission</Text>

        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
          <Text className="text-vanz-navy/50 text-xs uppercase font-bold mb-1">Trajet</Text>
          <Text className="text-vanz-navy font-semibold mb-1">De : {draft.pickup?.name}</Text>
          <Text className="text-vanz-navy font-semibold">À : {draft.dropoff?.name}</Text>
        </View>

        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
          <Text className="text-vanz-navy/50 text-xs uppercase font-bold mb-1">Détails</Text>
          <Text className="text-vanz-navy font-semibold mb-1">Véhicule : {draft.vehicleSize}</Text>
          <Text className="text-vanz-navy font-semibold mb-1">Date : {draft.date || 'Le plus tôt possible'}</Text>
          <Text className="text-vanz-navy font-semibold mt-2">{draft.description}</Text>
        </View>

        <View className="bg-vanz-teal p-5 rounded-2xl shadow-sm mb-8">
          <Text className="text-white/80 text-xs uppercase font-bold mb-1">Budget</Text>
          <Text className="text-white text-3xl font-extrabold">{draft.budget} TND</Text>
        </View>

      </ScrollView>

      <View className="p-6 bg-white border-t border-gray-100 flex-row gap-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          disabled={loading}
          className="flex-1 p-4 rounded-xl items-center border-2 border-gray-200"
        >
          <Text className="text-vanz-navy font-bold text-lg">Modifier</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={submitJob}
          disabled={loading}
          className={`flex-[2] p-4 rounded-xl items-center ${loading ? 'bg-vanz-teal/50' : 'bg-vanz-teal'}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold">Publier</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
