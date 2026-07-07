import { colors } from '@/theme/colors';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { ForceLight } from '@/theme/ThemedRoot';
import { Mail, Lock, AlertTriangle } from 'lucide-react-native';
import PremiumInput from '@/components/ui/PremiumInput';
import PremiumButton from '@/components/ui/PremiumButton';
import Row from '@/components/ui/Row';

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
    <ForceLight>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Gradient Wash */}
        <LinearGradient
          colors={[colors.iceblueDark, colors.iceblue, 'transparent']}
          className="absolute top-0 w-full h-64 z-0"
        />

        <View className="px-6 py-8 relative z-10">
          <View className="items-center mb-10">
            <View className="bg-surface-elevated p-4 rounded-3xl shadow-elevated mb-6">
              <Image 
                source={require('../../../assets/images/logo.png')}
                accessibilityLabel="VanZ"
                className="w-32 h-10" 
                resizeMode="contain" 
              />
            </View>
            <Text className="text-content text-3xl font-black mb-2">{t('auth.loginTitle')}</Text>
            <Text className="text-content-secondary text-base font-medium text-center">
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
              icon={<Mail color={colors.placeholder} size={20} />}
            />

            <PremiumInput
              label={t('auth.passwordLabel')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Lock color={colors.placeholder} size={20} />}
            />

            {error ? (
              <Row className="bg-red-50 p-3 rounded-xl border border-red-100 items-center mt-1">
                <AlertTriangle size={16} color="#EF4444" strokeWidth={2.4} />
                <Text className={`text-red-500 text-sm font-bold flex-1 mx-2 ${isRtl ? 'text-right' : ''}`}>{error}</Text>
              </Row>
            ) : null}
          </View>

          <PremiumButton
            title={t('auth.loginButton')}
            variant="primary"
            isLoading={loading}
            onPress={handleLogin}
          />

          <Row className="justify-between items-center mt-8 px-2">
            <TouchableOpacity onPress={() => router.replace('/auth/register')}>
              <Text className="text-content-secondary font-bold">{t('auth.createAccount')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/reset-password')}>
              <Text className="text-vanz-teal font-bold">{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          </Row>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </ForceLight>
  );
}
