import { View, Text, TouchableOpacity, ScrollView, Share, Linking, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const REWARD_TND = 10;

export default function ReferralView() {
  const { session } = useAuthStore();
  const { locale } = useI18n();
  const ar = locale === 'ar';
  const isRtl = ar;
  const userId = session?.user?.id;

  const [code, setCode] = useState<string | null>(null);
  const [invited, setInvited] = useState(0);
  const [rewarded, setRewarded] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [{ data: profile }, { count: invitedCount }, { count: rewardedCount }] = await Promise.all([
        datasql.from('users').select('referral_code').eq('id', userId).single(),
        datasql.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', userId),
        datasql.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', userId).eq('status', 'rewarded'),
      ]);
      setCode(profile?.referral_code ?? null);
      setInvited(invitedCount ?? 0);
      setRewarded(rewardedCount ?? 0);
    } catch (e) {
      console.error('Failed to load referral data:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const shareMessage = ar
    ? `انضم إلي على VanZ! استخدم رمزي ${code} واحصل على ${REWARD_TND} دينار على أول رحلة. 🚚`
    : `Rejoignez-moi sur VanZ ! Utilisez mon code ${code} et obtenez ${REWARD_TND} DT sur votre premier trajet. 🚚`;

  const handleShare = async () => {
    if (!code) return;
    try {
      await Share.share({ message: shareMessage });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const handleWhatsApp = () => {
    if (!code) return;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`).catch(() => {});
  };

  if (loading) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#38B6FF" size="large" /></View>;
  }

  const creditEarned = rewarded * REWARD_TND;

  return (
    <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <Animated.View entering={FadeInDown.delay(80).springify()} className="items-center mb-6">
        <View className="w-20 h-20 bg-vanz-yellow/15 rounded-3xl items-center justify-center mb-4 border border-vanz-yellow/20">
          <Text className="text-4xl">🎁</Text>
        </View>
        <Text className="text-vanz-navy text-xl font-black mb-2 text-center px-4">
          {ar ? `اربح ${REWARD_TND} دينار عن كل صديق` : `Gagnez ${REWARD_TND} DT pour chaque ami invité`}
        </Text>
        <Text className="text-vanz-navy/60 text-center font-medium px-2 leading-relaxed">
          {ar
            ? `شارك رمزك. يحصل صديقك على ${REWARD_TND} دينار على أول رحلة، وتحصل أنت على ${REWARD_TND} دينار رصيد!`
            : `Partagez votre code. Votre ami obtient ${REWARD_TND} DT sur son premier trajet, et vous recevez ${REWARD_TND} DT de crédit !`}
        </Text>
      </Animated.View>

      {/* Code card */}
      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <LinearGradient colors={['#0B1021', '#131B36', '#1A2444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-[28px] p-6 mb-6 items-center">
          <Text className="text-vanz-teal font-bold text-xs uppercase tracking-[2px] mb-3">{ar ? 'رمزك الشخصي' : 'Votre code personnel'}</Text>
          <Text className="text-white font-black text-4xl tracking-[4px] mb-5">{code || '—'}</Text>
          <TouchableOpacity onPress={handleShare} className="w-full bg-vanz-yellow py-4 rounded-2xl items-center justify-center flex-row shadow-glow-yellow active:opacity-90">
            <Text className="text-lg mr-2 ml-2">📤</Text>
            <Text className="text-vanz-navy font-black text-base">{ar ? 'مشاركة الرمز' : 'Partager mon code'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleWhatsApp} className="w-full mt-3 bg-white/10 border border-white/20 py-3.5 rounded-2xl items-center justify-center flex-row active:bg-white/20">
            <Text className="text-base mr-2 ml-2">💬</Text>
            <Text className="text-white font-extrabold text-sm">{ar ? 'مشاركة عبر واتساب' : 'Partager via WhatsApp'}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(220).springify()} className={`flex-row gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <View className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-100 shadow-card">
          <Text className="text-vanz-navy font-black text-2xl">{invited}</Text>
          <Text className="text-vanz-navy/50 font-bold text-[11px] uppercase tracking-wide mt-1 text-center">{ar ? 'مدعوون' : 'Invités'}</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-100 shadow-card">
          <Text className="text-vanz-teal font-black text-2xl">{rewarded}</Text>
          <Text className="text-vanz-navy/50 font-bold text-[11px] uppercase tracking-wide mt-1 text-center">{ar ? 'مؤكدون' : 'Confirmés'}</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-100 shadow-card">
          <Text className="text-vanz-green font-black text-2xl">{creditEarned}</Text>
          <Text className="text-vanz-navy/50 font-bold text-[11px] uppercase tracking-wide mt-1 text-center">{ar ? 'دينار مكتسب' : 'DT gagnés'}</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
