import { colors } from '@/theme/colors';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import EmptyState from '@/components/ui/EmptyState';
import Row from '@/components/ui/Row';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import { useClientWallet } from '@/modules/wallet/hooks/useClientWallet';
import type { ClientWalletTx } from '@/modules/wallet/services/walletService';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Wallet, ShoppingCart, Ticket, Gift, Undo2, CreditCard, Award, Receipt, type LucideIcon } from 'lucide-react-native';

const TX_META: Record<ClientWalletTx['type'], { Icon: LucideIcon; positive: boolean; labelKey: string }> = {
  credit: { Icon: Wallet, positive: true, labelKey: 'clientWallet.txCredit' },
  debit: { Icon: ShoppingCart, positive: false, labelKey: 'clientWallet.txDebit' },
  promo: { Icon: Ticket, positive: true, labelKey: 'clientWallet.txPromo' },
  referral: { Icon: Gift, positive: true, labelKey: 'clientWallet.txReferral' },
  refund: { Icon: Undo2, positive: true, labelKey: 'clientWallet.txRefund' },
};

export default function ClientWalletScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';
  const userId = session?.user?.id;

  const { data, isLoading: loading, refetch, isRefetching } = useClientWallet(userId);
  const balance = data?.balance ?? 0;
  const points = data?.points ?? 0;
  const txs = data?.txs ?? [];

  const scale = useSharedValue(0.5);
  const balanceStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const header = (
    <View>
      {/* Balance card */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient colors={[colors.navy, colors.navyLight, colors.navyMid]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-[28px] p-7 mb-4">
          <View className="absolute right-4 top-4 opacity-10"><CreditCard size={84} color={colors.white} strokeWidth={1.5} /></View>
          <Text className="text-vanz-teal font-bold text-xs uppercase tracking-[2px] mb-3">{t('clientWallet.available')}</Text>
          <Row className="items-end mb-1">
            <Animated.Text style={balanceStyle} className="text-white font-black text-5xl">{balance.toFixed(2)}</Animated.Text>
            <Text className="text-white/70 font-extrabold text-xl mb-1.5 ml-2 mr-2">{t('common.currency')}</Text>
          </Row>
          <Text className="text-white/50 font-medium text-xs mt-1">
            {t('clientWallet.autoUsed')}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Loyalty points */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <Row className="bg-surface-elevated rounded-2xl p-4 mb-6 items-center justify-between border border-line shadow-card">
          <Row className="items-center">
            <View className="w-11 h-11 rounded-2xl bg-vanz-yellow/15 items-center justify-center mr-3 ml-3">
              <Award size={20} color={colors.yellow} strokeWidth={2.2} />
            </View>
            <Text className="text-content font-extrabold text-base">{t('clientWallet.loyaltyPoints')}</Text>
          </Row>
          <Text className="text-content font-black text-2xl">{points}</Text>
        </Row>
      </Animated.View>

      <Text className={`text-content text-lg font-black mb-3 ${isRtl ? 'text-right' : ''}`}>
        {t('clientWallet.recentTx')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-surface">
        <GradientHeader title={t('profile.wallet')} backButton={() => router.back()} tall />
        <View className="px-5 pt-5"><ShimmerCard /><ShimmerCard /></View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('profile.wallet')} backButton={() => router.back()} tall />
      <FlatList
        data={txs}
        keyExtractor={(tx) => tx.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.teal} />}
        renderItem={({ item, index }) => {
          const meta = TX_META[item.type] || TX_META.credit;
          const MIcon = meta.Icon;
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).springify()}>
              <Row className="bg-surface-elevated rounded-2xl p-4 mb-3 items-center border border-line">
                <View className="w-11 h-11 rounded-2xl bg-surface-sunken items-center justify-center mr-3 ml-3">
                  <MIcon size={20} color={colors.muted} strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className={`text-content font-extrabold text-sm ${isRtl ? 'text-right' : ''}`}>{t(meta.labelKey)}</Text>
                  <Text className={`text-content-secondary font-semibold text-xs mt-0.5 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                    {item.note || new Date(item.created_at).toLocaleDateString(isRtl ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text className={`font-black text-base ${meta.positive ? 'text-vanz-green' : 'text-danger'}`}>
                  {meta.positive ? '+' : '-'}{Math.abs(Number(item.amount)).toFixed(2)} {t('common.currency')}
                </Text>
              </Row>
            </Animated.View>
          );
        }}
        ListEmptyComponent={() => <EmptyState Icon={Receipt} title={t('clientWallet.empty')} />}
      />
    </View>
  );
}
