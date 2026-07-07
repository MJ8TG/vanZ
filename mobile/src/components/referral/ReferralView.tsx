import { colors } from '@/theme/colors';
import { View, Text, TouchableOpacity, ScrollView, Share, Linking, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import { useReferral } from '@/modules/referral/useReferral';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Row from '@/components/ui/Row';
import { Gift, Share2, MessageCircle } from 'lucide-react-native';

const REWARD_TND = 10;

export default function ReferralView() {
  const { session } = useAuthStore();
  const { t } = useI18n();
  const userId = session?.user?.id;

  const { data, isLoading: loading } = useReferral(userId);
  const code = data?.code ?? null;
  const invited = data?.invited ?? 0;
  const rewarded = data?.rewarded ?? 0;

  const shareMessage = t('referral.shareMessage', { code: code ?? '', amount: REWARD_TND });

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
    return <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.teal} size="large" /></View>;
  }

  const creditEarned = rewarded * REWARD_TND;

  return (
    <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <Animated.View entering={FadeInDown.delay(80).springify()} className="items-center mb-6">
        <View className="w-20 h-20 bg-vanz-yellow/15 rounded-3xl items-center justify-center mb-4 border border-vanz-yellow/20">
          <Gift size={34} color={colors.yellow} strokeWidth={2.2} />
        </View>
        <Text className="text-content text-xl font-black mb-2 text-center px-4">
          {t('referral.heroTitle', { amount: REWARD_TND })}
        </Text>
        <Text className="text-content-secondary text-center font-medium px-2 leading-relaxed">
          {t('referral.heroBody', { amount: REWARD_TND })}
        </Text>
      </Animated.View>

      {/* Code card */}
      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <LinearGradient colors={[colors.navy, colors.navyLight, colors.navyMid]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-[28px] p-6 mb-6 items-center">
          <Text className="text-vanz-teal font-bold text-xs uppercase tracking-[2px] mb-3">{t('referral.yourCode')}</Text>
          <Text className="text-white font-black text-4xl tracking-[4px] mb-5">{code || '—'}</Text>
          <TouchableOpacity onPress={handleShare} className="w-full bg-vanz-yellow py-4 rounded-2xl items-center justify-center flex-row shadow-glow-yellow active:opacity-90">
            <Share2 size={18} color={colors.navy} strokeWidth={2.4} />
            <Text className="text-content font-black text-base mx-2">{t('referral.shareCode')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleWhatsApp} className="w-full mt-3 bg-white/10 border border-white/20 py-3.5 rounded-2xl items-center justify-center flex-row active:bg-white/20">
            <MessageCircle size={16} color={colors.white} strokeWidth={2.4} />
            <Text className="text-white font-extrabold text-sm mx-2">{t('referral.shareWhatsApp')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(220).springify()}>
        <Row className="gap-3">
          <View className="flex-1 bg-surface-elevated rounded-2xl p-4 items-center border border-line shadow-card">
            <Text className="text-content font-black text-2xl">{invited}</Text>
            <Text className="text-content-secondary font-bold text-[11px] uppercase tracking-wide mt-1 text-center">{t('referral.invited')}</Text>
          </View>
          <View className="flex-1 bg-surface-elevated rounded-2xl p-4 items-center border border-line shadow-card">
            <Text className="text-vanz-teal font-black text-2xl">{rewarded}</Text>
            <Text className="text-content-secondary font-bold text-[11px] uppercase tracking-wide mt-1 text-center">{t('referral.confirmed')}</Text>
          </View>
          <View className="flex-1 bg-surface-elevated rounded-2xl p-4 items-center border border-line shadow-card">
            <Text className="text-vanz-green font-black text-2xl">{creditEarned}</Text>
            <Text className="text-content-secondary font-bold text-[11px] uppercase tracking-wide mt-1 text-center">{t('referral.earned')}</Text>
          </View>
        </Row>
      </Animated.View>
    </ScrollView>
  );
}
