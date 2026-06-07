import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, Layout, SlideInDown, SlideOutDown } from 'react-native-reanimated';

type DocType = 'cin_front' | 'cin_back' | 'license' | 'vehicle_reg' | 'vehicle_photo';

interface DocItem {
  key: DocType;
  label: string;
  description: string;
  icon: string;
}

export default function DriverVerifyScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [uploads, setUploads] = useState<Record<DocType, string | null>>({
    cin_front: null,
    cin_back: null,
    license: null,
    vehicle_reg: null,
    vehicle_photo: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null);

  const isRtl = locale === 'ar';

  const documents: DocItem[] = [
    { 
      key: 'cin_front', 
      label: locale === 'ar' ? 'بطاقة التعريف - الوجه الأول' : 'CIN - Recto', 
      description: locale === 'ar' ? 'بطاقة التعريف الوطنية (الجهة الأمامية)' : 'Carte d\'identité nationale (face avant)',
      icon: '🪪'
    },
    { 
      key: 'cin_back', 
      label: locale === 'ar' ? 'بطاقة التعريف - الوجه الثاني' : 'CIN - Verso', 
      description: locale === 'ar' ? 'بطاقة التعريف الوطنية (الجهة الخلفية)' : 'Carte d\'identité nationale (face arrière)',
      icon: '🪪'
    },
    { 
      key: 'license', 
      label: locale === 'ar' ? 'رخصة السياقة' : 'Permis de conduire', 
      description: locale === 'ar' ? 'رخصة سياقة صالحة' : 'Permis de conduire valide',
      icon: '🚗'
    },
    { 
      key: 'vehicle_reg', 
      label: locale === 'ar' ? 'البطاقة الرمادية' : 'Carte grise', 
      description: locale === 'ar' ? 'البطاقة الرمادية للمركبة' : 'Carte grise du véhicule',
      icon: '📄'
    },
    { 
      key: 'vehicle_photo', 
      label: locale === 'ar' ? 'صورة المركبة' : 'Photo du véhicule', 
      description: locale === 'ar' ? 'صورة خارجية لمركبتك' : 'Vue extérieure de votre véhicule',
      icon: '📸'
    },
  ];

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    if (!activeDoc) return;

    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            locale === 'ar' ? 'الصلاحية مطلوبة' : 'Permission requise', 
            locale === 'ar' ? 'يرجى السماح بالوصول إلى الكاميرا لمسح مستنداتك.' : 'Veuillez autoriser l\'accès à la caméra pour scanner vos documents.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setUploads(prev => ({ ...prev, [activeDoc]: result.assets[0].uri }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveDoc(null);
    }
  };

  const allUploaded = Object.values(uploads).every(v => v !== null);
  const uploadCount = Object.values(uploads).filter(v => v !== null).length;
  const progressPercent = (uploadCount / documents.length) * 100;

  const handleSubmit = async () => {
    if (!allUploaded) {
      Alert.alert(
        locale === 'ar' ? 'المستندات ناقصة' : 'Documents manquants', 
        locale === 'ar' ? 'يرجى مسح جميع المستندات المطلوبة.' : 'Veuillez scanner tous les documents requis.'
      );
      return;
    }

    setSubmitting(true);
    try {
      // Mock upload delay
      await new Promise(r => setTimeout(r, 1500));
      Alert.alert(
        locale === 'ar' ? 'تم إرسال المستندات!' : 'Documents envoyés !',
        locale === 'ar' 
          ? 'مستنداتك قيد المراجعة حالياً. ستتلقى إشعاراً فور انتهاء العملية.' 
          : 'Vos documents sont en cours de vérification. Vous serez notifié une fois le processus terminé.',
        [{ text: locale === 'ar' ? 'حسناً' : 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader 
        title={locale === 'ar' ? 'التحقق من الحساب' : 'Vérification'} 
        subtitle={locale === 'ar' ? 'قم بمسح مستنداتك لتفعيل حسابك' : 'Scannez vos documents pour activer votre compte'}
        backButton={() => router.back()} 
        tall
      />

      {/* Progress Bar Header */}
      <View className="px-6 -mt-4 z-10">
        <View className="bg-white p-4 rounded-2xl shadow-card border border-gray-100">
          <View className={`flex-row justify-between items-end mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Text className="text-vanz-navy font-black text-sm uppercase tracking-wider">
              {locale === 'ar' ? 'التقدم' : 'Progression'}
            </Text>
            <Text className="text-vanz-teal font-black text-lg">{uploadCount}/{documents.length}</Text>
          </View>
          <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <Animated.View 
              layout={Layout.springify()}
              className="h-full bg-vanz-teal rounded-full" 
              style={{ width: `${progressPercent}%` }} 
            />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {documents.map((doc, index) => {
          const isUploaded = !!uploads[doc.key];
          return (
            <Animated.View key={doc.key} entering={FadeInDown.delay(100 + index * 50).springify()}>
              <PressableCard
                onPress={() => setActiveDoc(doc.key)}
                className={`mb-4 overflow-hidden border-2 ${
                  isUploaded ? 'border-vanz-green/30 bg-vanz-green/5' : 'border-transparent bg-white'
                }`}
              >
                <View className={`p-4 flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className={`flex-row items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ml-4 ${
                      isUploaded ? 'bg-vanz-green/20' : 'bg-gray-50'
                    }`}>
                      <Text className="text-2xl">{doc.icon}</Text>
                    </View>
                    <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                      <Text className={`font-extrabold text-base mb-0.5 ${isUploaded ? 'text-vanz-green' : 'text-vanz-navy'} ${isRtl ? 'text-right' : ''}`}>
                        {doc.label}
                      </Text>
                      <Text className={`text-vanz-navy/60 text-xs font-semibold ${isRtl ? 'text-right' : ''}`}>
                        {doc.description}
                      </Text>
                    </View>
                  </View>
                  
                  {isUploaded ? (
                    <Animated.View entering={FadeIn.springify()} className="w-8 h-8 rounded-full bg-vanz-green items-center justify-center shadow-glow-green">
                      <Text className="text-white text-sm">✓</Text>
                    </Animated.View>
                  ) : (
                    <View className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 items-center justify-center">
                      <Text className="text-gray-400">📷</Text>
                    </View>
                  )}
                </View>
              </PressableCard>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Submit Button */}
      <View className="absolute bottom-0 w-full p-5 bg-card-glass border-t border-white/50 pb-8 shadow-elevated">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!allUploaded || submitting}
          className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90"
        >
          <LinearGradient
            colors={!allUploaded || submitting ? ['#E2E8F0', '#CBD5E1'] : ['#38B6FF', '#2196D6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full h-full items-center justify-center flex-row"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`text-xl font-extrabold ${!allUploaded ? 'text-gray-400' : 'text-white'}`}>
                {locale === 'ar' ? 'إرسال المستندات' : 'Soumettre les documents'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Upload Action Sheet */}
      {activeDoc && (
        <>
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => setActiveDoc(null)}
            className="absolute inset-0 bg-vanz-navy/40"
          />
          <Animated.View 
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown}
            className="absolute bottom-0 w-full bg-white rounded-t-[32px] p-6 pb-12 shadow-elevated"
          >
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
            <Text className="text-vanz-navy text-xl font-black mb-6 text-center">
              {locale === 'ar' ? 'اختر المصدر' : 'Choisir une source'}
            </Text>
            
            <View className="gap-3">
              <TouchableOpacity 
                onPress={() => handlePickImage('camera')}
                className={`w-full h-16 bg-vanz-teal/10 rounded-2xl flex-row items-center justify-center border border-vanz-teal/20 active:bg-vanz-teal/20 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <Text className="text-xl mr-3 ml-3">📸</Text>
                <Text className="text-vanz-teal text-lg font-extrabold">{locale === 'ar' ? 'التقاط صورة' : 'Prendre une photo'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handlePickImage('gallery')}
                className={`w-full h-16 bg-gray-50 rounded-2xl flex-row items-center justify-center border border-gray-100 active:bg-gray-100 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <Text className="text-xl mr-3 ml-3">🖼️</Text>
                <Text className="text-vanz-navy text-lg font-bold">{locale === 'ar' ? 'اختيار من المعرض' : 'Choisir dans la galerie'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}
