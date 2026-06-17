import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Transaction = {
  id: string;
  amount: number;
  type: 'earning' | 'refund' | 'penalty' | 'withdrawal';
  created_at: string;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function WalletScreen() {
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const [balance, setBalance] = useState(0);
  const [pendingDebt, setPendingDebt] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const balanceScale = useSharedValue(0.5);

  const animatedBalanceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceScale.value }],
  }));

  const fetchWallet = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const userId = session.user.id;

      const [{ data: profile }, { data: txs }, { data: withdrawals }] = await Promise.all([
        datasql
          .from('users')
          .select('credit_balance, pending_commission_debt')
          .eq('id', userId)
          .single(),
        datasql
          .from('wallet_transactions')
          .select('id, amount, type, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        datasql
          .from('withdrawals')
          .select('id, amount, status, created_at')
          .eq('driver_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      setBalance(Number(profile?.credit_balance || 0));
      setPendingDebt(Number(profile?.pending_commission_debt || 0));
      setTransactions((txs || []) as Transaction[]);
      setPendingWithdrawals((withdrawals || []) as Withdrawal[]);
    } catch (e) {
      console.error('Failed to fetch wallet:', e);
    } finally {
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchWallet();
    balanceScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, [fetchWallet]);

  const availableBalance = Math.max(0, balance - pendingDebt);
  const hasPendingWithdrawal = pendingWithdrawals.length > 0;

  const handleWithdraw = () => {
    if (availableBalance <= 0 || hasPendingWithdrawal) return;

    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('wallet.withdrawTitle'),
        t('wallet.withdrawPrompt'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('wallet.withdrawConfirm'),
            onPress: (value?: string) => submitWithdrawal(Number(value)),
          },
        ],
        'plain-text',
        String(availableBalance.toFixed(2)),
        'decimal-pad'
      );
    } else {
      // Android has no Alert.prompt — request the full available balance after confirmation
      Alert.alert(
        t('wallet.withdrawTitle'),
        `${t('wallet.withdrawPrompt')}: ${availableBalance.toFixed(2)} ${t('common.currency')}`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('wallet.withdrawConfirm'), onPress: () => submitWithdrawal(availableBalance) },
        ]
      );
    }
  };

  const submitWithdrawal = async (amount: number) => {
    if (!session?.user?.id) return;
    if (!amount || isNaN(amount) || amount <= 0 || amount > availableBalance) {
      Alert.alert(t('common.error'), t('wallet.withdrawInvalid'));
      return;
    }

    setRequesting(true);
    try {
      const { error } = await datasql.from('withdrawals').insert({
        driver_id: session.user.id,
        amount,
        status: 'pending',
      });
      if (error) throw error;

      Alert.alert('✓', t('wallet.withdrawSuccess'));
      fetchWallet();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert(t('common.error'), message);
    } finally {
      setRequesting(false);
    }
  };

  const isRtl = locale === 'ar';

  const txMeta: Record<Transaction['type'], { label: string; icon: string; positive: boolean }> = {
    earning: { label: t('wallet.earning'), icon: '📈', positive: true },
    refund: { label: t('wallet.refund'), icon: '↩️', positive: true },
    penalty: { label: t('wallet.penalty'), icon: '⚠️', positive: false },
    withdrawal: { label: t('wallet.withdrawal'), icon: '💸', positive: false },
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={t('driver.wallet')} tall />

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchWallet();
            }}
            tintColor="#38B6FF"
          />
        }
      >
        {/* Balance Card — Stitch "Portefeuille": dark card, yellow CTA */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View className="rounded-[28px] overflow-hidden shadow-elevated mb-6">
            <LinearGradient
              colors={['#0B1021', '#131B36', '#1A2444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-7"
            >
              {/* Watermark icon like the Stitch design */}
              <Text className="absolute right-4 top-4 text-7xl opacity-10">💳</Text>

              <Text className="text-vanz-teal font-bold text-xs uppercase tracking-[2px] mb-3">
                {t('wallet.available')}
              </Text>

              <View className="flex-row items-end mb-1">
                <Animated.Text style={animatedBalanceStyle} className="text-white font-black text-5xl">
                  {availableBalance.toFixed(2)}
                </Animated.Text>
                <Text className="text-white/70 font-extrabold text-xl mb-1.5 ml-2">{t('common.currency')}</Text>
              </View>

              {pendingDebt > 0 && (
                <View className="self-start bg-white/10 px-3 py-1 rounded-full mt-2">
                  <Text className="text-white/80 font-bold text-xs">
                    {t('wallet.pendingDebt')}: -{pendingDebt.toFixed(2)} {t('common.currency')}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleWithdraw}
                disabled={availableBalance <= 0 || hasPendingWithdrawal || requesting}
                className={`mt-6 py-4 rounded-2xl flex-row items-center justify-center ${
                  availableBalance > 0 && !hasPendingWithdrawal
                    ? 'bg-vanz-yellow shadow-glow-yellow active:opacity-90'
                    : 'bg-white/10 opacity-60'
                }`}
              >
                <Text
                  className={`font-black text-base tracking-wide uppercase ${
                    availableBalance > 0 && !hasPendingWithdrawal ? 'text-vanz-navy' : 'text-white'
                  }`}
                >
                  {hasPendingWithdrawal ? t('wallet.withdrawPending') : t('driver.withdraw')}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Pending withdrawals */}
        {pendingWithdrawals.map((w) => (
          <Animated.View key={w.id} entering={FadeInDown.delay(200).springify()}>
            <View className={`bg-vanz-yellow/10 border border-vanz-yellow/30 p-4 rounded-2xl mb-6 flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-xl mr-3 ml-3">⏳</Text>
                <Text className="text-vanz-navy font-extrabold text-sm">{t('wallet.withdrawPending')}</Text>
              </View>
              <Text className="text-vanz-navy font-black text-base">
                {Number(w.amount).toFixed(2)} {t('common.currency')}
              </Text>
            </View>
          </Animated.View>
        ))}

        {/* Transactions List */}
        <Animated.Text entering={FadeInDown.delay(300)} className={`text-vanz-navy font-black text-xl mb-4 ${isRtl ? 'text-right' : ''}`}>
          {t('driver.transactions')}
        </Animated.Text>

        <View className="gap-3 pb-32">
          {transactions.map((tx, index) => {
            const meta = txMeta[tx.type] || txMeta.earning;
            const positive = meta.positive && Number(tx.amount) >= 0;
            return (
              <Animated.View key={tx.id} entering={FadeInDown.delay(300 + index * 50).springify()}>
                <PressableCard className={`p-4 rounded-2xl flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className={`flex-row items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ml-4 ${positive ? 'bg-vanz-green/10' : 'bg-red-50'}`}>
                      <Text className="text-xl">{meta.icon}</Text>
                    </View>
                    <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                      <Text className={`text-vanz-navy font-bold text-base ${isRtl ? 'text-right' : ''}`}>
                        {meta.label}
                      </Text>
                      <Text className={`text-gray-400 font-semibold text-xs mt-0.5 ${isRtl ? 'text-right' : ''}`}>
                        {new Date(tx.created_at).toLocaleDateString(isRtl ? 'ar-TN' : 'fr-FR', {
                          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className={`font-black text-lg ${positive ? 'text-vanz-green' : 'text-red-500'}`}>
                      {positive ? '+' : '-'}{Math.abs(Number(tx.amount)).toFixed(2)}
                    </Text>
                    <Text className="text-gray-400 font-bold text-xs uppercase">{t('common.currency')}</Text>
                  </View>
                </PressableCard>
              </Animated.View>
            );
          })}

          {transactions.length === 0 && (
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-4">📭</Text>
              <Text className="text-vanz-navy/50 font-medium text-center">{t('driver.noTransactions')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
