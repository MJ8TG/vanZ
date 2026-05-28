import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

type DocType = 'cin_front' | 'cin_back' | 'license' | 'vehicle_reg' | 'vehicle_photo';

interface DocItem {
  key: DocType;
  label: string;
  description: string;
}

const documents: DocItem[] = [
  { key: 'cin_front', label: 'CIN - Recto', description: 'Carte d\'identité nationale (face avant)' },
  { key: 'cin_back', label: 'CIN - Verso', description: 'Carte d\'identité nationale (face arrière)' },
  { key: 'license', label: 'Permis de conduire', description: 'Permis de conduire valide' },
  { key: 'vehicle_reg', label: 'Carte grise', description: 'Carte grise du véhicule' },
  { key: 'vehicle_photo', label: 'Photo du véhicule', description: 'Vue extérieure de votre véhicule' },
];

export default function DriverVerifyScreen() {
  const router = useRouter();
  const [uploads, setUploads] = useState<Record<DocType, string | null>>({
    cin_front: null,
    cin_back: null,
    license: null,
    vehicle_reg: null,
    vehicle_photo: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async (docType: DocType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra pour scanner vos documents.');
      return;
    }

    Alert.alert('Choisir une source', '', [
      {
        text: 'Caméra',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setUploads(prev => ({ ...prev, [docType]: result.assets[0].uri }));
          }
        },
      },
      {
        text: 'Galerie',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setUploads(prev => ({ ...prev, [docType]: result.assets[0].uri }));
          }
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const allUploaded = Object.values(uploads).every(v => v !== null);

  const handleSubmit = async () => {
    if (!allUploaded) {
      Alert.alert('Documents manquants', 'Veuillez scanner tous les documents requis.');
      return;
    }

    setSubmitting(true);
    try {
      // In production: upload each file to Supabase Storage, then insert verification record
      await new Promise(r => setTimeout(r, 1500));
      Alert.alert(
        'Documents envoyés !',
        'Vos documents sont en cours de vérification. Vous serez notifié une fois le processus terminé.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <View className="pt-16 pb-6 px-6 bg-vanz-navy">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-vanz-teal font-bold text-lg">← Retour</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Vérification du compte</Text>
        <Text className="text-white/70 mt-1">Scannez vos documents pour activer votre profil transporteur.</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {documents.map((doc) => (
          <TouchableOpacity
            key={doc.key}
            onPress={() => pickImage(doc.key)}
            className={`bg-white p-4 rounded-xl shadow-sm mb-4 flex-row items-center justify-between border-l-4 ${uploads[doc.key] ? 'border-vanz-green' : 'border-gray-300'}`}
          >
            <View className="flex-1 mr-3">
              <Text className="text-vanz-navy font-bold text-base">{doc.label}</Text>
              <Text className="text-vanz-navy/60 text-sm">{doc.description}</Text>
            </View>
            {uploads[doc.key] ? (
              <View className="bg-vanz-green/20 w-10 h-10 rounded-full items-center justify-center">
                <Text className="text-vanz-green font-bold text-lg">✓</Text>
              </View>
            ) : (
              <View className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
                <Text className="text-gray-400 text-lg">📷</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="p-6 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!allUploaded || submitting}
          className={`w-full p-4 rounded-xl items-center ${!allUploaded || submitting ? 'bg-vanz-teal/50' : 'bg-vanz-teal'}`}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold">Soumettre les documents</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
