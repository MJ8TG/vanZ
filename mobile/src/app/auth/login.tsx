import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock } from 'lucide-react-native';
import PremiumInput from '@/components/ui/PremiumInput';
import PremiumButton from '@/components/ui/PremiumButton';

export default function LoginScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        const { data: prof } = await datasql.from('users').select('role').eq('id', data.user.id).single();
        router.replace(prof?.role === 'driver' ? '/(driver)' : '/(client)');
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
                accessibilityLabel="VanZ"
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
            <PremiumInput
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail color="#9CA3AF" size={20} />}
            />

            <PremiumInput
              label={t('auth.passwordLabel')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Lock color="#9CA3AF" size={20} />}
            />

            {error ? (
              <View className={`bg-red-50 p-3 rounded-xl border border-red-100 flex-row items-center mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-red-500 mr-2 ml-2">⚠️</Text>
                <Text className={`text-red-500 text-sm font-bold flex-1 ${isRtl ? 'text-right' : ''}`}>{error}</Text>
              </View>
            ) : null}
          </View>

          <PremiumButton
            title={t('auth.loginButton')}
            variant="primary"
            isLoading={loading}
            onPress={handleLogin}
          />

          <View className={`flex-row justify-between items-center mt-8 px-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity onPress={() => router.replace('/auth/register')}>
              <Text className="text-vanz-navy/70 font-bold">{t('auth.createAccount')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push('/auth/reset-password')}>
              <Text className="text-vanz-teal font-bold">{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
