import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { datasql } from '@/lib/supabase';
import { authApiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import Row from '@/components/ui/Row';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, Layout, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import {
  Truck, Car, CarFront, Bus, CreditCard, FileText, ShieldCheck, Wrench, Camera,
  Image as ImageIcon, Check, type LucideIcon,
} from 'lucide-react-native';

type DocType = 'cinFront' | 'cinBack' | 'permis' | 'carteGrise' | 'assurance' | 'visite' | 'vehiclePhoto';

interface DocItem {
  key: DocType;
  label: string;
  description: string;
  Icon: LucideIcon;
  required: boolean;
}

const CITIES = ['Tunis', 'Sousse', 'Sfax', 'Bizerte', 'Ariana', 'Ben Arous', 'Nabeul', 'Monastir'];

type VehicleTypeId = 'van' | 'lightTruck' | 'utility' | 'sedan';

// Tunisian plate format: 123 TN 4567 (also accepts arabic تونس)
const PLATE_REGEX = /^[0-9]{1,3}\s?(TN|TUNIS|تونس)\s?[0-9]{1,4}$/i;

/** Returns age in full years for a YYYY-MM-DD string, or NaN if invalid. */
function ageFromDob(dob: string): number {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return NaN;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

/** Local YYYY-MM-DD (avoids the UTC shift of toISOString). */
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * The driver application/onboarding form (identity → vehicle → documents).
 * Submits to `/api/drivers/signup`, which creates a `drivers` row with
 * status='pending' for admin review — the applicant gets NO driver access until
 * an admin approves. `onDone` decides where to go after a successful submit
 * (driver dashboard when an existing driver updates docs, client home when a
 * client submits a new demande).
 */
export default function DriverApplicationForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const c = useThemeColors();
  const isRtl = locale === 'ar';

  const meta = (session?.user?.user_metadata ?? {}) as { full_name?: string; phone?: string };
  const fullName = meta.full_name || '';
  const [presetFirst, ...presetRest] = fullName.split(' ');

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Identity
  const [firstName, setFirstName] = useState(presetFirst || '');
  const [lastName, setLastName] = useState(presetRest.join(' ') || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [phone, setPhone] = useState((session?.user?.phone || meta.phone || '').replace('+216', ''));
  const [city, setCity] = useState('');
  const [cin, setCin] = useState('');
  const [dob, setDob] = useState('');
  const [cinExpiry, setCinExpiry] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  // Vehicle
  const [vehicleType, setVehicleType] = useState<VehicleTypeId | ''>('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState('');

  // Documents (local URIs until submit)
  const [uploads, setUploads] = useState<Record<DocType, string | null>>({
    cinFront: null, cinBack: null, permis: null, carteGrise: null, assurance: null, visite: null, vehiclePhoto: null,
  });
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null);

  const vehicleTypes: { id: VehicleTypeId; label: string; Icon: LucideIcon }[] = [
    { id: 'van', label: t('driverForm.vtVan'), Icon: Bus },
    { id: 'lightTruck', label: t('driverForm.vtLightTruck'), Icon: Truck },
    { id: 'utility', label: t('driverForm.vtUtility'), Icon: Car },
    { id: 'sedan', label: t('driverForm.vtSedan'), Icon: CarFront },
  ];

  const documents: DocItem[] = [
    { key: 'cinFront', label: t('driverForm.docCinFront'), description: t('driverForm.docCinFrontDesc'), Icon: CreditCard, required: true },
    { key: 'cinBack', label: t('driverForm.docCinBack'), description: t('driverForm.docCinBackDesc'), Icon: CreditCard, required: true },
    { key: 'permis', label: t('driverForm.docPermis'), description: t('driverForm.docPermisDesc'), Icon: Car, required: true },
    { key: 'carteGrise', label: t('driverForm.docCarteGrise'), description: t('driverForm.docCarteGriseDesc'), Icon: FileText, required: true },
    { key: 'assurance', label: t('driverForm.docAssurance'), description: t('driverForm.docAssuranceDesc'), Icon: ShieldCheck, required: true },
    { key: 'visite', label: t('driverForm.docVisite'), description: t('driverForm.optional'), Icon: Wrench, required: false },
    { key: 'vehiclePhoto', label: t('driverForm.docVehiclePhoto'), description: t('driverForm.optional'), Icon: Camera, required: false },
  ];

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    if (!activeDoc) return;
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('driverForm.permTitle'), t('driverForm.permCamera'));
          return;
        }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
      }
      if (!result.canceled && result.assets[0]) {
        setUploads(prev => ({ ...prev, [activeDoc]: result.assets[0].uri }));
      }
    } catch (e) {
      console.error('Image pick failed:', e);
    } finally {
      setActiveDoc(null);
    }
  };

  /** Upload a local image URI to the driver-documents bucket; returns the storage path. */
  const uploadDoc = async (uri: string, key: DocType): Promise<string> => {
    const userId = session!.user.id;
    const blob = await (await fetch(uri)).blob();
    const filePath = `${userId}/${key}_${Date.now()}.jpg`;
    const { data, error } = await datasql.storage
      .from('driver-documents')
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    return data.path;
  };

  const validateIdentity = (): string | null => {
    if (!firstName.trim() || !lastName.trim() || !city || !cin || !dob || !cinExpiry) {
      return t('driverForm.fillRequired');
    }
    if (!/^\d{8}$/.test(cin)) return t('driverForm.cinDigits');
    if (!isValidDate(dob)) return t('driverForm.dobInvalid');
    if (ageFromDob(dob) < 18) return t('driverForm.ageMin');
    if (!isValidDate(cinExpiry)) return t('driverForm.expiryInvalid');
    if (new Date(cinExpiry) <= new Date()) return t('driverForm.cinExpired');
    if (phone && !/^[2459]\d{7}$/.test(phone.replace(/\D/g, ''))) return t('driverForm.phoneInvalid');
    return null;
  };

  const validateVehicle = (): string | null => {
    if (!vehicleType || !brand.trim() || !model.trim() || !year || !plate.trim() || !capacity) {
      return t('driverForm.fillRequired');
    }
    const y = parseInt(year, 10);
    if (isNaN(y) || y < 1990 || y > new Date().getFullYear() + 1) return t('driverForm.yearInvalid');
    if (!PLATE_REGEX.test(plate.trim())) return t('driverForm.plateInvalid');
    if (isNaN(parseFloat(capacity))) return t('driverForm.capacityInvalid');
    return null;
  };

  const goNext = () => {
    const err = step === 1 ? validateIdentity() : step === 2 ? validateVehicle() : null;
    if (err) { Alert.alert(t('common.error'), err); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!session?.user?.id) return;
    const missing = documents.filter(d => d.required && !uploads[d.key]);
    if (missing.length > 0) {
      Alert.alert(t('driverForm.missingDocsTitle'), t('driverForm.missingDocsBody'));
      return;
    }

    setSubmitting(true);
    try {
      // Upload every captured image, keyed by doc type → storage path.
      const paths = {} as Record<DocType, string | null>;
      for (const doc of documents) {
        const uri = uploads[doc.key];
        paths[doc.key] = uri ? await uploadDoc(uri, doc.key) : null;
      }

      const res = await authApiFetch('/api/drivers/signup', {
        method: 'POST',
        body: JSON.stringify({
          userId: session.user.id,
          firstName, lastName, email,
          phone: phone ? `+216${phone.replace(/\D/g, '')}` : null,
          city,
          cin, dob, cinExpiry,
          vehicleType, brand, model, year, color, plate: plate.trim().toUpperCase(), capacity,
          cinFrontUrl: paths.cinFront,
          cinBackUrl: paths.cinBack,
          docPermis: paths.permis,
          docCarteGrise: paths.carteGrise,
          docAssurance: paths.assurance,
          docVisite: paths.visite,
          docVehicle: paths.vehiclePhoto,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || t('driverForm.submitFailed'));
      }

      Alert.alert(
        t('driverForm.sentTitle'),
        t('driverForm.sentBody'),
        [{ text: 'OK', onPress: onDone }]
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert(t('common.error'), message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `bg-surface-elevated rounded-2xl border-2 border-line px-4 h-14 text-base text-content ${isRtl ? 'text-right' : ''}`;
  const labelClass = `text-content font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`;

  return (
    <View className="flex-1 bg-surface">
      <GradientHeader
        title={t('client.becomeDriver')}
        subtitle={t('createJob.stepProgress', { step })}
        backButton={() => (step > 1 ? setStep(s => s - 1) : router.back())}
        tall
      />

      {/* Step progress */}
      <View className="px-6 -mt-4 z-10">
        <View className="bg-surface-elevated p-4 rounded-2xl shadow-card border border-line">
          <View className="w-full h-2 bg-surface-sunken rounded-full overflow-hidden">
            <Animated.View layout={Layout.springify()} className="h-full bg-vanz-teal rounded-full" style={{ width: `${(step / 3) * 100}%` }} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {step === 1 && (
            <Animated.View entering={FadeInDown.springify()} className="gap-4">
              <Text className="text-content text-xl font-black mb-1">{t('driverForm.identityTitle')}</Text>
              <View>
                <Text className={labelClass}>{t('driverForm.firstName')} *</Text>
                <TextInput className={inputClass} value={firstName} onChangeText={setFirstName} placeholder={t('driverForm.firstName')} placeholderTextColor={colors.placeholder} />
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.lastName')} *</Text>
                <TextInput className={inputClass} value={lastName} onChangeText={setLastName} placeholder={t('driverForm.lastName')} placeholderTextColor={colors.placeholder} />
              </View>
              <View>
                <Text className={labelClass}>Email</Text>
                <TextInput className={inputClass} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="email@example.com" placeholderTextColor={colors.placeholder} />
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.phone')}</Text>
                <Row className="items-center bg-surface-elevated rounded-2xl border-2 border-line px-4 h-14">
                  <Text className="text-content font-bold">+216</Text>
                  <View className="h-7 w-px bg-surface-sunken mx-3" />
                  <TextInput className={`flex-1 text-base text-content ${isRtl ? 'text-right' : ''}`} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={8} placeholder="XX XXX XXX" placeholderTextColor={colors.placeholder} />
                </Row>
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.city')} *</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CITIES.map(c => (
                    <TouchableOpacity key={c} onPress={() => setCity(c)} className={`px-4 py-2.5 rounded-xl border-2 ${city === c ? 'bg-vanz-teal/10 border-vanz-teal' : 'bg-surface-elevated border-line'}`}>
                      <Text className={`font-bold text-sm ${city === c ? 'text-vanz-teal' : 'text-content-secondary'}`}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.cinNumber')} *</Text>
                <TextInput className={inputClass} value={cin} onChangeText={v => setCin(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={8} placeholder="12345678" placeholderTextColor={colors.placeholder} />
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.dob')} *</Text>
                <TouchableOpacity onPress={() => setShowDobPicker(true)} className={`bg-surface-elevated rounded-2xl border-2 border-line px-4 h-14 flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className={`text-base ${dob ? 'text-content' : 'text-content-muted'}`}>{dob || 'AAAA-MM-JJ'}</Text>
                </TouchableOpacity>
                {showDobPicker && (
                  <DateTimePicker
                    value={dob ? new Date(dob) : new Date(2000, 0, 1)}
                    mode="date"
                    maximumDate={new Date()}
                    onChange={(event, d) => { setShowDobPicker(false); if (event.type === 'set' && d) setDob(fmtDate(d)); }}
                  />
                )}
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.cinExpiry')} *</Text>
                <TouchableOpacity onPress={() => setShowExpiryPicker(true)} className={`bg-surface-elevated rounded-2xl border-2 border-line px-4 h-14 flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className={`text-base ${cinExpiry ? 'text-content' : 'text-content-muted'}`}>{cinExpiry || 'AAAA-MM-JJ'}</Text>
                </TouchableOpacity>
                {showExpiryPicker && (
                  <DateTimePicker
                    value={cinExpiry ? new Date(cinExpiry) : new Date()}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(event, d) => { setShowExpiryPicker(false); if (event.type === 'set' && d) setCinExpiry(fmtDate(d)); }}
                  />
                )}
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInDown.springify()} className="gap-4">
              <Text className="text-content text-xl font-black mb-1">{t('driverForm.vehicleTitle')}</Text>
              <View>
                <Text className={labelClass}>{t('driverForm.vehicleType')} *</Text>
                <View className="flex-row flex-wrap gap-3">
                  {vehicleTypes.map(vt => (
                    <TouchableOpacity key={vt.id} onPress={() => setVehicleType(vt.id)} className={`flex-1 min-w-[45%] p-4 rounded-2xl border-2 items-center ${vehicleType === vt.id ? 'bg-vanz-teal/10 border-vanz-teal' : 'bg-surface-elevated border-line'}`}>
                      <View className="mb-1"><vt.Icon size={26} color={vehicleType === vt.id ? colors.teal : colors.muted} strokeWidth={2} /></View>
                      <Text className={`font-bold text-sm ${vehicleType === vt.id ? 'text-vanz-teal' : 'text-content-secondary'}`}>{vt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.brand')} *</Text>
                <TextInput className={inputClass} value={brand} onChangeText={setBrand} placeholder="Renault" placeholderTextColor={colors.placeholder} />
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.model')} *</Text>
                <TextInput className={inputClass} value={model} onChangeText={setModel} placeholder="Kangoo" placeholderTextColor={colors.placeholder} />
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.year')} *</Text>
                <TextInput className={inputClass} value={year} onChangeText={v => setYear(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} placeholder="2018" placeholderTextColor={colors.placeholder} />
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.color')}</Text>
                <TextInput className={inputClass} value={color} onChangeText={setColor} placeholder={t('driverForm.colorPlaceholder')} placeholderTextColor={colors.placeholder} />
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.plate')} *</Text>
                <TextInput className={`${inputClass} uppercase`} value={plate} onChangeText={setPlate} autoCapitalize="characters" placeholder="123 TN 4567" placeholderTextColor={colors.placeholder} />
              </View>
              <View>
                <Text className={labelClass}>{t('driverForm.capacity')} *</Text>
                <TextInput className={inputClass} value={capacity} onChangeText={v => setCapacity(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="800" placeholderTextColor={colors.placeholder} />
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeInDown.springify()}>
              <Text className="text-content text-xl font-black mb-1">{t('driverForm.documentsTitle')}</Text>
              <Text className="text-content-secondary text-sm font-semibold mb-4">{t('driverForm.documentsSubtitle')}</Text>
              {documents.map((doc, index) => {
                const isUploaded = !!uploads[doc.key];
                return (
                  <Animated.View key={doc.key} entering={FadeInDown.delay(50 + index * 40).springify()}>
                    <PressableCard onPress={() => setActiveDoc(doc.key)} className={`mb-4 overflow-hidden border-2 ${isUploaded ? 'border-vanz-green/30 bg-vanz-green/5' : 'border-transparent bg-surface-elevated'}`}>
                      <Row className="p-4 items-center justify-between">
                        <Row className="items-center flex-1">
                          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ml-4 ${isUploaded ? 'bg-vanz-green/20' : 'bg-surface-sunken'}`}>
                            <doc.Icon size={24} color={isUploaded ? colors.green : colors.muted} strokeWidth={2.2} />
                          </View>
                          <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                            <Text className={`font-extrabold text-base mb-0.5 ${isUploaded ? 'text-vanz-green' : 'text-content'} ${isRtl ? 'text-right' : ''}`}>
                              {doc.label}{doc.required ? '' : ` (${t('driverForm.optionalShort')})`}
                            </Text>
                            <Text className={`text-content-secondary text-xs font-semibold ${isRtl ? 'text-right' : ''}`}>{doc.description}</Text>
                          </View>
                        </Row>
                        {isUploaded ? (
                          <Animated.View entering={FadeIn.springify()} className="w-8 h-8 rounded-full bg-vanz-green items-center justify-center shadow-glow-green">
                            <Check size={16} color={colors.white} strokeWidth={3} />
                          </Animated.View>
                        ) : (
                          <View className="w-8 h-8 rounded-full bg-surface-sunken border border-line-strong items-center justify-center">
                            <Camera size={15} color={colors.slate} strokeWidth={2.2} />
                          </View>
                        )}
                      </Row>
                    </PressableCard>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom action button */}
      <View className="absolute bottom-0 w-full p-5 bg-card-glass border-t border-white/50 pb-8 shadow-elevated">
        <TouchableOpacity
          onPress={step < 3 ? goNext : handleSubmit}
          disabled={submitting}
          className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90"
        >
          <LinearGradient
            colors={submitting ? ['#E2E8F0', '#CBD5E1'] : [colors.teal, colors.tealDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full h-full items-center justify-center flex-row"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-xl font-extrabold text-white">
                {step < 3 ? t('driverForm.continue') : t('driverForm.submit')}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Image source action sheet */}
      {activeDoc && (
        <>
          <TouchableOpacity activeOpacity={1} onPress={() => setActiveDoc(null)} className="absolute inset-0 bg-inverted/40" />
          <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} className="absolute bottom-0 w-full bg-surface-elevated rounded-t-[32px] p-6 pb-12 shadow-elevated">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
            <Text className="text-content text-xl font-black mb-6 text-center">{t('driverForm.chooseSource')}</Text>
            <View className="gap-3">
              <TouchableOpacity onPress={() => handlePickImage('camera')} className="w-full h-16 bg-vanz-teal/10 rounded-2xl flex-row items-center justify-center gap-3 border border-vanz-teal/20 active:bg-vanz-teal/20">
                <Camera size={20} color={colors.teal} strokeWidth={2.2} />
                <Text className="text-vanz-teal text-lg font-extrabold">{t('driverForm.takePhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePickImage('gallery')} className="w-full h-16 bg-surface-sunken rounded-2xl flex-row items-center justify-center gap-3 border border-line active:bg-surface-sunken">
                <ImageIcon size={20} color={c.textPrimary} strokeWidth={2.2} />
                <Text className="text-content text-lg font-bold">{t('driverForm.fromGallery')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}
