import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import type { MobileJob } from '@/types/domain';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

interface DriverJobSheetProps {
  job: MobileJob;
  onClose: () => void;
  onBidSuccess: () => void;
}

export default function DriverJobSheet({ job, onClose, onBidSuccess }: DriverJobSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '80%'], []);
  const { session } = useAuthStore();
  const { t, locale } = useI18n();

  const [bidAmount, setBidAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRtl = locale === 'ar';

  const adjustBid = (amount: number) => {
    const current = parseFloat(bidAmount || '0');
    if (!isNaN(current)) {
      setBidAmount(Math.max(0, current + amount).toString());
    } else {
      setBidAmount(Math.max(0, amount).toString());
    }
  };

  const submitBid = async () => {
    if (!session?.user?.id) return;
    const numericAmount = parseFloat(bidAmount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(t('common.error'), locale === 'ar' ? 'الرجاء إدخال مبلغ صحيح' : 'Veuillez entrer un montant valide');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await datasql.from('bids').insert({
        job_id: job.id,
        driver_id: session.user.id,
        amount: numericAmount,
        note: note.trim() ? note.trim() : null,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert(
            locale === 'ar' ? 'تم تقديم العرض مسبقاً' : 'Offre déjà soumise',
            locale === 'ar' ? 'لقد قدمت عرضاً لهذه المهمة بالفعل.' : 'Vous avez déjà fait une offre pour cette mission.'
          );
        } else {
          throw error;
        }
      } else {
        Alert.alert(
          locale === 'ar' ? 'تم الإرسال!' : 'Offre envoyée !',
          locale === 'ar' ? 'تم إرسال عرضك للعميل.' : 'Votre offre a été envoyée au client.'
        );
        onBidSuccess();
      }
    } catch (error: any) {
      console.error('Bid error:', error);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      keyboardBehavior="interactive"
      backgroundStyle={{ backgroundColor: '#ffffff', borderRadius: 32 }}
      handleIndicatorStyle={{ backgroundColor: '#e2e8f0', width: 48, height: 6 }}
    >
      <BottomSheetView className="flex-1 px-6 pb-6 pt-2">
        <Animated.View entering={FadeIn.duration(400)} className="flex-1">
          <View className={`flex-row justify-between items-center mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <View>
              <Text className={`text-vanz-navy font-black text-2xl ${isRtl ? 'text-right' : ''}`}>
                {job.service_type === 'parcel' ? (locale === 'ar' ? 'شحنة' : 'Colis') : (job.service_type || 'Mission')}
              </Text>
              <View className={`flex-row items-center mt-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-gray-400 font-bold text-xs mr-2 ml-2">🕒 {job.time_slot}</Text>
                <View className="w-1 h-1 bg-gray-300 rounded-full" />
                <Text className="text-gray-400 font-bold text-xs ml-2 mr-2">📅 {new Date(job.scheduled_at || new Date().toISOString()).toLocaleDateString()}</Text>
              </View>
            </View>
            <View className="bg-vanz-navy/5 px-3 py-1.5 rounded-lg border border-vanz-navy/10">
              <Text className="text-vanz-navy font-black text-xs uppercase">{job.load_capacity?.replace('van_', 'Van ')}</Text>
            </View>
          </View>

          {/* Route Card */}
          <View className="bg-gray-50/80 p-4 rounded-card border border-gray-100 mb-6 relative">
            {/* Dotted connector line */}
            <View className={`absolute top-8 bottom-8 w-px border-l-2 border-dashed border-gray-200 ${isRtl ? 'right-[29px]' : 'left-[29px]'}`} />
            
            <View className={`flex-row items-start mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className="w-7 h-7 rounded-full bg-vanz-teal/20 items-center justify-center mr-3 ml-3 relative z-10 border-2 border-white">
                <View className="w-2.5 h-2.5 rounded-full bg-vanz-teal" />
              </View>
              <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'نقطة الانطلاق' : 'Départ'}
                </Text>
                <Text className={`text-vanz-navy font-bold text-sm ${isRtl ? 'text-right' : ''}`}>
                  {job.pickup_address}
                </Text>
              </View>
            </View>

            <View className={`flex-row items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className="w-7 h-7 rounded-xl bg-vanz-yellow/20 items-center justify-center mr-3 ml-3 relative z-10 border-2 border-white">
                <View className="w-2.5 h-2.5 rounded-sm bg-vanz-yellow" />
              </View>
              <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">
                  {locale === 'ar' ? 'نقطة الوصول' : 'Arrivée'}
                </Text>
                <Text className={`text-vanz-navy font-bold text-sm ${isRtl ? 'text-right' : ''}`}>
                  {job.dropoff_address}
                </Text>
              </View>
            </View>
          </View>

          {job.description ? (
            <View className="bg-vanz-teal/5 p-4 rounded-2xl border border-vanz-teal/10 mb-6">
              <Text className={`text-vanz-navy/80 text-sm font-medium leading-relaxed ${isRtl ? 'text-right' : ''}`}>
                <Text className="font-bold">Note: </Text>{job.description}
              </Text>
            </View>
          ) : null}

          {/* Bidding Section */}
          <Text className={`text-vanz-navy font-extrabold text-sm mb-3 ${isRtl ? 'text-right' : ''}`}>
            {locale === 'ar' ? 'اقتراح سعر (TND)' : 'Proposer un prix (TND)'}
          </Text>
          
          <View className={`flex-row items-center mb-5 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity 
              onPress={() => adjustBid(-5)}
              className="w-14 h-14 bg-gray-50 rounded-2xl items-center justify-center border border-gray-200 active:bg-gray-100"
            >
              <Text className="text-vanz-navy text-2xl font-medium">-</Text>
            </TouchableOpacity>
            
            <View className="flex-1 relative">
              <TextInput
                className="bg-white border-2 border-vanz-teal text-vanz-navy font-black text-2xl text-center h-14 rounded-2xl shadow-glow-teal"
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholder="0"
                placeholderTextColor="#CBD5E1"
              />
              <Text className="absolute right-4 top-4 text-vanz-teal font-extrabold">TND</Text>
            </View>

            <TouchableOpacity 
              onPress={() => adjustBid(5)}
              className="w-14 h-14 bg-gray-50 rounded-2xl items-center justify-center border border-gray-200 active:bg-gray-100"
            >
              <Text className="text-vanz-navy text-2xl font-medium">+</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            className={`bg-white border-2 border-gray-100 rounded-2xl p-4 text-vanz-navy text-sm shadow-sm mb-6 ${isRtl ? 'text-right' : ''}`}
            placeholder={locale === 'ar' ? 'ملاحظة للعميل (اختياري)...' : 'Un mot pour le client (optionnel)...'}
            placeholderTextColor="#9CA3AF"
            value={note}
            onChangeText={setNote}
          />

          <TouchableOpacity 
            onPress={submitBid} 
            disabled={isSubmitting || !bidAmount}
            className="w-full h-16 rounded-2xl overflow-hidden shadow-elevated active:opacity-90 mt-auto"
          >
            <LinearGradient
              colors={isSubmitting || !bidAmount ? ['#1A244480', '#0B102180'] : ['#1A2444', '#0B1021']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full items-center justify-center flex-row"
            >
              {isSubmitting ? (
                <Text className="text-white text-xl font-extrabold opacity-70">{t('common.loading')}</Text>
              ) : (
                <>
                  <Text className="text-white text-xl font-extrabold">{locale === 'ar' ? 'إرسال العرض' : 'Envoyer l\'offre'}</Text>
                  <Text className="text-white text-xl ml-2">🚀</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </BottomSheetView>
    </BottomSheet>
  );
}
