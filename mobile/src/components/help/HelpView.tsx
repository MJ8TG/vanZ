import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import PressableCard from '@/components/ui/PressableCard';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// Optional support number, e.g. "21612345678" (no +). Falls back to a blank
// WhatsApp share if unset.
const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE || '';

interface Faq { q_fr: string; a_fr: string; q_ar: string; a_ar: string; }

const FAQS: Faq[] = [
  {
    q_fr: 'Comment publier une mission ?',
    a_fr: "Depuis l'accueil, indiquez le point de départ et d'arrivée, ajoutez les détails du colis puis publiez. Les transporteurs vous enverront leurs offres.",
    q_ar: 'كيف أنشر مهمة؟',
    a_ar: 'من الصفحة الرئيسية، حدّد نقطة الانطلاق والوصول، أضف تفاصيل الشحنة ثم انشر. سيرسل لك الناقلون عروضهم.',
  },
  {
    q_fr: 'Comment fonctionne le paiement ?',
    a_fr: "Après avoir accepté une offre, vous payez en ligne via Paymee pour confirmer la réservation. Le transporteur est payé après la livraison.",
    q_ar: 'كيف يتم الدفع؟',
    a_ar: 'بعد قبول العرض، تدفع عبر الإنترنت من خلال Paymee لتأكيد الحجز. يُدفع للناقل بعد التسليم.',
  },
  {
    q_fr: 'Comment devenir chauffeur ?',
    a_fr: "Passez en mode chauffeur, puis soumettez vos documents (CIN, permis, carte grise, assurance). Notre équipe valide votre compte sous 48h.",
    q_ar: 'كيف أصبح سائقاً؟',
    a_ar: 'انتقل إلى وضع السائق، ثم قدّم مستنداتك (بطاقة التعريف، الرخصة، البطاقة الرمادية، التأمين). يوثّق فريقنا حسابك خلال 48 ساعة.',
  },
  {
    q_fr: 'Comment utiliser mon crédit de parrainage ?',
    a_fr: "Votre crédit s'applique automatiquement lors de votre prochain paiement en ligne.",
    q_ar: 'كيف أستخدم رصيد الإحالة؟',
    a_ar: 'يُطبّق رصيدك تلقائياً عند عملية الدفع التالية عبر الإنترنت.',
  },
];

export default function HelpView() {
  const { locale } = useI18n();
  const ar = locale === 'ar';
  const isRtl = ar;
  const [open, setOpen] = useState<number | null>(0);

  const contactWhatsApp = () => {
    const msg = ar ? 'مرحباً، أحتاج إلى مساعدة بخصوص VanZ.' : "Bonjour, j'ai besoin d'aide concernant VanZ.";
    const url = SUPPORT_PHONE
      ? `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Contact card */}
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <LinearGradient colors={['#0B1021', '#131B36', '#1A2444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-[28px] p-6 mb-6">
          <Text className="text-white font-black text-xl mb-1">{ar ? 'بحاجة لمساعدة؟' : "Besoin d'aide ?"}</Text>
          <Text className="text-white/60 font-medium text-sm mb-5">{ar ? 'فريق الدعم متاح للإجابة على أسئلتك.' : 'Notre équipe est là pour répondre à vos questions.'}</Text>
          <TouchableOpacity onPress={contactWhatsApp} className="bg-vanz-green py-4 rounded-2xl items-center justify-center flex-row shadow-glow-green active:opacity-90">
            <Text className="text-lg mr-2 ml-2">💬</Text>
            <Text className="text-white font-black text-base">{ar ? 'تواصل عبر واتساب' : 'Contacter via WhatsApp'}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <Text className={`text-vanz-navy text-lg font-black mb-3 ${isRtl ? 'text-right' : ''}`}>{ar ? 'الأسئلة الشائعة' : 'Questions fréquentes'}</Text>

      {FAQS.map((faq, i) => {
        const isOpen = open === i;
        return (
          <Animated.View key={i} entering={FadeInDown.delay(120 + i * 50).springify()}>
            <PressableCard onPress={() => setOpen(isOpen ? null : i)} className="mb-3 overflow-hidden">
              <View className="p-4">
                <View className={`flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className={`text-vanz-navy font-extrabold text-sm flex-1 ${isRtl ? 'text-right ml-2' : 'mr-2'}`}>{ar ? faq.q_ar : faq.q_fr}</Text>
                  <Text className="text-vanz-teal font-black text-lg">{isOpen ? '−' : '+'}</Text>
                </View>
                {isOpen && (
                  <Animated.Text entering={FadeIn} className={`text-vanz-navy/60 font-medium text-sm leading-relaxed mt-3 ${isRtl ? 'text-right' : ''}`}>
                    {ar ? faq.a_ar : faq.a_fr}
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
