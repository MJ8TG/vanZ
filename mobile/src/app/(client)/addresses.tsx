import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';

type SavedAddress = {
  id: string;
  label: string;
  address: string;
  floor: string | null;
  is_default: boolean;
};

// Quick-pick labels with matching icons; "Autre" lets the user type a custom one.
const LABEL_PRESETS: { id: string; fr: string; ar: string; icon: string }[] = [
  { id: 'home', fr: 'Maison', ar: 'المنزل', icon: '🏠' },
  { id: 'work', fr: 'Travail', ar: 'العمل', icon: '💼' },
  { id: 'other', fr: 'Autre', ar: 'آخر', icon: '📍' },
];

function iconForLabel(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('maison') || l.includes('home') || l.includes('منزل')) return '🏠';
  if (l.includes('travail') || l.includes('work') || l.includes('bureau') || l.includes('عمل')) return '💼';
  return '📍';
}

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { locale } = useI18n();
  const ar = locale === 'ar';
  const isRtl = ar;
  const userId = session?.user?.id;

  const [items, setItems] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // New-address form
  const [labelPreset, setLabelPreset] = useState('home');
  const [customLabel, setCustomLabel] = useState('');
  const [address, setAddress] = useState('');
  const [floor, setFloor] = useState('');

  const fetchAddresses = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await datasql
        .from('saved_addresses')
        .select('id, label, address, floor, is_default')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data || []) as SavedAddress[]);
    } catch (e) {
      console.error('Failed to fetch addresses:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const resetForm = () => {
    setLabelPreset('home');
    setCustomLabel('');
    setAddress('');
    setFloor('');
  };

  const handleSave = async () => {
    if (!userId) return;
    const preset = LABEL_PRESETS.find(p => p.id === labelPreset);
    const label = labelPreset === 'other' ? customLabel.trim() : (preset ? preset.fr : '');
    if (!label || !address.trim()) {
      Alert.alert(ar ? 'حقول ناقصة' : 'Champs manquants', ar ? 'يرجى إدخال التسمية والعنوان.' : "Veuillez saisir un libellé et une adresse.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await datasql
        .from('saved_addresses')
        .insert({
          user_id: userId,
          label,
          address: address.trim(),
          floor: floor.trim() || null,
          is_default: items.length === 0, // first address becomes default
        })
        .select('id, label, address, floor, is_default')
        .single();
      if (error) throw error;
      setItems(prev => [data as SavedAddress, ...prev]);
      resetForm();
      setAdding(false);
    } catch (e) {
      Alert.alert(ar ? 'خطأ' : 'Erreur', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: SavedAddress) => {
    Alert.alert(
      ar ? 'حذف العنوان' : "Supprimer l'adresse",
      ar ? 'هل أنت متأكد؟' : 'Êtes-vous sûr ?',
      [
        { text: ar ? 'إلغاء' : 'Annuler', style: 'cancel' },
        {
          text: ar ? 'حذف' : 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setItems(prev => prev.filter(a => a.id !== item.id)); // optimistic
            const { error } = await datasql.from('saved_addresses').delete().eq('id', item.id);
            if (error) { console.error(error); fetchAddresses(); }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (item: SavedAddress) => {
    if (item.is_default || !userId) return;
    setItems(prev => prev.map(a => ({ ...a, is_default: a.id === item.id })));
    const { error: e1 } = await datasql.from('saved_addresses').update({ is_default: false }).eq('user_id', userId);
    const { error: e2 } = await datasql.from('saved_addresses').update({ is_default: true }).eq('id', item.id);
    if (e1 || e2) { console.error(e1 || e2); fetchAddresses(); }
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={ar ? 'عناويني' : 'Mes adresses'} backButton={() => router.back()} tall />

      {loading ? (
        <View className="px-5 pt-5"><ShimmerCard /><ShimmerCard /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify()}>
              <PressableCard className={`mb-3 overflow-hidden ${item.is_default ? 'border-2 border-vanz-teal/30' : 'border border-gray-100'}`}>
                <View className={`p-4 flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className="w-12 h-12 rounded-2xl bg-gray-50 items-center justify-center mr-3 ml-3">
                    <Text className="text-2xl">{iconForLabel(item.label)}</Text>
                  </View>
                  <View className="flex-1">
                    <View className={`flex-row items-center mb-0.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <Text className={`font-extrabold text-base text-vanz-navy ${isRtl ? 'text-right' : ''}`}>{item.label}</Text>
                      {item.is_default && (
                        <View className="bg-vanz-teal/10 px-2 py-0.5 rounded-md ml-2 mr-2">
                          <Text className="text-vanz-teal font-black text-[9px] uppercase tracking-wide">{ar ? 'افتراضي' : 'Défaut'}</Text>
                        </View>
                      )}
                    </View>
                    <Text className={`text-vanz-navy/60 text-sm font-medium ${isRtl ? 'text-right' : ''}`} numberOfLines={2}>{item.address}</Text>
                    {item.floor ? (
                      <Text className={`text-vanz-navy/40 text-xs font-semibold mt-0.5 ${isRtl ? 'text-right' : ''}`}>
                        {ar ? 'الطابق' : 'Étage'}: {item.floor}
                      </Text>
                    ) : null}
                  </View>
                  <View className="items-center gap-2">
                    {!item.is_default && (
                      <TouchableOpacity onPress={() => handleSetDefault(item)} className="w-9 h-9 rounded-full bg-vanz-teal/10 items-center justify-center active:bg-vanz-teal/20">
                        <Text className="text-vanz-teal">📌</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleDelete(item)} className="w-9 h-9 rounded-full bg-red-50 items-center justify-center active:bg-red-100">
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </PressableCard>
            </Animated.View>
          )}
          ListEmptyComponent={() => (
            <Animated.View entering={FadeInDown} className="items-center justify-center py-24">
              <View className="w-28 h-28 bg-white rounded-full items-center justify-center shadow-card mb-6">
                <Text className="text-5xl">📍</Text>
              </View>
              <Text className="text-vanz-navy/40 text-center text-sm font-semibold px-10">
                {ar ? 'لا توجد عناوين محفوظة بعد.' : 'Aucune adresse enregistrée.'}
              </Text>
            </Animated.View>
          )}
        />
      )}

      {/* Add button */}
      <View className="absolute bottom-0 w-full p-5 bg-card-glass border-t border-white/50 pb-8 shadow-elevated">
        <TouchableOpacity onPress={() => setAdding(true)} className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90">
          <LinearGradient colors={['#38B6FF', '#2196D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full h-full items-center justify-center flex-row">
            <Text className="text-white text-xl font-extrabold mr-2 ml-2">＋</Text>
            <Text className="text-white text-lg font-extrabold">{ar ? 'إضافة عنوان' : 'Ajouter une adresse'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Add address sheet */}
      {adding && (
        <>
          <TouchableOpacity activeOpacity={1} onPress={() => setAdding(false)} className="absolute inset-0 bg-vanz-navy/40" />
          <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} className="absolute bottom-0 w-full bg-white rounded-t-[32px] p-6 pb-10 shadow-elevated">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
              <Text className="text-vanz-navy text-xl font-black mb-6 text-center">{ar ? 'عنوان جديد' : 'Nouvelle adresse'}</Text>

              <Text className={`text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{ar ? 'التسمية' : 'Libellé'}</Text>
              <View className={`flex-row gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {LABEL_PRESETS.map(p => (
                  <TouchableOpacity key={p.id} onPress={() => setLabelPreset(p.id)} className={`flex-1 p-3 rounded-2xl border-2 items-center ${labelPreset === p.id ? 'bg-vanz-teal/10 border-vanz-teal' : 'bg-white border-gray-100'}`}>
                    <Text className="text-xl mb-0.5">{p.icon}</Text>
                    <Text className={`font-bold text-xs ${labelPreset === p.id ? 'text-vanz-teal' : 'text-vanz-navy/60'}`}>{ar ? p.ar : p.fr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {labelPreset === 'other' && (
                <TextInput value={customLabel} onChangeText={setCustomLabel} placeholder={ar ? 'اسم العنوان' : "Nom de l'adresse"} placeholderTextColor="#9CA3AF"
                  className={`bg-gray-50 rounded-2xl border-2 border-gray-100 px-4 h-14 text-base text-vanz-navy mb-3 ${isRtl ? 'text-right' : ''}`} />
              )}

              <Text className={`text-vanz-navy font-extrabold mb-2 mt-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{ar ? 'العنوان' : 'Adresse'}</Text>
              <TextInput value={address} onChangeText={setAddress} placeholder={ar ? 'الشارع، المدينة...' : 'Rue, ville...'} placeholderTextColor="#9CA3AF"
                className={`bg-gray-50 rounded-2xl border-2 border-gray-100 px-4 h-14 text-base text-vanz-navy mb-3 ${isRtl ? 'text-right' : ''}`} />

              <Text className={`text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{ar ? 'الطابق (اختياري)' : 'Étage (optionnel)'}</Text>
              <TextInput value={floor} onChangeText={setFloor} placeholder={ar ? 'مثال: 3' : 'Ex: 3'} placeholderTextColor="#9CA3AF"
                className={`bg-gray-50 rounded-2xl border-2 border-gray-100 px-4 h-14 text-base text-vanz-navy mb-5 ${isRtl ? 'text-right' : ''}`} />

              <TouchableOpacity onPress={handleSave} disabled={saving} className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90">
                <LinearGradient colors={saving ? ['#E2E8F0', '#CBD5E1'] : ['#38B6FF', '#2196D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full h-full items-center justify-center">
                  {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-extrabold">{ar ? 'حفظ' : 'Enregistrer'}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Animated.View>
        </>
      )}
    </View>
  );
}
