import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import type { LoadCapacity, PlaceSelection, ServiceType } from '@/types/domain';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';

interface BookingSheetProps {
  pickup: PlaceSelection | null;
  dropoff: PlaceSelection | null;
  onFocusInput: (type: 'pickup' | 'dropoff') => void;
}

const VEHICLE_OPTIONS: Array<{ key: LoadCapacity; label: string; capacity: string; icon: string }> = [
  { key: 'moto', label: 'Moto', capacity: 'Max 20kg', icon: '🛵' },
  { key: 'van_s', label: 'Petit Van', capacity: 'Max 500kg', icon: '🚐' },
  { key: 'van_xl', label: 'Grand Van', capacity: 'Max 1.5t', icon: '🛻' },
  { key: 'camion', label: 'Camion', capacity: 'Max 3.5t', icon: '🚚' },
];

export default function BookingSheet({ pickup, dropoff, onFocusInput }: BookingSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['18%', '55%', '90%'], []);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [vehicle, setVehicle] = useState<LoadCapacity>('van_s');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow' | 'after_tomorrow'>('today');
  const [timeSlot, setTimeSlot] = useState<'matin' | 'après-midi' | 'soir'>('matin');
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const router = useRouter();

  const getDateLabels = () => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    const afterTomorrow = new Date(Date.now() + 172800000);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const lang = locale === 'ar' ? 'ar-TN' : 'fr-FR';
    
    return {
      today: { title: locale === 'ar' ? 'اليوم' : "Aujourd'hui", subtitle: today.toLocaleDateString(lang, options) },
      tomorrow: { title: locale === 'ar' ? 'غداً' : "Demain", subtitle: tomorrow.toLocaleDateString(lang, options) },
      after_tomorrow: { 
        title: afterTomorrow.toLocaleDateString(lang, { weekday: 'short' }).replace(/^\w/, (c) => c.toUpperCase()), 
        subtitle: afterTomorrow.toLocaleDateString(lang, options) 
      },
    };
  };

  const dateLabels = getDateLabels();

  const handleNextToStep2 = () => {
    if (pickup && dropoff) {
      setStep(2);
      bottomSheetRef.current?.snapToIndex(2);
    }
  };

  const handleNextToStep3 = () => {
    if (!description.trim()) {
      alert(t('auth.fillRequiredFieldsError'));
      return;
    }
    setStep(3);
    bottomSheetRef.current?.snapToIndex(2);
  };

  const handlePublish = async () => {
    if (!session?.user?.id || !pickup || !dropoff) return;

    setIsPublishing(true);
    try {
      let scheduledDate = new Date();
      if (selectedDate === 'tomorrow') {
        scheduledDate = new Date(Date.now() + 86400000);
      } else if (selectedDate === 'after_tomorrow') {
        scheduledDate = new Date(Date.now() + 172800000);
      }

      const { data, error } = await datasql
        .from('jobs')
        .insert({
          client_id: session.user.id,
          service_type: 'parcel' satisfies ServiceType,
          pickup_address: pickup.description,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_address: dropoff.description,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          load_capacity: vehicle,
          description,
          scheduled_at: scheduledDate.toISOString(),
          time_slot: timeSlot,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/(client)/job/${data.id}`);
    } catch (error) {
      console.error(error);
      alert(t('common.error'));
    } finally {
      setIsPublishing(false);
    }
  };

  const isRtl = locale === 'ar';

  const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <View className={`flex-row justify-center items-center mb-6 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
      {[1, 2, 3].map((s, idx) => (
        <React.Fragment key={s}>
          <View className={`w-2.5 h-2.5 rounded-full ${s <= currentStep ? 'bg-vanz-teal' : 'bg-gray-200'}`} />
          {idx < 2 && <View className={`w-8 h-0.5 mx-1 ${s < currentStep ? 'bg-vanz-teal' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={{ backgroundColor: '#ffffff', borderRadius: 32 }}
      handleIndicatorStyle={{ backgroundColor: '#e2e8f0', width: 48, height: 6 }}
    >
      <BottomSheetView className="flex-1 px-6 pb-6 pt-2">
        <Animated.View layout={Layout.springify()} className="flex-1">
          {step === 1 && (
            <Animated.View entering={FadeIn.duration(400)} className="flex-1 justify-between">
              <View>
                <Text className={`text-vanz-navy text-2xl font-black mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('client.whatToTransport')}
                </Text>

                <View className="bg-white rounded-card shadow-card border border-gray-100 p-4 mb-6">
                  {/* Pickup Button */}
                  <TouchableOpacity
                    onPress={() => onFocusInput('pickup')}
                    className={`flex-row items-center active:opacity-85 ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <View className="w-8 h-8 rounded-full bg-vanz-teal/10 items-center justify-center mr-3 ml-3">
                      <View className="w-2.5 h-2.5 rounded-full bg-vanz-teal" />
                    </View>
                    <Text className={`flex-1 text-base ${pickup ? 'text-vanz-navy font-bold' : 'text-gray-400 font-semibold'} ${isRtl ? 'text-right' : ''}`}>
                      {pickup ? pickup.description : t('createJob.pickupLabel')}
                    </Text>
                  </TouchableOpacity>

                  <View className={`w-0.5 h-8 bg-gray-100 my-1 ${isRtl ? 'mr-7' : 'ml-7'}`} />

                  {/* Dropoff Button */}
                  <TouchableOpacity
                    onPress={() => onFocusInput('dropoff')}
                    className={`flex-row items-center active:opacity-85 ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <View className="w-8 h-8 rounded-xl bg-vanz-yellow/10 items-center justify-center mr-3 ml-3">
                      <View className="w-2.5 h-2.5 rounded-sm bg-vanz-yellow" />
                    </View>
                    <Text className={`flex-1 text-base ${dropoff ? 'text-vanz-navy font-bold' : 'text-gray-400 font-semibold'} ${isRtl ? 'text-right' : ''}`}>
                      {dropoff ? dropoff.description : t('createJob.dropoffLabel')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleNextToStep2}
                disabled={!pickup || !dropoff}
                className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90"
              >
                <LinearGradient
                  colors={pickup && dropoff ? ['#38B6FF', '#2196D6'] : ['#E2E8F0', '#CBD5E1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full h-full items-center justify-center"
                >
                  <Text className={`text-xl font-extrabold ${pickup && dropoff ? 'text-white' : 'text-gray-400'}`}>
                    {t('createJob.next')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeIn.duration(400)} className="flex-1 justify-between">
              <View>
                <StepIndicator currentStep={2} />
                <View className={`flex-row items-center mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <TouchableOpacity 
                    onPress={() => setStep(1)} 
                    className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full items-center justify-center"
                  >
                    <Text className="text-vanz-navy font-bold">{isRtl ? '→' : '←'}</Text>
                  </TouchableOpacity>
                  <Text className={`text-vanz-navy text-xl font-black flex-1 ml-4 mr-4 ${isRtl ? 'text-right' : ''}`}>
                    {t('createJob.step2')}
                  </Text>
                </View>

                <Text className={`text-vanz-navy font-extrabold text-sm mb-3.5 ${isRtl ? 'text-right' : ''}`}>
                  {t('createJob.vehicleSize')}
                </Text>
                
                {/* Category Grid Selection */}
                <View className="flex-row flex-wrap justify-between gap-y-3 mb-6">
                  {VEHICLE_OPTIONS.map((option) => {
                    const isSelected = vehicle === option.key;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        onPress={() => setVehicle(option.key)}
                        className={`w-[48%] items-center p-4 rounded-2xl border-2 ${isSelected ? 'border-vanz-teal bg-vanz-teal/5' : 'border-gray-100 bg-white shadow-sm'}`}
                      >
                        <Animated.Text 
                          style={{ transform: [{ scale: isSelected ? 1.2 : 1 }] }}
                          className="text-3xl mb-2"
                        >
                          {option.icon}
                        </Animated.Text>
                        <Text className="text-sm font-extrabold text-vanz-navy capitalize text-center">{option.label}</Text>
                        <Text className="text-[10px] text-gray-400 font-semibold text-center mt-0.5">{option.capacity}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text className={`text-vanz-navy font-extrabold text-sm mb-2.5 ${isRtl ? 'text-right' : ''}`}>
                  {t('createJob.description')} *
                </Text>
                <View className="relative">
                  <TextInput
                    className={`bg-white text-vanz-navy px-5 py-4 rounded-2xl mb-6 border-2 border-gray-100 h-28 text-base shadow-sm ${isRtl ? 'text-right' : ''}`}
                    placeholder={t('createJob.descriptionPlaceholder')}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                    maxLength={200}
                  />
                  <Text className={`absolute bottom-8 text-xs font-semibold text-gray-400 ${isRtl ? 'left-4' : 'right-4'}`}>
                    {description.length}/200
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleNextToStep3} 
                disabled={!description.trim()}
                className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90"
              >
                <LinearGradient
                  colors={description.trim() ? ['#38B6FF', '#2196D6'] : ['#E2E8F0', '#CBD5E1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full h-full items-center justify-center"
                >
                  <Text className={`text-xl font-extrabold ${description.trim() ? 'text-white' : 'text-gray-400'}`}>
                    {t('createJob.next')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeIn.duration(400)} className="flex-1 justify-between">
              <View>
                <StepIndicator currentStep={3} />
                <View className={`flex-row items-center mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <TouchableOpacity 
                    onPress={() => setStep(2)} 
                    className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full items-center justify-center"
                  >
                    <Text className="text-vanz-navy font-bold">{isRtl ? '→' : '←'}</Text>
                  </TouchableOpacity>
                  <Text className={`text-vanz-navy text-xl font-black flex-1 ml-4 mr-4 ${isRtl ? 'text-right' : ''}`}>
                    {t('createJob.step3')}
                  </Text>
                </View>

                <Text className={`text-vanz-navy font-extrabold text-sm mb-3.5 ${isRtl ? 'text-right' : ''}`}>
                  {t('createJob.dateLabel')}
                </Text>
                
                {/* Date Pills Grid */}
                <View className="flex-row justify-between mb-6 gap-2.5">
                  {(['today', 'tomorrow', 'after_tomorrow'] as const).map((dateKey) => (
                    <TouchableOpacity
                      key={dateKey}
                      onPress={() => setSelectedDate(dateKey)}
                      className={`flex-1 items-center justify-center py-4 rounded-2xl border-2 ${selectedDate === dateKey ? 'border-vanz-teal bg-vanz-teal/5' : 'border-gray-100 bg-white shadow-sm'}`}
                    >
                      <Text className={`text-sm font-extrabold text-center ${selectedDate === dateKey ? 'text-vanz-teal' : 'text-vanz-navy'}`}>
                        {dateLabels[dateKey].title}
                      </Text>
                      <Text className="text-[10px] text-gray-400 font-semibold mt-1 text-center">
                        {dateLabels[dateKey].subtitle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text className={`text-vanz-navy font-extrabold text-sm mb-3.5 ${isRtl ? 'text-right' : ''}`}>
                  {t('createJob.datePlaceholder')}
                </Text>
                
                {/* Time Slots Grid */}
                <View className="flex-row justify-between mb-8 gap-2.5">
                  {(['matin', 'après-midi', 'soir'] as const).map((slotKey) => (
                    <TouchableOpacity
                      key={slotKey}
                      onPress={() => setTimeSlot(slotKey)}
                      className={`flex-1 items-center py-4 rounded-2xl border-2 ${timeSlot === slotKey ? 'border-vanz-teal bg-vanz-teal/5' : 'border-gray-100 bg-white shadow-sm'}`}
                    >
                      <Text className="text-2xl mb-1.5">{slotKey === 'matin' ? '🌅' : slotKey === 'après-midi' ? '☀️' : '🌌'}</Text>
                      <Text className={`text-xs font-extrabold capitalize text-center ${timeSlot === slotKey ? 'text-vanz-teal' : 'text-vanz-navy'}`}>
                        {slotKey}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                onPress={handlePublish} 
                disabled={isPublishing}
                className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90"
              >
                <LinearGradient
                  colors={isPublishing ? ['#38B6FF80', '#2196D680'] : ['#38B6FF', '#2196D6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full h-full items-center justify-center"
                >
                  {isPublishing ? (
                    <Text className="text-white text-xl font-extrabold opacity-70">{t('common.loading')}</Text>
                  ) : (
                    <Text className="text-white text-xl font-extrabold">{t('createJob.publish')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </BottomSheetView>
    </BottomSheet>
  );
}
