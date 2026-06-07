import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [focusedInput, setFocusedInput] = useState<'email' | null>(null);

  const isRtl = locale === 'ar';

  const handleReset = async () => {
    setError('');
    if (!email) {
      setError(t('auth.enterEmailError'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await datasql.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || t('auth.resetError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-vanz-iceblue p-6 justify-center items-center">
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center w-full">
          <View className="bg-white p-4 rounded-3xl shadow-elevated mb-10">
            <Image 
              source={require('../../../assets/images/logo.png')} 
              className="w-32 h-10" 
              resizeMode="contain" 
            />
          </View>
          <View className="w-24 h-24 bg-vanz-teal/20 rounded-full items-center justify-center mb-6 relative">
            <View className="absolute inset-0 bg-vanz-teal/10 rounded-full" />
            <View className="w-16 h-16 bg-vanz-teal rounded-full items-center justify-center shadow-glow-teal">
              <Text className="text-white text-3xl font-bold">✉️</Text>
            </View>
          </View>
          <Text className="text-vanz-navy text-3xl font-black mb-4 text-center">{t('auth.resetSuccessTitle')}</Text>
          <Text className="text-vanz-navy/60 text-center text-lg mb-10 font-medium leading-relaxed px-4">
            {t('auth.resetSuccessDesc')}
          </Text>
          <TouchableOpacity 
            onPress={() => router.replace('/auth/login')}
            className="w-full h-16 rounded-2xl overflow-hidden shadow-elevated active:opacity-90"
          >
            <LinearGradient
              colors={['#0B1021', '#1A2444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full items-center justify-center"
            >
              <Text className="text-white text-xl font-extrabold">{t('auth.backToLogin')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-vanz-iceblue"
    >
      <View className="flex-1 justify-center">
        <LinearGradient
          colors={['#E4EDF3', '#F0F6FA', 'transparent']}
          className="absolute top-0 w-full h-64 z-0"
        />

        <View className="px-6 py-8 relative z-10">
          <View className="items-center mb-10 mt-4">
            <View className="bg-white p-4 rounded-3xl shadow-elevated mb-6">
              <Image 
                source={require('../../../assets/images/logo.png')} 
                className="w-32 h-10" 
                resizeMode="contain" 
              />
            </View>
            <Text className="text-vanz-navy text-3xl font-black mb-2 text-center">{t('auth.resetTitle')}</Text>
            <Text className="text-vanz-navy/60 text-base font-medium text-center px-4">
              {t('auth.resetSubtitle')}
            </Text>
          </View>

          <View className="mb-8 gap-5">
            <View>
              <Text className={`text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{t('auth.emailLabel')}</Text>
              <TextInput
                className={`bg-white rounded-2xl border-2 shadow-sm px-5 h-16 text-lg text-vanz-navy ${focusedInput === 'email' ? 'border-vanz-teal' : 'border-white'} ${isRtl ? 'text-right' : ''}`}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {error ? (
              <Animated.View entering={FadeIn} className={`bg-red-50 p-3 rounded-xl border border-red-100 flex-row items-center mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-red-500 mr-2 ml-2">⚠️</Text>
                <Text className={`text-red-500 text-sm font-bold flex-1 ${isRtl ? 'text-right' : ''}`}>{error}</Text>
              </Animated.View>
            ) : null}
          </View>

          <TouchableOpacity 
            onPress={handleReset}
            disabled={loading || !email}
            className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90"
          >
            <LinearGradient
              colors={loading || !email ? ['#38B6FF80', '#2196D680'] : ['#38B6FF', '#2196D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-xl font-extrabold">{t('auth.sendLinkButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View className="items-center mt-8 px-2">
            <TouchableOpacity onPress={() => router.back()} className="py-2 px-4">
              <Text className="text-vanz-navy/70 font-bold">{t('auth.cancelButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
