import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, withSpring, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

export default function RegisterScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [focusedInput, setFocusedInput] = useState<'name' | 'email' | 'phone' | 'password' | null>(null);

  const isRtl = locale === 'ar';

  const handleRegister = async () => {
    setError('');
    if (!email || !password || !name) {
      setError(t('auth.fillRequiredFieldsError'));
      return;
    }

    const formattedPhone = phone ? phone.replace(/\D/g, '') : '';
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
          }
        }
      });
      
      if (error) throw error;
      
      if (data.session) {
        router.replace('/mode-selector');
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
            <View>
              <Text className={`text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{t('auth.nameLabel')}</Text>
              <TextInput
                className={`bg-white rounded-2xl border-2 shadow-sm px-5 h-16 text-lg text-vanz-navy ${focusedInput === 'name' ? 'border-vanz-teal' : 'border-white'} ${isRtl ? 'text-right' : ''}`}
                placeholder={t('auth.namePlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View>
              <Text className={`text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{t('auth.emailLabel')} *</Text>
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
              <Text className={`text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{t('auth.phoneLabel')}</Text>
              <View className={`flex-row items-center bg-white rounded-2xl border-2 shadow-sm px-4 h-16 ${focusedInput === 'phone' ? 'border-vanz-teal' : 'border-white'} ${isRtl ? 'flex-row-reverse' : ''}`}>
                <View className="bg-vanz-iceblue px-3 py-1.5 rounded-lg border border-gray-100">
                  <Text className="text-vanz-navy text-sm font-bold">+216</Text>
                </View>
                <View className="h-8 w-px bg-gray-100 mx-3" />
                <TextInput
                  className={`flex-1 text-lg text-vanz-navy ${isRtl ? 'text-right' : ''}`}
                  placeholder={t('auth.phonePlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={8}
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View>
              <Text className={`text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{t('auth.passwordRequiredLabel')}</Text>
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
              <Animated.View entering={FadeIn} className={`bg-red-50 p-3 rounded-xl border border-red-100 flex-row items-center mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-red-500 mr-2 ml-2">⚠️</Text>
                <Text className={`text-red-500 text-sm font-bold flex-1 ${isRtl ? 'text-right' : ''}`}>{error}</Text>
              </Animated.View>
            ) : null}
          </View>

          <TouchableOpacity 
            onPress={handleRegister}
            disabled={loading || !email || !password || !name}
            className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90"
          >
            <LinearGradient
              colors={loading || !email || !password || !name ? ['#38B6FF80', '#2196D680'] : ['#38B6FF', '#2196D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-xl font-extrabold">{t('auth.registerButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

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
