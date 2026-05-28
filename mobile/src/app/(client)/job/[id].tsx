import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ClientJobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [job, setJob] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetchJobAndBids();
  }, [id]);

  const fetchJobAndBids = async () => {
    try {
      const [jobRes, bidsRes] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', id).single(),
        supabase.from('bids').select('*, profiles(full_name, avatar_url, rating)').eq('job_id', id).order('created_at', { ascending: false }),
      ]);
      
      if (jobRes.error) throw jobRes.error;
      setJob(jobRes.data);
      setBids(bidsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bidId: string, driverId: string) => {
    Alert.alert(
      'Confirmer',
      'Voulez-vous accepter cette offre ? Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setAccepting(bidId);
            try {
              // Update bid status
              await supabase.from('bids').update({ status: 'accepted' }).eq('id', bidId);
              // Update job status and assign driver
              await supabase.from('jobs').update({ 
                status: 'matched', 
                driver_id: driverId 
              }).eq('id', id);
              // Reject other bids
              await supabase.from('bids')
                .update({ status: 'rejected' })
                .eq('job_id', id)
                .neq('id', bidId);

              Alert.alert('Succès', 'L\'offre a été acceptée !');
              fetchJobAndBids();
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            } finally {
              setAccepting(null);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-vanz-iceblue">
        <ActivityIndicator size="large" color="#2BBFDF" />
      </View>
    );
  }

  const statusLabels: Record<string, string> = {
    open: 'Ouverte',
    matched: 'Attribuée',
    in_progress: 'En cours',
    completed: 'Terminée',
    expired: 'Expirée',
    cancelled: 'Annulée',
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <View className="pt-16 pb-6 px-6 bg-vanz-navy flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-vanz-teal font-bold text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold flex-1" numberOfLines={1}>Détails de la mission</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 border-l-4 border-vanz-teal">
          <View className="flex-row justify-between items-start mb-3">
            <Text className="text-vanz-navy font-bold text-xl flex-1">{job?.service_type || 'Mission'}</Text>
            <View className="bg-vanz-teal/20 px-3 py-1 rounded-full ml-2">
              <Text className="text-vanz-teal font-bold text-xs">{statusLabels[job?.status] || job?.status}</Text>
            </View>
          </View>
          <Text className="text-vanz-navy/70 mb-1">📍 De : {job?.pickup_address || 'Non spécifié'}</Text>
          <Text className="text-vanz-navy/70 mb-3">🏁 À : {job?.dropoff_address || 'Non spécifié'}</Text>
          {job?.description ? (
            <Text className="text-vanz-navy/60 mb-3 italic">{job.description}</Text>
          ) : null}
          <Text className="text-vanz-navy font-bold text-lg">Budget : {job?.budget} TND</Text>
        </View>

        <Text className="text-vanz-navy text-xl font-bold mb-4">
          Offres reçues ({bids.length})
        </Text>
        
        {bids.map(bid => (
          <View key={bid.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-vanz-yellow rounded-full items-center justify-center mr-3">
                  <Text className="text-vanz-navy font-bold">
                    {(bid.profiles?.full_name || 'T')[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-vanz-navy font-bold text-lg">{bid.profiles?.full_name || 'Transporteur'}</Text>
                  {bid.profiles?.rating ? (
                    <Text className="text-vanz-yellow font-bold text-sm">⭐ {bid.profiles.rating}/5</Text>
                  ) : null}
                </View>
              </View>
              <Text className="text-vanz-teal font-extrabold text-xl">{bid.amount} TND</Text>
            </View>

            {bid.notes ? (
              <Text className="text-vanz-navy/60 mb-3 italic">"{bid.notes}"</Text>
            ) : null}

            {job?.status === 'open' && bid.status !== 'rejected' && (
              <TouchableOpacity 
                onPress={() => handleAcceptBid(bid.id, bid.driver_id)}
                disabled={accepting === bid.id}
                className={`p-3 rounded-xl items-center ${accepting === bid.id ? 'bg-vanz-green/50' : 'bg-vanz-green'}`}
              >
                {accepting === bid.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Accepter cette offre</Text>
                )}
              </TouchableOpacity>
            )}

            {bid.status === 'accepted' && (
              <View className="bg-vanz-green/20 p-3 rounded-xl items-center">
                <Text className="text-vanz-green font-bold">✓ Offre acceptée</Text>
              </View>
            )}
            {bid.status === 'rejected' && (
              <View className="bg-gray-100 p-3 rounded-xl items-center">
                <Text className="text-gray-400 font-bold">Offre refusée</Text>
              </View>
            )}
          </View>
        ))}

        {bids.length === 0 && (
          <View className="bg-white p-6 rounded-2xl items-center">
            <Text className="text-vanz-navy/50 text-center">Aucune offre pour le moment. Les transporteurs verront bientôt votre mission !</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
