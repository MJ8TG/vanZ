import { colors } from '@/theme/colors';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import PressableCard from '@/components/ui/PressableCard';
import Row from '@/components/ui/Row';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MessageCircle, Plus, Minus } from 'lucide-react-native';

// Optional support number, e.g. "21612345678" (no +). Falls back to a blank
// WhatsApp share if unset.
const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE || '';

const FAQ_KEYS = ['faq1', 'faq2', 'faq3', 'faq4'];

export default function HelpView() {
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';
  const [open, setOpen] = useState<number | null>(0);

  const contactWhatsApp = () => {
    const msg = t('help.waMessage');
    const url = SUPPORT_PHONE
      ? `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Contact card */}
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <LinearGradient colors={[colors.navy, colors.navyLight, colors.navyMid]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-[28px] p-6 mb-6">
          <Text className="text-white font-black text-xl mb-1">{t('help.needHelp')}</Text>
          <Text className="text-white/60 font-medium text-sm mb-5">{t('help.teamAvailable')}</Text>
          <TouchableOpacity onPress={contactWhatsApp} className="bg-vanz-green py-4 rounded-2xl items-center justify-center flex-row shadow-glow-green active:opacity-90">
            <MessageCircle size={18} color={colors.white} strokeWidth={2.4} />
            <Text className="text-white font-black text-base mx-2">{t('help.contactWhatsApp')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <Text className={`text-content text-lg font-black mb-3 ${isRtl ? 'text-right' : ''}`}>{t('help.faq')}</Text>

      {FAQ_KEYS.map((key, i) => {
        const isOpen = open === i;
        return (
          <Animated.View key={key} entering={FadeInDown.delay(120 + i * 50).springify()}>
            <PressableCard onPress={() => setOpen(isOpen ? null : i)} className="mb-3 overflow-hidden">
              <View className="p-4">
                <Row className="items-center justify-between">
                  <Text className={`text-content font-extrabold text-sm flex-1 ${isRtl ? 'text-right ml-2' : 'mr-2'}`}>{t(`help.${key}Q`)}</Text>
                  {isOpen
                    ? <Minus size={18} color={colors.teal} strokeWidth={2.6} />
                    : <Plus size={18} color={colors.teal} strokeWidth={2.6} />}
                </Row>
                {isOpen && (
                  <Animated.Text entering={FadeIn} className={`text-content-secondary font-medium text-sm leading-relaxed mt-3 ${isRtl ? 'text-right' : ''}`}>
                    {t(`help.${key}A`)}
                  </Animated.Text>
                )}
              </View>
            </PressableCard>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}
