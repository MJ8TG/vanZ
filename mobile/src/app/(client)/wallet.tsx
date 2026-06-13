import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type WalletTx = {
  id: string;
  amount: number;
  type: 'credit' | 'debit' | 'promo' | 'referral' | 'refund';
  note: string | null;
  created_at: string;
};

const TX_META: Record<WalletTx['type'], { icon: string; positive: boolean; fr: string; ar: string }> = {
  credit: { icon: '💰', positive: true, fr: 'Crédit', ar: 'رصيد' },
  debit: { icon: '🛒', positive: false, fr: 'Paiement', ar: 'دفع' },
  promo: { icon: '🎟️', positive: true, fr: 'Code promo', ar: 'رمز ترويجي' },
  referral: { icon: '🎁', positive: true, fr: 'Parrainage', ar: 'إحالة' },
  refund: { icon: '↩️', positive: true, fr: 'Remboursement', ar: 'استرجاع' },
};

export default function ClientWalletScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const ar = locale === 'ar';
  const isRtl = ar;
  const userId = session?.user?.id;

  const [balance, setBalance] = useState(0);
  const [points, setPoints] = useState(0);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scale = useSharedValue(0.5);
  const balanceStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const fetchWallet = useCallback(async () => {
    if (!userId) return;
    try {
      const [{ data: profile }, { data: txData }] = await Promise.all([
        datasql.from('users').select('credit_balance, loyalty_points').eq('id', userId).single(),
        datasql.from('wallet_transactions').select('id, amount, type, note, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      ]);
      setBalance(Number(profile?.credit_balance || 0));
      setPoints(Number(profile?.loyalty_points || 0));
      setTxs((txData || []) as WalletTx[]);
    } catch (e) {
      console.error('Failed to fetch wallet:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWallet();
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, [fetchWallet]);

  const header = (
    <View>
      {/* Balance card */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient colors={['#0B1021', '#131B36', '#1A2444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-[28px] p-7 mb-4">
          <Text className="absolute right-4 top-4 text-7xl opacity-10">💳</Text>
          <Text className="text-vanz-teal font-bold text-xs uppercase tracking-[2px] mb-3">{ar ? 'الرصيد المتاح' : 'Solde disponible'}</Text>
          <View className={`flex-row items-end mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Animated.Text style={balanceStyle} className="text-white font-black text-5xl">{balance.toFixed(2)}</Animated.Text>
            <Text className="text-white/70 font-extrabold text-xl mb-1.5 ml-2 mr-2">{t('common.currency')}</Text>
          </View>
          <Text className="text-white/50 font-medium text-xs mt-1">
            {ar ? 'يُستخدم تلقائياً عند الدفع.' : 'Utilisé automatiquement lors du paiement.'}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Loyalty points */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <View className={`bg-white rounded-2xl p-4 mb-6 flex-row items-center justify-between border border-gray-100 shadow-card ${isRtl ? 'flex-row-reverse' : ''}`}>
          <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <View className="w-11 h-11 rounded-2xl bg-vanz-yellow/15 items-center justify-center mr-3 ml-3">
              <Text className="text-xl">🏆</Text>
            </View>
            <Text className="text-vanz-navy font-extrabold text-base">{ar ? 'نقاط الولاء' : 'Points de fidélité'}</Text>
          </View>
          <Text className="text-vanz-navy font-black text-2xl">{points}</Text>
        </View>
      </Animated.View>

      <Text className={`text-vanz-navy text-lg font-black mb-3 ${isRtl ? 'text-right' : ''}`}>
        {ar ? 'آخر المعاملات' : 'Transactions récentes'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-vanz-iceblue">
        <GradientHeader title={ar ? 'محفظتي' : 'Portefeuille'} backButton={() => router.back()} tall />
        <View className="px-5 pt-5"><ShimmerCard /><ShimmerCard /></View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={ar ? 'محفظتي' : 'Portefeuille'} backButton={() => router.back()} tall />
      <FlatList
        data={txs}
        keyExtractor={(tx) => tx.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWallet(); }} tintColor="#38B6FF" />}
        renderItem={({ item, index }) => {
          const meta = TX_META[item.type] || TX_META.credit;
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).springify()}>
              <View className={`bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <View className="w-11 h-11 rounded-2xl bg-gray-50 items-center justify-center mr-3 ml-3">
                  <Text className="text-xl">{meta.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-vanz-navy font-extrabold text-sm ${isRtl ? 'text-right' : ''}`}>{ar ? meta.ar : meta.fr}</Text>
                  <Text className={`text-vanz-navy/50 font-semibold text-xs mt-0.5 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                    {item.note || new Date(item.created_at).toLocaleDateString(ar ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text className={`font-black text-base ${meta.positive ? 'text-vanz-green' : 'text-red-500'}`}>
                  {meta.positive ? '+' : '-'}{Math.abs(Number(item.amount)).toFixed(2)} {t('common.currency')}
                </Text>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={() => (
          <Animated.View entering={FadeInDown} className="items-center justify-center py-16">
            <View className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-card mb-5">
              <Text className="text-4xl">🧾</Text>
            </View>
            <Text className="text-vanz-navy/40 text-center text-sm font-semibold px-10">
              {ar ? 'لا توجد معاملات بعد.' : 'Aucune transaction pour le moment.'}
            </Text>
          </Animated.View>
        )}
      />
    </View>
  );
}
