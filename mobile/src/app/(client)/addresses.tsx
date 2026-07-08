import { colors } from '@/theme/colors';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { AddressService, type SavedAddress } from '@/modules/addresses/addressService';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import EmptyState from '@/components/ui/EmptyState';
import Row from '@/components/ui/Row';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Home, Briefcase, MapPin, Pin, Trash2, Plus, type LucideIcon } from 'lucide-react-native';

// Quick-pick labels with matching icons; "Autre" lets the user type a custom one.
const LABEL_PRESETS: { id: string; fr: string; labelKey: string; Icon: LucideIcon }[] = [
  { id: 'home', fr: 'Maison', labelKey: 'addresses.presetHome', Icon: Home },
  { id: 'work', fr: 'Travail', labelKey: 'addresses.presetWork', Icon: Briefcase },
  { id: 'other', fr: 'Autre', labelKey: 'addresses.presetOther', Icon: MapPin },
];

function iconForLabel(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes('maison') || l.includes('home') || l.includes('منزل')) return Home;
  if (l.includes('travail') || l.includes('work') || l.includes('bureau') || l.includes('عمل')) return Briefcase;
  return MapPin;
}

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';
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
      setItems(await AddressService.fetch(userId));
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
      Alert.alert(t('addresses.missingFieldsTitle'), t('addresses.missingFieldsBody'));
      return;
    }
    setSaving(true);
    try {
      const created = await AddressService.create(userId, {
        label,
        address: address.trim(),
        floor: floor.trim() || null,
        isDefault: items.length === 0, // first address becomes default
      });
      setItems(prev => [created, ...prev]);
      resetForm();
      setAdding(false);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: SavedAddress) => {
    Alert.alert(
      t('addresses.deleteTitle'),
      t('addresses.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('addresses.delete'),
          style: 'destructive',
          onPress: async () => {
            setItems(prev => prev.filter(a => a.id !== item.id)); // optimistic
            try {
              await AddressService.remove(item.id);
            } catch (e) { console.error(e); fetchAddresses(); }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (item: SavedAddress) => {
    if (item.is_default || !userId) return;
    setItems(prev => prev.map(a => ({ ...a, is_default: a.id === item.id })));
    try {
      await AddressService.setDefault(userId, item.id);
    } catch (e) { console.error(e); fetchAddresses(); }
  };

  return (
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('addresses.title')} backButton={() => router.back()} tall />

      {loading ? (
        <View className="px-5 pt-5"><ShimmerCard /><ShimmerCard /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const LIcon = iconForLabel(item.label);
            return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify()}>
              <PressableCard className={`mb-3 overflow-hidden ${item.is_default ? 'border-2 border-vanz-teal/30' : 'border border-line'}`}>
                <Row className="p-4 items-center">
                  <View className="w-12 h-12 rounded-2xl bg-surface-sunken items-center justify-center mr-3 ml-3">
                    <LIcon size={22} color={colors.muted} strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Row className="items-center mb-0.5">
                      <Text className={`font-extrabold text-base text-content ${isRtl ? 'text-right' : ''}`}>{item.label}</Text>
                      {item.is_default && (
                        <View className="bg-vanz-teal/10 px-2 py-0.5 rounded-md ml-2 mr-2">
                          <Text className="text-vanz-teal font-black text-[9px] uppercase tracking-wide">{t('addresses.default')}</Text>
                        </View>
                      )}
                    </Row>
                    <Text className={`text-content-secondary text-sm font-medium ${isRtl ? 'text-right' : ''}`} numberOfLines={2}>{item.address}</Text>
                    {item.floor ? (
                      <Text className={`text-content-muted text-xs font-semibold mt-0.5 ${isRtl ? 'text-right' : ''}`}>
                        {t('addresses.floor')}: {item.floor}
                      </Text>
                    ) : null}
                  </View>
                  <View className="items-center gap-2">
                    {!item.is_default && (
                      <TouchableOpacity onPress={() => handleSetDefault(item)} className="w-9 h-9 rounded-full bg-vanz-teal/10 items-center justify-center active:bg-vanz-teal/20">
                        <Pin size={16} color={colors.teal} strokeWidth={2.4} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleDelete(item)} className="w-9 h-9 rounded-full bg-danger/10 items-center justify-center active:bg-danger/15">
                      <Trash2 size={16} color="#EF4444" strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                </Row>
              </PressableCard>
            </Animated.View>
            );
          }}
          ListEmptyComponent={() => <EmptyState Icon={MapPin} title={t('addresses.empty')} />}
        />
      )}

      {/* Add button */}
      <View className="absolute bottom-0 w-full p-5 bg-card-glass border-t border-white/50 pb-8 shadow-elevated">
        <TouchableOpacity onPress={() => setAdding(true)} className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90">
          <LinearGradient colors={[colors.teal, colors.tealDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full h-full items-center justify-center flex-row gap-2">
            <Plus size={20} color={colors.white} strokeWidth={2.8} />
            <Text className="text-white text-lg font-extrabold">{t('addresses.addCta')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Add address sheet */}
      {adding && (
        <>
          <TouchableOpacity activeOpacity={1} onPress={() => setAdding(false)} className="absolute inset-0 bg-black/50" />
          <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} className="absolute bottom-0 w-full bg-surface-elevated rounded-t-[32px] p-6 pb-10 shadow-elevated">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
              <Text className="text-content text-xl font-black mb-6 text-center">{t('addresses.newTitle')}</Text>

              <Text className={`text-content font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{t('addresses.labelField')}</Text>
              <Row className="gap-2 mb-2">
                {LABEL_PRESETS.map(p => (
                  <TouchableOpacity key={p.id} onPress={() => setLabelPreset(p.id)} className={`flex-1 p-3 rounded-2xl border-2 items-center ${labelPreset === p.id ? 'bg-vanz-teal/10 border-vanz-teal' : 'bg-surface-elevated border-line'}`}>
                    <View className="mb-1"><p.Icon size={20} color={labelPreset === p.id ? colors.teal : colors.muted} strokeWidth={2.2} /></View>
                    <Text className={`font-bold text-xs ${labelPreset === p.id ? 'text-vanz-teal' : 'text-content-secondary'}`}>{t(p.labelKey)}</Text>
                  </TouchableOpacity>
                ))}
              </Row>
              {labelPreset === 'other' && (
                <TextInput value={customLabel} onChangeText={setCustomLabel} placeholder={t('addresses.customLabelPlaceholder')} placeholderTextColor={colors.placeholder}
                  className={`bg-surface-sunken rounded-2xl border-2 border-line px-4 h-14 text-base text-content mb-3 ${isRtl ? 'text-right' : ''}`} />
              )}

              <Text className={`text-content font-extrabold mb-2 mt-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{t('addresses.addressField')}</Text>
              <TextInput value={address} onChangeText={setAddress} placeholder={t('addresses.addressPlaceholder')} placeholderTextColor={colors.placeholder}
                className={`bg-surface-sunken rounded-2xl border-2 border-line px-4 h-14 text-base text-content mb-3 ${isRtl ? 'text-right' : ''}`} />

              <Text className={`text-content font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>{t('addresses.floorOptional')}</Text>
              <TextInput value={floor} onChangeText={setFloor} placeholder={t('addresses.floorPlaceholder')} placeholderTextColor={colors.placeholder}
                className={`bg-surface-sunken rounded-2xl border-2 border-line px-4 h-14 text-base text-content mb-5 ${isRtl ? 'text-right' : ''}`} />

              <TouchableOpacity onPress={handleSave} disabled={saving} className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90">
                <LinearGradient colors={saving ? ['#E2E8F0', '#CBD5E1'] : [colors.teal, colors.tealDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full h-full items-center justify-center">
                  {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-extrabold">{t('addresses.save')}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Animated.View>
        </>
      )}
    </View>
  );
}
