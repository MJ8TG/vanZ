import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function BidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuthStore();
  
  const [job, setJob] = useState<any>(null);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(true);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setJob(data);
    } catch (e) {
      console.error(e);
    } finally {
      setJobLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!price) {
      Alert.alert('Erreur', 'Veuillez entrer un prix.');
      return;
    }
    if (!session?.user?.id) {
      Alert.alert('Erreur', 'Veuillez vous reconnecter.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('bids').insert({
        job_id: id,
        driver_id: session.user.id,
        amount: parseFloat(price),
        notes: notes || null,
        status: 'pending',
      });
      
      if (error) throw error;
      
      Alert.alert('Succès', 'Votre offre a été envoyée au client.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (jobLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-vanz-iceblue">
        <ActivityIndicator size="large" color="#F5C800" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-vanz-iceblue">
      <View className="pt-16 pb-6 px-6 bg-vanz-navy">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-vanz-teal font-bold text-lg">← Retour</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Faire une offre</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Job Summary Card */}
        {job && (
          <View className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-vanz-yellow mb-6">
            <Text className="text-vanz-navy font-bold text-lg mb-1">{job.service_type || 'Mission'}</Text>
            <Text className="text-vanz-navy/70 text-sm mb-1">📍 {job.pickup_address}</Text>
            <Text className="text-vanz-navy/70 text-sm mb-2">🏁 {job.dropoff_address}</Text>
            <Text className="text-vanz-teal font-bold">Budget client : {job.budget} TND</Text>
          </View>
        )}

        <Text className="text-vanz-navy font-bold text-lg mb-2">Votre Prix (TND)</Text>
        <TextInput
          className="bg-white p-4 rounded-xl border border-gray-200 text-vanz-navy text-3xl font-extrabold text-center mb-6"
          placeholder="0.00"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <Text className="text-vanz-navy font-bold text-lg mb-2">Message pour le client (Optionnel)</Text>
        <TextInput
          className="bg-white p-4 rounded-xl border border-gray-200 text-vanz-navy h-32 mb-6"
          placeholder="Ex: Je suis disponible dès maintenant, j'ai un camion adapté..."
          multiline
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />

        <View className="bg-vanz-yellow/20 p-4 rounded-xl mb-6">
          <Text className="text-vanz-navy font-semibold text-sm text-center">
            N'oubliez pas que le prix inclut la commission VanZ (12%).
          </Text>
        </View>
      </ScrollView>

      <View className="p-6 bg-white border-t border-gray-100">
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={loading || !price}
          className={`w-full p-4 rounded-xl items-center ${loading || !price ? 'bg-vanz-teal/50' : 'bg-vanz-teal'}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold">Envoyer l'offre</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
