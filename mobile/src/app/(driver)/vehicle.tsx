import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import Row from '@/components/ui/Row';
import { useDriverApplication } from '@/modules/driver/hooks/useDriverApplication';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckCircle, Clock, AlertTriangle, Truck, Check, X, RefreshCw, type LucideIcon } from 'lucide-react-native';

export default function DriverVehicleScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const c = useThemeColors();
  const isRtl = locale === 'ar';

  const { data: driver = null, isLoading: loading } = useDriverApplication(session?.user?.id);

  const statusMeta = {
    approved: { bg: 'bg-vanz-green/10', text: 'text-vanz-green', label: t('vehicleScreen.statusApproved'), Icon: CheckCircle as LucideIcon, iconColor: colors.green },
    pending: { bg: 'bg-vanz-yellow/10', text: 'text-vanz-yellow-dark', label: t('vehicleScreen.statusPending'), Icon: Clock as LucideIcon, iconColor: colors.yellowDark },
    rejected: { bg: 'bg-red-50', text: 'text-red-500', label: t('vehicleScreen.statusRejected'), Icon: AlertTriangle as LucideIcon, iconColor: '#EF4444' },
  } as const;

  const vehicleTypeLabel = (id: string | null) => {
    const map: Record<string, string> = {
      van: t('driverForm.vtVan'),
      lightTruck: t('driverForm.vtLightTruck'),
      utility: t('driverForm.vtUtility'),
      sedan: t('driverForm.vtSedan'),
    };
    if (!id) return '—';
    return map[id] ?? id;
  };

  const documents = driver ? [
    { label: t('vehicleScreen.docCinFrontShort'), present: !!driver.cin_front_url },
    { label: t('vehicleScreen.docCinBackShort'), present: !!driver.cin_back_url },
    { label: t('vehicleScreen.docPermisShort'), present: !!driver.doc_permis },
    { label: t('driverForm.docCarteGrise'), present: !!driver.doc_carte_grise },
    { label: t('driverForm.docAssurance'), present: !!driver.doc_assurance },
    { label: t('driverForm.docVisite'), present: !!driver.doc_visite_technique },
    { label: t('vehicleScreen.docVehiclePhotoShort'), present: !!driver.vehicle_photo_url },
  ] : [];

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <Row className="justify-between items-center py-3 border-b border-line">
      <Text className="text-content-secondary font-semibold text-sm">{label}</Text>
      <Text className={`text-content font-black text-sm ${isRtl ? 'text-left' : 'text-right'}`}>{value || '—'}</Text>
    </Row>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-surface">
        <GradientHeader title={t('vehicleScreen.title')} backButton={() => router.back()} tall />
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.teal} size="large" /></View>
      </View>
    );
  }

  if (!driver) {
    return (
      <View className="flex-1 bg-surface">
        <GradientHeader title={t('vehicleScreen.title')} backButton={() => router.back()} tall />
        <View className="flex-1 items-center justify-center p-8">
          <View className="mb-4"><Truck size={48} color={colors.slate} strokeWidth={1.8} /></View>
          <Text className="text-content-secondary text-center font-semibold mb-8">
            {t('vehicleScreen.emptyBody')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(driver)/verify' as Href)} className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-yellow active:opacity-90">
            <LinearGradient colors={[colors.yellow, colors.yellowDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full h-full items-center justify-center">
              <Text className="text-white text-lg font-extrabold">{t('vehicleScreen.registerCta')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sm = statusMeta[driver.status || 'pending'];

  return (
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('vehicleScreen.title')} backButton={() => router.back()} tall />
      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <Animated.View entering={FadeInDown.delay(80).springify()} className={`self-start ${sm.bg} px-4 py-2 rounded-full mb-5 flex-row items-center gap-1.5`}>
          <sm.Icon size={14} color={sm.iconColor} strokeWidth={2.6} />
          <Text className={`${sm.text} font-black text-xs uppercase tracking-wider`}>{sm.label}</Text>
        </Animated.View>

        {/* Vehicle card */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View className="bg-surface-elevated rounded-card p-5 mb-5 border border-line shadow-card">
            <Text className={`text-content font-black text-base mb-2 ${isRtl ? 'text-right' : ''}`}>{t('driverForm.vehicleTitle')}</Text>
            <InfoRow label={t('vehicleScreen.type')} value={vehicleTypeLabel(driver.vehicle_type)} />
            <InfoRow label={t('vehicleScreen.brandModel')} value={`${driver.vehicle_brand || ''} ${driver.vehicle_model || ''}`.trim()} />
            <InfoRow label={t('driverForm.year')} value={driver.vehicle_year ? String(driver.vehicle_year) : '—'} />
            <InfoRow label={t('driverForm.color')} value={driver.vehicle_color || '—'} />
            <InfoRow label={t('vehicleScreen.plateShort')} value={driver.vehicle_plate || '—'} />
            <InfoRow label={t('vehicleScreen.capacityShort')} value={driver.vehicle_capacity ? `${driver.vehicle_capacity} kg` : '—'} />
          </View>
        </Animated.View>

        {/* Identity card */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <View className="bg-surface-elevated rounded-card p-5 mb-5 border border-line shadow-card">
            <Text className={`text-content font-black text-base mb-2 ${isRtl ? 'text-right' : ''}`}>{t('driverForm.identityTitle')}</Text>
            <InfoRow label={t('vehicleScreen.cinNumberShort')} value={driver.cin_number || '—'} />
            <InfoRow label={t('vehicleScreen.expiry')} value={driver.cin_expiry || '—'} />
          </View>
        </Animated.View>

        {/* Documents */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View className="bg-surface-elevated rounded-card p-5 mb-6 border border-line shadow-card">
            <Text className={`text-content font-black text-base mb-3 ${isRtl ? 'text-right' : ''}`}>{t('driverForm.documentsTitle')}</Text>
            {documents.map((d, i) => (
              <Row key={i} className={`items-center justify-between py-2.5 ${i < documents.length - 1 ? 'border-b border-line' : ''}`}>
                <Text className="text-content-secondary font-semibold text-sm">{d.label}</Text>
                <View className={`w-7 h-7 rounded-full items-center justify-center ${d.present ? 'bg-vanz-green/15' : 'bg-surface-sunken'}`}>
                  {d.present
                    ? <Check size={14} color={colors.green} strokeWidth={3} />
                    : <X size={14} color={colors.slate} strokeWidth={3} />}
                </View>
              </Row>
            ))}
          </View>
        </Animated.View>

        {/* Update docs */}
        <TouchableOpacity onPress={() => router.push('/(driver)/verify' as Href)} className="w-full h-14 rounded-2xl bg-surface-elevated border border-line shadow-card items-center justify-center flex-row gap-2 active:bg-surface-sunken">
          <RefreshCw size={16} color={c.textPrimary} strokeWidth={2.4} />
          <Text className="text-content font-extrabold">{t('vehicleScreen.updateDocs')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
