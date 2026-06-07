import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  const isRtl = locale === 'ar';

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError(t('auth.fillFieldsError'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await datasql.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      if (data.session) {
        router.replace('/mode-selector');
      }
    } catch (e: any) {
      setError(e.message || t('auth.invalidLoginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-vanz-iceblue"
    >
      <View className="flex-1 justify-center">
        {/* Top Gradient Wash */}
        <LinearGradient
          colors={['#E4EDF3', '#F0F6FA', 'transparent']}
          className="absolute top-0 w-full h-64 z-0"
        />

        <View className="px-6 py-8 relative z-10">
          <View className="items-center mb-10">
            <View className="bg-white p-4 rounded-3xl shadow-elevated mb-6">
              <Image 
                source={require('../../../assets/images/logo.png')} 
                className="w-32 h-10" 
                resizeMode="contain" 
              />
            </View>
            <Text className="text-vanz-navy text-3xl font-black mb-2">{t('auth.loginTitle')}</Text>
            <Text className="text-vanz-navy/60 text-base font-medium text-center">
              {t('auth.loginSubtitle')}
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

            <View>
              <Text className={`text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{t('auth.passwordLabel')}</Text>
              <TextInput
                className={`bg-white rounded-2xl border-2 shadow-sm px-5 h-16 text-lg text-vanz-navy ${focusedInput === 'password' ? 'border-vanz-teal' : 'border-white'} ${isRtl ? 'text-right' : ''}`}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {error ? (
              <View className={`bg-red-50 p-3 rounded-xl border border-red-100 flex-row items-center mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-red-500 mr-2 ml-2">⚠️</Text>
                <Text className={`text-red-500 text-sm font-bold flex-1 ${isRtl ? 'text-right' : ''}`}>{error}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity 
            onPress={handleLogin}
            disabled={loading || !email || !password}
            className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90"
          >
            <LinearGradient
              colors={loading || !email || !password ? ['#38B6FF80', '#2196D680'] : ['#38B6FF', '#2196D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-xl font-extrabold">{t('auth.loginButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View className={`flex-row justify-between items-center mt-8 px-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity onPress={() => router.replace('/auth/register')}>
              <Text className="text-vanz-navy/70 font-bold">{t('auth.createAccount')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push('/auth/reset-password')}>
              <Text className="text-vanz-teal font-bold">{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
