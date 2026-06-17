import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Mail, Phone, Lock } from 'lucide-react-native';
import PremiumInput from '@/components/ui/PremiumInput';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumCard from '@/components/ui/PremiumCard';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function RegisterScreen() {
  const router = useRouter();
  const { setMode } = useAuthStore();
  const { t, locale } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState<'client' | 'driver'>('client');
  const [termsAccepted, setTermsAccepted] = useState(false);
  

  const isRtl = locale === 'ar';

  const handleRegister = async () => {
    setError('');
    if (!email || !password || !name) {
      setError(t('auth.fillRequiredFieldsError'));
      return;
    }

    if (!termsAccepted) {
      setError(t('auth.termsRequiredError'));
      return;
    }

    const formattedPhone = phone ? phone.replace(/\D/g, '') : '';
    // Drivers must provide a phone number — clients and dispatch need to reach them.
    if (role === 'driver' && !formattedPhone) {
      setError(t('auth.phoneRequiredDriverError'));
      return;
    }
    if (formattedPhone && !/^[2459]\d{7}$/.test(formattedPhone)) {
      setError(t('auth.phoneError'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await datasql.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: formattedPhone ? `+216${formattedPhone}` : null,
            role: role,
          }
        }
      });
      
      if (error) throw error;
      
      if (data.session) {
        // Role is already chosen on this screen — set it locally and go
        // straight to the right area (skip the mode selector). Drivers land on
        // the driver tab, which routes them into the verification wizard.
        setMode(role);
        router.replace(role === 'driver' ? '/(driver)' : '/(client)');
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message || t('auth.registerError'));
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
              accessibilityLabel="VanZ"
              className="w-32 h-10" 
              resizeMode="contain" 
            />
          </View>
          <View className="w-24 h-24 bg-vanz-teal/20 rounded-full items-center justify-center mb-6 relative">
            <View className="absolute inset-0 bg-vanz-teal/10 rounded-full" />
            <View className="w-16 h-16 bg-vanz-teal rounded-full items-center justify-center shadow-glow-teal">
              <Text className="text-white text-3xl font-bold">✓</Text>
            </View>
          </View>
          <Text className="text-vanz-navy text-3xl font-black mb-4 text-center">{t('auth.registerSuccessTitle')}</Text>
          <Text className="text-vanz-navy/60 text-center text-lg mb-10 font-medium leading-relaxed px-4">
            {t('auth.registerSuccessDesc')}
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        {/* Top Gradient Wash */}
        <LinearGradient
          colors={['#E4EDF3', '#F0F6FA', 'transparent']}
          className="absolute top-0 w-full h-64 z-0"
        />

        <View className="px-6 py-12 relative z-10">
          <View className="items-center mb-8 mt-4">
            <View className="bg-white p-4 rounded-3xl shadow-elevated mb-6">
              <Image 
                source={require('../../../assets/images/logo.png')}
              accessibilityLabel="VanZ"
                className="w-32 h-10" 
                resizeMode="contain" 
              />
            </View>
            <Text className="text-vanz-navy text-3xl font-black mb-2">{t('auth.registerTitle')}</Text>
            <Text className="text-vanz-navy/60 text-base font-medium text-center">
              {t('auth.registerSubtitle')}
            </Text>
          </View>

          <View className="mb-8 gap-5">
            {/* Role Selection — floating segmented control inside a PremiumCard.
                Dynamic colors via inline style to avoid NativeWind CSS-variable
                churn (which remounts and eats taps). */}
            <PremiumCard className="p-1.5">
              <View className="flex-row" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <TouchableOpacity
                  onPress={() => setRole('client')}
                  activeOpacity={0.8}
                  className="flex-1 py-3 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: role === 'client' ? '#ffffff' : 'transparent' }}
                >
                  <Text className="font-jakarta-bold text-base" style={{ color: role === 'client' ? '#0B1021' : '#9CA3AF' }}>
                    {t('auth.roleClient')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRole('driver')}
                  activeOpacity={0.8}
                  className="flex-1 py-3 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: role === 'driver' ? '#38B6FF' : 'transparent' }}
                >
                  <Text className="font-jakarta-bold text-base" style={{ color: role === 'driver' ? '#ffffff' : '#9CA3AF' }}>
                    {t('auth.roleDriver')}
                  </Text>
                </TouchableOpacity>
              </View>
            </PremiumCard>

            <PremiumInput
              label={t('auth.nameLabel')}
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChangeText={setName}
              icon={<User color="#9CA3AF" size={20} />}
            />

            <PremiumInput
              label={`${t('auth.emailLabel')} *`}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail color="#9CA3AF" size={20} />}
            />

            <PremiumInput
              label={role === 'driver' ? `${t('auth.phoneLabelDriver')} *` : t('auth.phoneLabel')}
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={8}
              icon={
                <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Phone color="#9CA3AF" size={18} />
                  <Text className="text-vanz-navy text-sm font-jakarta-bold mx-1.5">+216</Text>
                </View>
              }
            />

            <View>
              <PremiumInput
                label={t('auth.passwordRequiredLabel')}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon={<Lock color="#9CA3AF" size={20} />}
              />
              {password.length > 0 && (() => {
                const score = (password.length >= 8 ? 1 : 0) + (/\d/.test(password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
                const meta = [
                  { fr: 'Faible', ar: 'ضعيف', c: '#EF4444' },
                  { fr: 'Moyen', ar: 'متوسط', c: '#F59E0B' },
                  { fr: 'Bon', ar: 'جيد', c: '#22C55E' },
                  { fr: 'Fort', ar: 'قوي', c: '#16A34A' },
                ][score];
                const filled = Math.max(1, score);
                return (
                  <View className={`flex-row items-center mt-2 px-1 gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <View className={`flex-1 flex-row gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      {[0, 1, 2].map((i) => (
                        <View key={i} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: i < filled ? meta.c : '#E5E7EB' }} />
                      ))}
                    </View>
                    <Text className="text-xs font-bold" style={{ color: meta.c }}>{isRtl ? meta.ar : meta.fr}</Text>
                  </View>
                );
              })()}
            </View>

            {error ? (
              <Animated.View entering={FadeIn} className={`bg-red-50 p-3 rounded-xl border border-red-100 flex-row items-center mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-red-500 mr-2 ml-2">⚠️</Text>
                <Text className={`text-red-500 text-sm font-bold flex-1 ${isRtl ? 'text-right' : ''}`}>{error}</Text>
              </Animated.View>
            ) : null}
          </View>

          {/* Terms acceptance (CGU) */}
          <TouchableOpacity
            onPress={() => setTermsAccepted((v) => !v)}
            activeOpacity={0.7}
            className={`flex-row items-center mb-5 px-1 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <View className={`w-6 h-6 rounded-md border-2 items-center justify-center ${termsAccepted ? 'bg-vanz-teal border-vanz-teal' : 'border-gray-300 bg-white'} ${isRtl ? 'ml-3' : 'mr-3'}`}>
              {termsAccepted && <Text className="text-white text-xs font-black">✓</Text>}
            </View>
            <Text className={`flex-1 text-vanz-navy/70 text-sm ${isRtl ? 'text-right' : ''}`}>
              {t('auth.termsPrefix')}
              <Text
                className="text-vanz-teal font-bold underline"
                onPress={() => { const b = getApiBaseUrl(); if (b) Linking.openURL(`${b}/${locale}/conditions-utilisation`); }}
              >
                {t('auth.termsLink')}
              </Text>
            </Text>
          </TouchableOpacity>

          <PremiumButton
            title={t('auth.registerButton')}
            variant="primary"
            isLoading={loading}
            disabled={!email || !password || !name || !termsAccepted}
            onPress={handleRegister}
          />

          <View className={`flex-row justify-center items-center mt-8 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Text className="text-vanz-navy/60 font-medium">{t('auth.alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text className="text-vanz-teal font-extrabold ml-1 mr-1">{t('auth.loginButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
