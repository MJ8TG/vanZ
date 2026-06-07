import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
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
  type: 'earning' | 'withdrawal';
  created_at: string;
  jobs?: {
    service_type: string;
  };
};

export default function WalletScreen() {
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeFilter, setTimeFilter] = useState<'month' | 'all'>('month');

  const balanceScale = useSharedValue(0.5);

  useEffect(() => {
    fetchWallet();
    balanceScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, [timeFilter]);

  const animatedBalanceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceScale.value }]
  }));

  const fetchWallet = async () => {
    if (!session?.user?.id) return;
    try {
      // Fetch balance (mocking logic since wallet table doesn't exist yet, using bids for now)
      const { data: bids } = await datasql
        .from('bids')
        .select('amount, created_at, jobs(service_type)')
        .eq('driver_id', session.user.id)
        .eq('status', 'accepted');

      const mockTxs = (bids || []).map((b: any, i) => ({
        id: `tx-${i}`,
        amount: Number(b.amount),
        type: 'earning' as const,
        created_at: b.created_at,
        jobs: b.jobs
      }));

      // In a real app, filter by date if timeFilter === 'month'
      const total = mockTxs.reduce((sum, tx) => sum + tx.amount, 0);
      
      setBalance(total);
      setTransactions(mockTxs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      console.error(e);
    }
  };

  const isRtl = locale === 'ar';

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={t('driver.wallet')} tall />

      <ScrollView className="flex-1 px-5 pt-5 pb-24" showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View className="rounded-[32px] overflow-hidden shadow-glow-teal mb-8">
            <LinearGradient
              colors={['#38B6FF', '#2196D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-8 items-center"
            >
              <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <View className="absolute bottom-0 left-0 w-24 h-24 bg-vanz-navy/5 rounded-full translate-y-10 -translate-x-10" />

              <Text className="text-white/80 font-bold text-sm uppercase tracking-wider mb-2">
                {locale === 'ar' ? 'الرصيد المتاح' : 'Solde disponible'}
              </Text>
              
              <Animated.Text style={animatedBalanceStyle} className="text-white font-black text-5xl mb-1 drop-shadow-md">
                {balance.toFixed(2)}
              </Animated.Text>
              <Text className="text-white/90 font-extrabold text-lg mb-8">{t('common.currency')}</Text>

              <TouchableOpacity 
                onPress={() => Alert.alert('Info', 'Withdrawal feature coming soon')}
                className="w-full bg-white/20 border border-white/30 py-4 rounded-2xl flex-row items-center justify-center active:bg-white/30"
              >
                <Text className="text-white font-black text-base tracking-wide uppercase">
                  {locale === 'ar' ? 'سحب الرصيد' : 'Retirer les fonds'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Filters */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className={`flex-row mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <TouchableOpacity 
            onPress={() => setTimeFilter('month')}
            className={`px-5 py-2.5 rounded-full mr-3 ml-3 border-2 ${timeFilter === 'month' ? 'bg-vanz-navy border-vanz-navy' : 'bg-transparent border-gray-200'}`}
          >
            <Text className={`font-bold text-sm ${timeFilter === 'month' ? 'text-white' : 'text-gray-400'}`}>
              {locale === 'ar' ? 'هذا الشهر' : 'Ce mois'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTimeFilter('all')}
            className={`px-5 py-2.5 rounded-full border-2 ${timeFilter === 'all' ? 'bg-vanz-navy border-vanz-navy' : 'bg-transparent border-gray-200'}`}
          >
            <Text className={`font-bold text-sm ${timeFilter === 'all' ? 'text-white' : 'text-gray-400'}`}>
              {locale === 'ar' ? 'كل الوقت' : 'Tout le temps'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Transactions List */}
        <Animated.Text entering={FadeInDown.delay(300)} className={`text-vanz-navy font-black text-xl mb-4 ${isRtl ? 'text-right' : ''}`}>
          {locale === 'ar' ? 'سجل العمليات' : 'Historique des transactions'}
        </Animated.Text>

        <View className="gap-3 pb-24">
          {transactions.map((tx, index) => (
            <Animated.View key={tx.id} entering={FadeInDown.delay(300 + index * 50).springify()}>
              <PressableCard className={`p-4 rounded-2xl flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <View className={`flex-row items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ml-4 ${tx.type === 'earning' ? 'bg-vanz-green/10' : 'bg-red-50'}`}>
                    <Text className="text-xl">{tx.type === 'earning' ? '📈' : '💸'}</Text>
                  </View>
                  <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                    <Text className={`text-vanz-navy font-bold text-base ${isRtl ? 'text-right' : ''}`}>
                      {tx.type === 'earning' ? (locale === 'ar' ? 'أرباح مهمة' : 'Gains de mission') : 'Retrait'}
                    </Text>
                    <Text className={`text-gray-400 font-semibold text-xs mt-0.5 ${isRtl ? 'text-right' : ''}`}>
                      {new Date(tx.created_at).toLocaleDateString(locale === 'ar' ? 'ar-TN' : 'fr-FR', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                <View className={`items-end ${isRtl ? 'items-start' : ''}`}>
                  <Text className={`font-black text-lg ${tx.type === 'earning' ? 'text-vanz-green' : 'text-red-500'}`}>
                    {tx.type === 'earning' ? '+' : '-'}{tx.amount.toFixed(2)}
                  </Text>
                  <Text className="text-gray-400 font-bold text-xs uppercase">{t('common.currency')}</Text>
                </View>
              </PressableCard>
            </Animated.View>
          ))}

          {transactions.length === 0 && (
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-4">📭</Text>
              <Text className="text-vanz-navy/50 font-medium text-center">
                {locale === 'ar' ? 'لا توجد عمليات بعد.' : 'Aucune transaction pour le moment.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
