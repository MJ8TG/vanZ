import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOTP = async () => {
    setError('');
    if (code.length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone!,
        token: code,
        type: 'sms',
      });
      if (error) throw error;

      if (data.session) {
        // Instead of mode selector here, _layout.tsx would usually handle session redirection.
        // For now, push directly to mode selector.
        router.replace('/mode-selector');
      }
    } catch (e: any) {
      setError(e.message || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-vanz-iceblue p-6 justify-center"
    >
      <View className="mb-10">
        <Text className="text-vanz-navy text-3xl font-bold mb-2">Vérification</Text>
        <Text className="text-vanz-navy/70 text-base">
          Entrez le code à 6 chiffres envoyé au {phone}
        </Text>
      </View>

      <View className="mb-6">
        <TextInput
          className="bg-white rounded-xl border border-gray-200 px-4 h-14 text-center text-2xl tracking-[0.5em] font-bold text-vanz-navy"
          placeholder="------"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          maxLength={6}
          autoFocus
        />
        {error ? <Text className="text-red-500 mt-2 ml-1 text-sm text-center">{error}</Text> : null}
      </View>

      <TouchableOpacity 
        onPress={handleVerifyOTP}
        disabled={loading || code.length !== 6}
        className={`w-full p-4 rounded-xl items-center ${loading || code.length !== 6 ? 'bg-vanz-teal/50' : 'bg-vanz-teal'}`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-bold">Vérifier</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} className="mt-6 p-2">
        <Text className="text-vanz-navy/60 text-center font-medium">Modifier le numéro</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
