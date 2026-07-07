import { colors } from '@/theme/colors';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Mail, Phone, Lock, Check, AlertTriangle } from 'lucide-react-native';
import PremiumInput from '@/components/ui/PremiumInput';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumCard from '@/components/ui/PremiumCard';
import Row from '@/components/ui/Row';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { ForceLight } from '@/theme/ThemedRoot';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function RegisterScreen() {
  const router = useRouter();
  const { mode: storedMode, setMode } = useAuthStore();
  const role = storedMode || 'client'; // fallback
  const { t, locale } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
      <View className="flex-1 bg-surface p-6 justify-center items-center">
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center w-full">
          <View className="bg-surface-elevated p-4 rounded-3xl shadow-elevated mb-10">
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
              <Check size={34} color={colors.white} strokeWidth={3} />
            </View>
          </View>
          <Text className="text-content text-3xl font-black mb-4 text-center">{t('auth.registerSuccessTitle')}</Text>
          <Text className="text-content-secondary text-center text-lg mb-10 font-medium leading-relaxed px-4">
            {t('auth.registerSuccessDesc')}
          </Text>
          <TouchableOpacity 
            onPress={() => router.replace('/auth/login')}
            className="w-full h-16 rounded-2xl overflow-hidden shadow-elevated active:opacity-90"
          >
            <LinearGradient
              colors={[colors.navy, colors.navyMid]}
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
    <ForceLight>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Gradient Wash */}
        <LinearGradient
          colors={[colors.iceblueDark, colors.iceblue, 'transparent']}
          className="absolute top-0 w-full h-64 z-0"
        />

        <View className="px-6 py-12 relative z-10">
          <View className="items-center mb-8 mt-4">
            <View className="bg-surface-elevated p-4 rounded-3xl shadow-elevated mb-6">
              <Image 
                source={require('../../../assets/images/logo.png')}
              accessibilityLabel="VanZ"
                className="w-32 h-10" 
                resizeMode="contain" 
              />
            </View>
            <Text className="text-content text-3xl font-black mb-2">{t('auth.registerTitle')}</Text>
            <Text className="text-content-secondary text-base font-medium text-center">
              {t('auth.registerSubtitle')}
            </Text>
          </View>

          <View className="mb-8 gap-5">
            {/* Role Pill showing chosen mode */}
            <View className="self-center bg-white/50 px-4 py-2 rounded-full border border-vanz-teal/20 mb-2">
              <Text className="text-vanz-teal font-extrabold text-sm uppercase tracking-widest">
                {role === 'driver' ? t('auth.roleDriver') : t('auth.roleClient')}
              </Text>
            </View>

            <PremiumInput
              label={t('auth.nameLabel')}
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChangeText={setName}
              icon={<User color={colors.placeholder} size={20} />}
            />

            <PremiumInput
              label={`${t('auth.emailLabel')} *`}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail color={colors.placeholder} size={20} />}
            />

            <PremiumInput
              label={role === 'driver' ? `${t('auth.phoneLabelDriver')} *` : t('auth.phoneLabel')}
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={8}
              icon={
                <Row className="items-center">
                  <Phone color={colors.placeholder} size={18} />
                  <Text className="text-content text-sm font-jakarta-bold mx-1.5">+216</Text>
                </Row>
              }
            />

            <View>
              <PremiumInput
                label={t('auth.passwordRequiredLabel')}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon={<Lock color={colors.placeholder} size={20} />}
              />
              {password.length > 0 && (() => {
                const score = (password.length >= 8 ? 1 : 0) + (/\d/.test(password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
                const meta = [
                  { fr: 'Faible', ar: 'ضعيف', c: '#EF4444' },
                  { fr: 'Moyen', ar: 'متوسط', c: '#F59E0B' },
                  { fr: 'Bon', ar: 'جيد', c: colors.green },
                  { fr: 'Fort', ar: 'قوي', c: colors.greenDark },
                ][score];
                const filled = Math.max(1, score);
                return (
                  <Row className="items-center mt-2 px-1 gap-2">
                    <Row className="flex-1 gap-1">
                      {[0, 1, 2].map((i) => (
                        <View key={i} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: i < filled ? meta.c : '#E5E7EB' }} />
                      ))}
                    </Row>
                    <Text className="text-xs font-bold" style={{ color: meta.c }}>{isRtl ? meta.ar : meta.fr}</Text>
                  </Row>
                );
              })()}
            </View>

            {error ? (
              <Animated.View entering={FadeIn} className={`bg-danger/10 p-3 rounded-xl border border-danger/30 flex-row items-center mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <AlertTriangle size={16} color="#EF4444" strokeWidth={2.4} />
                <Text className={`text-danger text-sm font-bold flex-1 mx-2 ${isRtl ? 'text-right' : ''}`}>{error}</Text>
              </Animated.View>
            ) : null}
          </View>

          {/* Terms acceptance (CGU) */}
          <Row className="items-center mb-5 px-1 flex-wrap">
            <TouchableOpacity
              onPress={() => setTermsAccepted((v) => !v)}
              activeOpacity={0.7}
              className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <View className={`w-6 h-6 rounded-md border-2 items-center justify-center ${termsAccepted ? 'bg-vanz-teal border-vanz-teal' : 'border-gray-300 bg-surface-elevated'} ${isRtl ? 'ml-3' : 'mr-3'}`}>
                {termsAccepted && <Check size={14} color={colors.white} strokeWidth={3} />}
              </View>
              <Text className="text-content-secondary text-sm">
                {t('auth.termsPrefix')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => { const b = getApiBaseUrl(); if (b) Linking.openURL(`${b}/${locale}/conditions-utilisation`); }}
              activeOpacity={0.7}
            >
              <Text className="text-vanz-teal font-bold underline text-sm">
                {t('auth.termsLink')}
              </Text>
            </TouchableOpacity>
          </Row>

          <PremiumButton
            title={t('auth.registerButton')}
            variant="primary"
            isLoading={loading}
            onPress={handleRegister}
          />

          <Row className="justify-center items-center mt-8 mb-4">
            <Text className="text-content-secondary font-medium">{t('auth.alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text className="text-vanz-teal font-extrabold ml-1 mr-1">{t('auth.loginButton')}</Text>
            </TouchableOpacity>
          </Row>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </ForceLight>
  );
}
