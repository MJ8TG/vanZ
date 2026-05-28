import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    setError('');
    // Basic validation for Tunisian numbers: +216 followed by 8 digits
    const cleaned = phone.replace(/\D/g, '');
    let formattedPhone = cleaned;
    
    // If user typed 8 digits, prepend 216
    if (cleaned.length === 8) {
      formattedPhone = `216${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('216')) {
      formattedPhone = cleaned;
    } else {
      setError('Veuillez entrer un numéro tunisien valide (ex: 2X XXX XXX).');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+${formattedPhone}`,
      });
      if (error) throw error;
      
      // Pass the formatted phone number to the verify screen
      router.push({ pathname: '/auth/verify', params: { phone: `+${formattedPhone}` } });
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue');
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
        <Text className="text-vanz-navy text-3xl font-bold mb-2">Entrez votre numéro</Text>
        <Text className="text-vanz-navy/70 text-base">
          Nous vous enverrons un code de confirmation par SMS.
        </Text>
      </View>

      <View className="mb-6">
        <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4 h-14">
          <Text className="text-vanz-navy text-lg font-bold mr-2">+216</Text>
          <View className="h-8 w-px bg-gray-300 mr-3" />
          <TextInput
            className="flex-1 text-lg text-vanz-navy"
            placeholder="XX XXX XXX"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={8}
            autoFocus
          />
        </View>
        {error ? <Text className="text-red-500 mt-2 ml-1 text-sm">{error}</Text> : null}
      </View>

      <TouchableOpacity 
        onPress={handleSendOTP}
        disabled={loading || phone.length < 8}
        className={`w-full p-4 rounded-xl items-center ${loading || phone.length < 8 ? 'bg-vanz-teal/50' : 'bg-vanz-teal'}`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-bold">Continuer</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
