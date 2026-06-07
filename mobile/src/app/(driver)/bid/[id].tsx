import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function BidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  
  const [job, setJob] = useState<any>(null);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(true);
  const [lowestBid, setLowestBid] = useState<number | null>(null);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const [jobRes, bidsRes] = await Promise.all([
        datasql.from('jobs').select('*').eq('id', id).single(),
        datasql.from('bids').select('amount').eq('job_id', id).order('amount', { ascending: true })
      ]);
      
      if (jobRes.error) throw jobRes.error;
      setJob(jobRes.data);
      
      if (bidsRes.data && bidsRes.data.length > 0) {
        setLowestBid(Number(bidsRes.data[0].amount));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setJobLoading(false);
    }
  };

  const adjustBid = (amount: number) => {
    const current = parseFloat(price || '0');
    if (!isNaN(current)) {
      setPrice(Math.max(0, current + amount).toString());
    } else {
      setPrice(Math.max(0, amount).toString());
    }
  };

  const handleSubmit = async () => {
    if (!price) {
      Alert.alert(t('common.error'), t('auth.fillFieldsError'));
      return;
    }
    if (!session?.user?.id) {
      Alert.alert(t('common.error'), t('auth.invalidCode'));
      return;
    }

    setLoading(true);
    try {
      // Check driver status first
      const { data: driverData, error: driverError } = await datasql
        .from('drivers')
        .select('status')
        .eq('id', session.user.id)
        .maybeSingle();

      if (driverError || driverData?.status !== 'approved') {
        Alert.alert(
          locale === 'ar' ? 'حساب غير مفعل' : 'Compte non approuvé',
          locale === 'ar'
            ? 'يجب أن يتم تفعيل حسابك أولاً لتتمكن من تقديم عرض.'
            : 'Votre compte doit être approuvé pour pouvoir soumettre une offre.'
        );
        setLoading(false);
        return;
      }

      const { error } = await datasql.from('bids').insert({
        job_id: id,
        driver_id: session.user.id,
        amount: parseFloat(price),
        note: notes || null,
        status: 'pending',
      });
      
      if (error) throw error;
      
      Alert.alert(
        locale === 'ar' ? 'نجاح' : 'Succès', 
        t('driver.offerSent'), 
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  };

  if (jobLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-vanz-iceblue">
        <ActivityIndicator size="large" color="#FFC800" />
      </View>
    );
  }

  const isRtl = locale === 'ar';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={t('driver.bidTitle')} backButton={() => router.back()} tall />

      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {job && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View className="bg-white p-5 rounded-card shadow-card border border-gray-100 mb-6">
              <Text className={`text-vanz-navy font-black text-xl mb-4 ${isRtl ? 'text-right' : ''}`}>
                {job.service_type === 'parcel' ? (locale === 'ar' ? 'شحنة' : 'Colis') : (job.service_type || 'Mission')}
              </Text>
              
              <View className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 mb-5 relative">
                <View className={`absolute top-8 bottom-8 w-px border-l-2 border-dashed border-gray-200 ${isRtl ? 'right-[29px]' : 'left-[29px]'}`} />
                
                <View className={`flex-row items-start mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className="w-7 h-7 rounded-full bg-vanz-teal/20 items-center justify-center mr-3 ml-3 relative z-10 border-2 border-white">
                    <View className="w-2.5 h-2.5 rounded-full bg-vanz-teal" />
                  </View>
                  <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                    <Text className={`text-vanz-navy font-bold text-sm ${isRtl ? 'text-right' : ''}`}>{job.pickup_address}</Text>
                  </View>
                </View>

                <View className={`flex-row items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className="w-7 h-7 rounded-xl bg-vanz-yellow/20 items-center justify-center mr-3 ml-3 relative z-10 border-2 border-white">
                    <View className="w-2.5 h-2.5 rounded-sm bg-vanz-yellow" />
                  </View>
                  <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                    <Text className={`text-vanz-navy font-bold text-sm ${isRtl ? 'text-right' : ''}`}>{job.dropoff_address}</Text>
                  </View>
                </View>
              </View>

              <View className="bg-vanz-teal/5 p-4 rounded-xl border border-vanz-teal/10 flex-row justify-between items-center">
                <Text className="text-vanz-navy font-bold">{locale === 'ar' ? 'أقل عرض حالي:' : 'Offre la plus basse :'}</Text>
                {lowestBid ? (
                  <Text className="text-vanz-teal font-black text-lg">{lowestBid} {t('common.currency')}</Text>
                ) : (
                  <Text className="text-vanz-teal font-bold">{t('client.noOffers')}</Text>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text className={`text-vanz-navy font-extrabold text-sm mb-3 ${isRtl ? 'text-right' : ''}`}>
            {t('driver.yourPrice')}
          </Text>
          <View className={`flex-row items-center mb-6 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity 
              onPress={() => adjustBid(-5)}
              className="w-16 h-16 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm active:bg-gray-50"
            >
              <Text className="text-vanz-navy text-2xl font-medium">-</Text>
            </TouchableOpacity>
            
            <View className="flex-1 relative">
              <TextInput
                className="bg-white border-2 border-vanz-teal text-vanz-navy font-black text-3xl text-center h-16 rounded-2xl shadow-glow-teal"
                placeholder="0"
                placeholderTextColor="#CBD5E1"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
              <Text className="absolute right-5 top-5 text-vanz-teal font-extrabold">{t('common.currency')}</Text>
            </View>

            <TouchableOpacity 
              onPress={() => adjustBid(5)}
              className="w-16 h-16 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm active:bg-gray-50"
            >
              <Text className="text-vanz-navy text-2xl font-medium">+</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text className={`text-vanz-navy font-extrabold text-sm mb-3 ${isRtl ? 'text-right' : ''}`}>
            {t('driver.messageClient')}
          </Text>
          <TextInput
            className={`bg-white p-4.5 rounded-2xl border border-gray-100 text-vanz-navy h-32 mb-6 text-sm font-semibold shadow-sm ${isRtl ? 'text-right' : ''}`}
            placeholder={t('driver.messagePlaceholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </Animated.View>
      </ScrollView>

      {/* Submit Button */}
      <View className="absolute bottom-0 w-full p-5 bg-card-glass border-t border-white/50 pb-8 shadow-elevated">
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={loading || !price}
          className="w-full h-16 rounded-2xl overflow-hidden shadow-elevated active:opacity-90"
        >
          <LinearGradient
            colors={loading || !price ? ['#1A244480', '#0B102180'] : ['#1A2444', '#0B1021']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full h-full items-center justify-center flex-row"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-white text-xl font-extrabold">{t('driver.sendOffer')}</Text>
                <Text className="text-white text-xl ml-2">🚀</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
