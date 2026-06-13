import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

type DriverRow = {
  status: 'pending' | 'approved' | 'rejected' | null;
  cin_number: string | null;
  cin_expiry: string | null;
  vehicle_type: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
  vehicle_capacity: number | null;
  cin_front_url: string | null;
  cin_back_url: string | null;
  vehicle_photo_url: string | null;
  doc_carte_grise: string | null;
  doc_assurance: string | null;
  doc_permis: string | null;
  doc_visite_technique: string | null;
};

export default function DriverVehicleScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { locale } = useI18n();
  const ar = locale === 'ar';
  const isRtl = ar;

  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await datasql
        .from('drivers')
        .select('status, cin_number, cin_expiry, vehicle_type, vehicle_brand, vehicle_model, vehicle_year, vehicle_color, vehicle_plate, vehicle_capacity, cin_front_url, cin_back_url, vehicle_photo_url, doc_carte_grise, doc_assurance, doc_permis, doc_visite_technique')
        .eq('id', session.user.id)
        .maybeSingle();
      setDriver((data as DriverRow) ?? null);
    } catch (e) {
      console.error('Failed to load vehicle:', e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => { load(); }, [load]);

  const statusMeta = {
    approved: { bg: 'bg-vanz-green/10', text: 'text-vanz-green', label: ar ? 'موثّق' : 'Vérifié', icon: '✓' },
    pending: { bg: 'bg-vanz-yellow/10', text: 'text-vanz-yellow-dark', label: ar ? 'قيد المراجعة' : 'En vérification', icon: '⏳' },
    rejected: { bg: 'bg-red-50', text: 'text-red-500', label: ar ? 'مرفوض' : 'Refusé', icon: '⚠️' },
  } as const;

  const vehicleTypeLabel = (id: string | null) => {
    const map: Record<string, { fr: string; ar: string }> = {
      van: { fr: 'Camionnette', ar: 'شاحنة صغيرة' },
      lightTruck: { fr: 'Camion léger', ar: 'شاحنة خفيفة' },
      utility: { fr: 'Utilitaire', ar: 'نفعية' },
      sedan: { fr: 'Berline', ar: 'سيارة' },
    };
    if (!id) return '—';
    const m = map[id];
    return m ? (ar ? m.ar : m.fr) : id;
  };

  const documents = driver ? [
    { label: ar ? 'بطاقة التعريف (أمامي)' : 'CIN Recto', present: !!driver.cin_front_url },
    { label: ar ? 'بطاقة التعريف (خلفي)' : 'CIN Verso', present: !!driver.cin_back_url },
    { label: ar ? 'رخصة السياقة' : 'Permis', present: !!driver.doc_permis },
    { label: ar ? 'البطاقة الرمادية' : 'Carte grise', present: !!driver.doc_carte_grise },
    { label: ar ? 'التأمين' : 'Assurance', present: !!driver.doc_assurance },
    { label: ar ? 'الفحص الفني' : 'Visite technique', present: !!driver.doc_visite_technique },
    { label: ar ? 'صورة المركبة' : 'Photo véhicule', present: !!driver.vehicle_photo_url },
  ] : [];

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View className={`flex-row justify-between items-center py-3 border-b border-gray-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
      <Text className="text-vanz-navy/50 font-semibold text-sm">{label}</Text>
      <Text className={`text-vanz-navy font-black text-sm ${isRtl ? 'text-left' : 'text-right'}`}>{value || '—'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-vanz-iceblue">
        <GradientHeader title={ar ? 'مركبتي' : 'Mon Véhicule'} backButton={() => router.back()} tall />
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#38B6FF" size="large" /></View>
      </View>
    );
  }

  if (!driver) {
    return (
      <View className="flex-1 bg-vanz-iceblue">
        <GradientHeader title={ar ? 'مركبتي' : 'Mon Véhicule'} backButton={() => router.back()} tall />
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">🚚</Text>
          <Text className="text-vanz-navy/60 text-center font-semibold mb-8">
            {ar ? 'لم تقم بتسجيل مركبتك بعد.' : "Vous n'avez pas encore enregistré votre véhicule."}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(driver)/verify' as Href)} className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-yellow active:opacity-90">
            <LinearGradient colors={['#F5C800', '#D4AD00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full h-full items-center justify-center">
              <Text className="text-white text-lg font-extrabold">{ar ? 'تسجيل المركبة' : 'Enregistrer mon véhicule'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sm = statusMeta[driver.status || 'pending'];

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={ar ? 'مركبتي' : 'Mon Véhicule'} backButton={() => router.back()} tall />
      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <Animated.View entering={FadeInDown.delay(80).springify()} className={`self-start ${sm.bg} px-4 py-2 rounded-full mb-5 flex-row items-center`}>
          <Text className="mr-1.5 ml-1.5">{sm.icon}</Text>
          <Text className={`${sm.text} font-black text-xs uppercase tracking-wider`}>{sm.label}</Text>
        </Animated.View>

        {/* Vehicle card */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View className="bg-white rounded-card p-5 mb-5 border border-gray-100 shadow-card">
            <Text className={`text-vanz-navy font-black text-base mb-2 ${isRtl ? 'text-right' : ''}`}>{ar ? 'المركبة' : 'Véhicule'}</Text>
            <Row label={ar ? 'النوع' : 'Type'} value={vehicleTypeLabel(driver.vehicle_type)} />
            <Row label={ar ? 'الماركة والطراز' : 'Marque & Modèle'} value={`${driver.vehicle_brand || ''} ${driver.vehicle_model || ''}`.trim()} />
            <Row label={ar ? 'السنة' : 'Année'} value={driver.vehicle_year ? String(driver.vehicle_year) : '—'} />
            <Row label={ar ? 'اللون' : 'Couleur'} value={driver.vehicle_color || '—'} />
            <Row label={ar ? 'اللوحة' : 'Plaque'} value={driver.vehicle_plate || '—'} />
            <Row label={ar ? 'الحمولة' : 'Capacité'} value={driver.vehicle_capacity ? `${driver.vehicle_capacity} kg` : '—'} />
          </View>
        </Animated.View>

        {/* Identity card */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <View className="bg-white rounded-card p-5 mb-5 border border-gray-100 shadow-card">
            <Text className={`text-vanz-navy font-black text-base mb-2 ${isRtl ? 'text-right' : ''}`}>{ar ? 'الهوية' : 'Identité'}</Text>
            <Row label={ar ? 'رقم البطاقة' : 'N° CIN'} value={driver.cin_number || '—'} />
            <Row label={ar ? 'انتهاء الصلاحية' : 'Expiration'} value={driver.cin_expiry || '—'} />
          </View>
        </Animated.View>

        {/* Documents */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View className="bg-white rounded-card p-5 mb-6 border border-gray-100 shadow-card">
            <Text className={`text-vanz-navy font-black text-base mb-3 ${isRtl ? 'text-right' : ''}`}>{ar ? 'المستندات' : 'Documents'}</Text>
            {documents.map((d, i) => (
              <View key={i} className={`flex-row items-center justify-between py-2.5 ${i < documents.length - 1 ? 'border-b border-gray-50' : ''} ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-vanz-navy/70 font-semibold text-sm">{d.label}</Text>
                <View className={`w-7 h-7 rounded-full items-center justify-center ${d.present ? 'bg-vanz-green/15' : 'bg-gray-100'}`}>
                  <Text className={d.present ? 'text-vanz-green' : 'text-gray-400'}>{d.present ? '✓' : '—'}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Update docs */}
        <TouchableOpacity onPress={() => router.push('/(driver)/verify' as Href)} className="w-full h-14 rounded-2xl bg-white border border-gray-100 shadow-card items-center justify-center flex-row active:bg-gray-50">
          <Text className="text-base mr-2 ml-2">🔄</Text>
          <Text className="text-vanz-navy font-extrabold">{ar ? 'تحديث المستندات' : 'Mettre à jour mes documents'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
