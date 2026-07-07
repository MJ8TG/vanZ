import { colors } from '@/theme/colors';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import Row from '@/components/ui/Row';
import { useDriverWallet } from '@/modules/wallet/hooks/useDriverWallet';
import { WalletService, type DriverWalletTx } from '@/modules/wallet/services/walletService';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { TrendingUp, Undo2, AlertTriangle, Banknote, CreditCard, Clock, Inbox, type LucideIcon } from 'lucide-react-native';

export default function WalletScreen() {
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const { data, isRefetching, refetch } = useDriverWallet(session?.user?.id);
  const balance = data?.balance ?? 0;
  const pendingDebt = data?.pendingDebt ?? 0;
  const transactions = data?.transactions ?? [];
  const pendingWithdrawals = data?.pendingWithdrawals ?? [];
  const [requesting, setRequesting] = useState(false);

  const balanceScale = useSharedValue(0.5);

  const animatedBalanceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceScale.value }],
  }));

  useEffect(() => {
    balanceScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

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
      await WalletService.requestWithdrawal(session.user.id, amount);
      Alert.alert('✓', t('wallet.withdrawSuccess'));
      refetch();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert(t('common.error'), message);
    } finally {
      setRequesting(false);
    }
  };

  const isRtl = locale === 'ar';

  const txMeta: Record<DriverWalletTx['type'], { label: string; Icon: LucideIcon; positive: boolean }> = {
    earning: { label: t('wallet.earning'), Icon: TrendingUp, positive: true },
    refund: { label: t('wallet.refund'), Icon: Undo2, positive: true },
    penalty: { label: t('wallet.penalty'), Icon: AlertTriangle, positive: false },
    withdrawal: { label: t('wallet.withdrawal'), Icon: Banknote, positive: false },
  };

  return (
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('driver.wallet')} tall />

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.teal}
          />
        }
      >
        {/* Balance Card — Stitch "Portefeuille": dark card, yellow CTA */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View className="rounded-[28px] overflow-hidden shadow-elevated mb-6">
            <LinearGradient
              colors={[colors.navy, colors.navyLight, colors.navyMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-7"
            >
              {/* Watermark icon like the Stitch design */}
              <View className="absolute right-4 top-4 opacity-10"><CreditCard size={84} color={colors.white} strokeWidth={1.5} /></View>

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
                    availableBalance > 0 && !hasPendingWithdrawal ? 'text-content' : 'text-white'
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
            <Row className="bg-vanz-yellow/10 border border-vanz-yellow/30 p-4 rounded-2xl mb-6 items-center justify-between">
              <Row className="items-center">
                <View className="mr-3 ml-3"><Clock size={20} color={colors.yellowDark} strokeWidth={2.4} /></View>
                <Text className="text-content font-extrabold text-sm">{t('wallet.withdrawPending')}</Text>
              </Row>
              <Text className="text-content font-black text-base">
                {Number(w.amount).toFixed(2)} {t('common.currency')}
              </Text>
            </Row>
          </Animated.View>
        ))}

        {/* Transactions List */}
        <Animated.Text entering={FadeInDown.delay(300)} className={`text-content font-black text-xl mb-4 ${isRtl ? 'text-right' : ''}`}>
          {t('driver.transactions')}
        </Animated.Text>

        <View className="gap-3 pb-32">
          {transactions.map((tx, index) => {
            const meta = txMeta[tx.type] || txMeta.earning;
            const positive = meta.positive && Number(tx.amount) >= 0;
            const MIcon = meta.Icon;
            return (
              <Animated.View key={tx.id} entering={FadeInDown.delay(300 + index * 50).springify()}>
                <PressableCard className="p-4 rounded-2xl">
                  <Row className="items-center justify-between">
                  <Row className="items-center flex-1">
                    <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ml-4 ${positive ? 'bg-vanz-green/10' : 'bg-danger/10'}`}>
                      <MIcon size={20} color={positive ? colors.green : '#EF4444'} strokeWidth={2.2} />
                    </View>
                    <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                      <Text className={`text-content font-bold text-base ${isRtl ? 'text-right' : ''}`}>
                        {meta.label}
                      </Text>
                      <Text className={`text-content-muted font-semibold text-xs mt-0.5 ${isRtl ? 'text-right' : ''}`}>
                        {new Date(tx.created_at).toLocaleDateString(isRtl ? 'ar-TN' : 'fr-FR', {
                          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </Row>
                  <View className="items-end">
                    <Text className={`font-black text-lg ${positive ? 'text-vanz-green' : 'text-danger'}`}>
                      {positive ? '+' : '-'}{Math.abs(Number(tx.amount)).toFixed(2)}
                    </Text>
                    <Text className="text-content-muted font-bold text-xs uppercase">{t('common.currency')}</Text>
                  </View>
                  </Row>
                </PressableCard>
              </Animated.View>
            );
          })}

          {transactions.length === 0 && (
            <View className="items-center justify-center py-12">
              <View className="mb-4"><Inbox size={40} color={colors.slate} strokeWidth={1.8} /></View>
              <Text className="text-content-secondary font-medium text-center">{t('driver.noTransactions')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
