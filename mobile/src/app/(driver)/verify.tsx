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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, Layout, SlideInDown, SlideOutDown } from 'react-native-reanimated';

type DocType = 'cinFront' | 'cinBack' | 'permis' | 'carteGrise' | 'assurance' | 'visite' | 'vehiclePhoto';

interface DocItem {
  key: DocType;
  label: string;
  description: string;
  icon: string;
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

export default function DriverOnboardingScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';
  const ar = locale === 'ar';

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

  const vehicleTypes: { id: VehicleTypeId; label: string; icon: string }[] = [
    { id: 'van', label: ar ? 'شاحنة صغيرة' : 'Camionnette', icon: '🚐' },
    { id: 'lightTruck', label: ar ? 'شاحنة خفيفة' : 'Camion léger', icon: '🚚' },
    { id: 'utility', label: ar ? 'نفعية' : 'Utilitaire', icon: '🚙' },
    { id: 'sedan', label: ar ? 'سيارة' : 'Berline', icon: '🚗' },
  ];

  const documents: DocItem[] = [
    { key: 'cinFront', label: ar ? 'بطاقة التعريف - الوجه الأمامي' : 'CIN - Recto', description: ar ? 'الجهة الأمامية' : 'Face avant', icon: '🪪', required: true },
    { key: 'cinBack', label: ar ? 'بطاقة التعريف - الوجه الخلفي' : 'CIN - Verso', description: ar ? 'الجهة الخلفية' : 'Face arrière', icon: '🪪', required: true },
    { key: 'permis', label: ar ? 'رخصة السياقة' : 'Permis de conduire', description: ar ? 'رخصة صالحة' : 'Permis valide', icon: '🚗', required: true },
    { key: 'carteGrise', label: ar ? 'البطاقة الرمادية' : 'Carte grise', description: ar ? 'بطاقة المركبة' : 'Du véhicule', icon: '📄', required: true },
    { key: 'assurance', label: ar ? 'التأمين' : 'Assurance', description: ar ? 'تأمين ساري المفعول' : 'Police valide', icon: '🛡️', required: true },
    { key: 'visite', label: ar ? 'الفحص الفني' : 'Visite technique', description: ar ? 'اختياري' : 'Optionnel', icon: '🔧', required: false },
    { key: 'vehiclePhoto', label: ar ? 'صورة المركبة' : 'Photo du véhicule', description: ar ? 'اختياري' : 'Optionnel', icon: '📸', required: false },
  ];

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    if (!activeDoc) return;
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(ar ? 'الصلاحية مطلوبة' : 'Permission requise', ar ? 'يرجى السماح بالوصول إلى الكاميرا.' : 'Veuillez autoriser la caméra.');
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
      return ar ? 'يرجى ملء جميع الحقول الإلزامية.' : 'Veuillez remplir tous les champs obligatoires.';
    }
    if (!/^\d{8}$/.test(cin)) return ar ? 'رقم بطاقة التعريف يجب أن يكون 8 أرقام.' : 'Le CIN doit comporter 8 chiffres.';
    if (!isValidDate(dob)) return ar ? 'تاريخ ميلاد غير صحيح (YYYY-MM-DD).' : 'Date de naissance invalide (AAAA-MM-JJ).';
    if (ageFromDob(dob) < 18) return ar ? 'يجب أن يكون عمرك 18 سنة على الأقل.' : 'Vous devez avoir au moins 18 ans.';
    if (!isValidDate(cinExpiry)) return ar ? 'تاريخ انتهاء غير صحيح (YYYY-MM-DD).' : "Date d'expiration invalide (AAAA-MM-JJ).";
    if (new Date(cinExpiry) <= new Date()) return ar ? 'بطاقة التعريف منتهية الصلاحية.' : 'La CIN est expirée.';
    if (phone && !/^[2459]\d{7}$/.test(phone.replace(/\D/g, ''))) return ar ? 'رقم هاتف غير صحيح.' : 'Numéro de téléphone invalide.';
    return null;
  };

  const validateVehicle = (): string | null => {
    if (!vehicleType || !brand.trim() || !model.trim() || !year || !plate.trim() || !capacity) {
      return ar ? 'يرجى ملء جميع الحقول الإلزامية.' : 'Veuillez remplir tous les champs obligatoires.';
    }
    const y = parseInt(year, 10);
    if (isNaN(y) || y < 1990 || y > new Date().getFullYear() + 1) return ar ? 'سنة غير صحيحة.' : 'Année invalide.';
    if (!PLATE_REGEX.test(plate.trim())) return ar ? 'صيغة اللوحة غير صحيحة (مثال: 123 TN 4567).' : 'Plaque invalide (ex: 123 TN 4567).';
    if (isNaN(parseFloat(capacity))) return ar ? 'حمولة غير صحيحة.' : 'Capacité invalide.';
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
      Alert.alert(ar ? 'مستندات ناقصة' : 'Documents manquants', ar ? 'يرجى مسح جميع المستندات المطلوبة.' : 'Veuillez scanner tous les documents requis.');
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
        throw new Error(payload.error || (ar ? 'تعذر إرسال الطلب.' : "Échec de l'envoi."));
      }

      Alert.alert(
        ar ? 'تم إرسال المستندات!' : 'Documents envoyés !',
        ar ? 'حسابك قيد المراجعة. ستتلقى إشعاراً عند الموافقة.' : 'Votre compte est en cours de vérification. Vous serez notifié dès validation.',
        [{ text: 'OK', onPress: () => router.replace('/(driver)') }]
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert(t('common.error'), message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `bg-white rounded-2xl border-2 border-gray-100 px-4 h-14 text-base text-vanz-navy ${isRtl ? 'text-right' : ''}`;
  const labelClass = `text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`;

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader
        title={ar ? 'كن سائقاً' : 'Devenir chauffeur'}
        subtitle={ar ? `الخطوة ${step} من 3` : `Étape ${step} sur 3`}
        backButton={() => (step > 1 ? setStep(s => s - 1) : router.back())}
        tall
      />

      {/* Step progress */}
      <View className="px-6 -mt-4 z-10">
        <View className="bg-white p-4 rounded-2xl shadow-card border border-gray-100">
          <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <Animated.View layout={Layout.springify()} className="h-full bg-vanz-teal rounded-full" style={{ width: `${(step / 3) * 100}%` }} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {step === 1 && (
            <Animated.View entering={FadeInDown.springify()} className="gap-4">
              <Text className="text-vanz-navy text-xl font-black mb-1">{ar ? 'الهوية' : 'Identité'}</Text>
              <View>
                <Text className={labelClass}>{ar ? 'الاسم' : 'Prénom'} *</Text>
                <TextInput className={inputClass} value={firstName} onChangeText={setFirstName} placeholder={ar ? 'الاسم' : 'Prénom'} placeholderTextColor="#9CA3AF" />
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'اللقب' : 'Nom'} *</Text>
                <TextInput className={inputClass} value={lastName} onChangeText={setLastName} placeholder={ar ? 'اللقب' : 'Nom'} placeholderTextColor="#9CA3AF" />
              </View>
              <View>
                <Text className={labelClass}>Email</Text>
                <TextInput className={inputClass} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="email@example.com" placeholderTextColor="#9CA3AF" />
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'الهاتف' : 'Téléphone'}</Text>
                <View className={`flex-row items-center bg-white rounded-2xl border-2 border-gray-100 px-4 h-14 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-vanz-navy font-bold">+216</Text>
                  <View className="h-7 w-px bg-gray-100 mx-3" />
                  <TextInput className={`flex-1 text-base text-vanz-navy ${isRtl ? 'text-right' : ''}`} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={8} placeholder="XX XXX XXX" placeholderTextColor="#9CA3AF" />
                </View>
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'المدينة' : 'Ville'} *</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CITIES.map(c => (
                    <TouchableOpacity key={c} onPress={() => setCity(c)} className={`px-4 py-2.5 rounded-xl border-2 ${city === c ? 'bg-vanz-teal/10 border-vanz-teal' : 'bg-white border-gray-100'}`}>
                      <Text className={`font-bold text-sm ${city === c ? 'text-vanz-teal' : 'text-vanz-navy/60'}`}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *</Text>
                <TextInput className={inputClass} value={cin} onChangeText={v => setCin(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={8} placeholder="12345678" placeholderTextColor="#9CA3AF" />
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'تاريخ الميلاد' : 'Date de naissance'} *</Text>
                <TouchableOpacity onPress={() => setShowDobPicker(true)} className={`bg-white rounded-2xl border-2 border-gray-100 px-4 h-14 flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className={`text-base ${dob ? 'text-vanz-navy' : 'text-gray-400'}`}>{dob || 'AAAA-MM-JJ'}</Text>
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
                <Text className={labelClass}>{ar ? 'انتهاء صلاحية البطاقة' : 'Expiration CIN'} *</Text>
                <TouchableOpacity onPress={() => setShowExpiryPicker(true)} className={`bg-white rounded-2xl border-2 border-gray-100 px-4 h-14 flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className={`text-base ${cinExpiry ? 'text-vanz-navy' : 'text-gray-400'}`}>{cinExpiry || 'AAAA-MM-JJ'}</Text>
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
              <Text className="text-vanz-navy text-xl font-black mb-1">{ar ? 'المركبة' : 'Véhicule'}</Text>
              <View>
                <Text className={labelClass}>{ar ? 'نوع المركبة' : 'Type de véhicule'} *</Text>
                <View className="flex-row flex-wrap gap-3">
                  {vehicleTypes.map(vt => (
                    <TouchableOpacity key={vt.id} onPress={() => setVehicleType(vt.id)} className={`flex-1 min-w-[45%] p-4 rounded-2xl border-2 items-center ${vehicleType === vt.id ? 'bg-vanz-teal/10 border-vanz-teal' : 'bg-white border-gray-100'}`}>
                      <Text className="text-2xl mb-1">{vt.icon}</Text>
                      <Text className={`font-bold text-sm ${vehicleType === vt.id ? 'text-vanz-teal' : 'text-vanz-navy/60'}`}>{vt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'الماركة' : 'Marque'} *</Text>
                <TextInput className={inputClass} value={brand} onChangeText={setBrand} placeholder="Renault" placeholderTextColor="#9CA3AF" />
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'الطراز' : 'Modèle'} *</Text>
                <TextInput className={inputClass} value={model} onChangeText={setModel} placeholder="Kangoo" placeholderTextColor="#9CA3AF" />
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'السنة' : 'Année'} *</Text>
                <TextInput className={inputClass} value={year} onChangeText={v => setYear(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} placeholder="2018" placeholderTextColor="#9CA3AF" />
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'اللون' : 'Couleur'}</Text>
                <TextInput className={inputClass} value={color} onChangeText={setColor} placeholder={ar ? 'أبيض' : 'Blanc'} placeholderTextColor="#9CA3AF" />
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'رقم اللوحة' : "Plaque d'immatriculation"} *</Text>
                <TextInput className={`${inputClass} uppercase`} value={plate} onChangeText={setPlate} autoCapitalize="characters" placeholder="123 TN 4567" placeholderTextColor="#9CA3AF" />
              </View>
              <View>
                <Text className={labelClass}>{ar ? 'الحمولة (كغ)' : 'Capacité (kg)'} *</Text>
                <TextInput className={inputClass} value={capacity} onChangeText={v => setCapacity(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="800" placeholderTextColor="#9CA3AF" />
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeInDown.springify()}>
              <Text className="text-vanz-navy text-xl font-black mb-1">{ar ? 'المستندات' : 'Documents'}</Text>
              <Text className="text-vanz-navy/50 text-sm font-semibold mb-4">{ar ? 'مسح أو رفع كل وثيقة' : 'Scannez ou importez chaque document'}</Text>
              {documents.map((doc, index) => {
                const isUploaded = !!uploads[doc.key];
                return (
                  <Animated.View key={doc.key} entering={FadeInDown.delay(50 + index * 40).springify()}>
                    <PressableCard onPress={() => setActiveDoc(doc.key)} className={`mb-4 overflow-hidden border-2 ${isUploaded ? 'border-vanz-green/30 bg-vanz-green/5' : 'border-transparent bg-white'}`}>
                      <View className={`p-4 flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <View className={`flex-row items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ml-4 ${isUploaded ? 'bg-vanz-green/20' : 'bg-gray-50'}`}>
                            <Text className="text-2xl">{doc.icon}</Text>
                          </View>
                          <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                            <Text className={`font-extrabold text-base mb-0.5 ${isUploaded ? 'text-vanz-green' : 'text-vanz-navy'} ${isRtl ? 'text-right' : ''}`}>
                              {doc.label}{doc.required ? '' : ` (${ar ? 'اختياري' : 'opt.'})`}
                            </Text>
                            <Text className={`text-vanz-navy/60 text-xs font-semibold ${isRtl ? 'text-right' : ''}`}>{doc.description}</Text>
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
            colors={submitting ? ['#E2E8F0', '#CBD5E1'] : ['#38B6FF', '#2196D6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full h-full items-center justify-center flex-row"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-xl font-extrabold text-white">
                {step < 3 ? (ar ? 'التالي' : 'Continuer') : (ar ? 'إرسال المستندات' : 'Soumettre')}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Image source action sheet */}
      {activeDoc && (
        <>
          <TouchableOpacity activeOpacity={1} onPress={() => setActiveDoc(null)} className="absolute inset-0 bg-vanz-navy/40" />
          <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} className="absolute bottom-0 w-full bg-white rounded-t-[32px] p-6 pb-12 shadow-elevated">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
            <Text className="text-vanz-navy text-xl font-black mb-6 text-center">{ar ? 'اختر المصدر' : 'Choisir une source'}</Text>
            <View className="gap-3">
              <TouchableOpacity onPress={() => handlePickImage('camera')} className={`w-full h-16 bg-vanz-teal/10 rounded-2xl flex-row items-center justify-center border border-vanz-teal/20 active:bg-vanz-teal/20 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-xl mr-3 ml-3">📸</Text>
                <Text className="text-vanz-teal text-lg font-extrabold">{ar ? 'التقاط صورة' : 'Prendre une photo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePickImage('gallery')} className={`w-full h-16 bg-gray-50 rounded-2xl flex-row items-center justify-center border border-gray-100 active:bg-gray-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-xl mr-3 ml-3">🖼️</Text>
                <Text className="text-vanz-navy text-lg font-bold">{ar ? 'اختيار من المعرض' : 'Choisir dans la galerie'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}
