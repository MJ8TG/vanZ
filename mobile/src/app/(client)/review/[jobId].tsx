import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// Keep tag ids identical to the web ReviewModal so aggregation is consistent.
const TAGS: { id: string; fr: string; ar: string }[] = [
  { id: 'tagPunctual', fr: 'Ponctuel', ar: 'دقيق في المواعيد' },
  { id: 'tagProfessional', fr: 'Professionnel', ar: 'محترف' },
  { id: 'tagCareful', fr: 'Soin des meubles', ar: 'يعتني بالأغراض' },
  { id: 'tagCommunicative', fr: 'Communicatif', ar: 'متجاوب' },
];

const firstOrNull = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

type LoadState = 'loading' | 'ready' | 'already' | 'error';

export default function ReviewScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const ar = locale === 'ar';
  const isRtl = ar;

  const [state, setState] = useState<LoadState>('loading');
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    const userId = session?.user?.id;
    if (!jobId || !userId) return;
    setState('loading');
    try {
      // Already reviewed? (UNIQUE(job_id, reviewer_id))
      const { data: existing } = await datasql
        .from('reviews')
        .select('id')
        .eq('job_id', jobId)
        .eq('reviewer_id', userId)
        .maybeSingle();
      if (existing) { setState('already'); return; }

      const { data: job, error: jobErr } = await datasql
        .from('jobs')
        .select('id, client_id, status, accepted_bid_id')
        .eq('id', jobId)
        .single();
      if (jobErr || !job) throw new Error(ar ? 'الرحلة غير موجودة.' : 'Mission introuvable.');
      if (job.client_id !== userId) throw new Error(ar ? 'غير مصرح.' : 'Non autorisé.');
      if (job.status !== 'completed') throw new Error(ar ? 'لا يمكن التقييم قبل اكتمال الرحلة.' : "L'évaluation est disponible une fois la mission terminée.");
      if (!job.accepted_bid_id) throw new Error(ar ? 'لا يوجد ناقل لتقييمه.' : 'Aucun transporteur à évaluer.');

      const { data: bid, error: bidErr } = await datasql
        .from('bids')
        .select('driver_id, drivers(users(first_name, last_name))')
        .eq('id', job.accepted_bid_id)
        .single();
      if (bidErr || !bid) throw new Error(ar ? 'تعذر تحميل بيانات الناقل.' : 'Impossible de charger le transporteur.');

      const driver = firstOrNull(bid.drivers as any);
      const user = firstOrNull(driver?.users);
      setDriverId(bid.driver_id);
      setDriverName(`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || (ar ? 'الناقل' : 'le transporteur'));
      setState('ready');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setState('error');
    }
  }, [jobId, session?.user?.id, ar]);

  useEffect(() => { load(); }, [load]);

  const toggleTag = (id: string) =>
    setTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async () => {
    if (rating === 0 || !driverId || !session?.user?.id) return;
    setSubmitting(true);
    try {
      const { error } = await datasql.from('reviews').insert({
        job_id: jobId,
        reviewer_id: session.user.id,
        reviewee_id: driverId,
        reviewer_type: 'client',
        stars: rating,
        comment: comment.trim() || null,
        tags,
      });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.back(), 1600);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setState('error');
    } finally {
      setSubmitting(false);
    }
  };

  const Header = () => (
    <GradientHeader
      title={ar ? 'ترك تقييم' : 'Laisser un avis'}
      backButton={() => router.back()}
      tall
    />
  );

  if (state === 'loading') {
    return (
      <View className="flex-1 bg-vanz-iceblue">
        <Header />
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#38B6FF" size="large" /></View>
      </View>
    );
  }

  if (state === 'already' || done) {
    return (
      <View className="flex-1 bg-vanz-iceblue">
        <Header />
        <Animated.View entering={FadeInDown.springify()} className="flex-1 items-center justify-center p-8">
          <View className="w-24 h-24 bg-vanz-green/15 rounded-full items-center justify-center mb-6">
            <View className="w-16 h-16 bg-vanz-green rounded-full items-center justify-center shadow-glow-green">
              <Text className="text-white text-3xl font-black">✓</Text>
            </View>
          </View>
          <Text className="text-vanz-navy text-2xl font-black mb-2 text-center">
            {done ? (ar ? 'شكراً لك!' : 'Merci !') : (ar ? 'تم التقييم مسبقاً' : 'Déjà évalué')}
          </Text>
          <Text className="text-vanz-navy/60 text-center font-medium">
            {done ? (ar ? 'تم إرسال تقييمك.' : 'Votre avis a été envoyé.') : (ar ? 'لقد قمت بتقييم هذه الرحلة.' : 'Vous avez déjà évalué cette mission.')}
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View className="flex-1 bg-vanz-iceblue">
        <Header />
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-5xl mb-4">⚠️</Text>
          <Text className="text-vanz-navy/70 text-center font-semibold mb-8">{errorMsg}</Text>
          <TouchableOpacity onPress={() => router.back()} className="px-8 h-14 bg-white rounded-2xl items-center justify-center shadow-card border border-gray-100">
            <Text className="text-vanz-navy font-extrabold">{ar ? 'رجوع' : 'Retour'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <Header />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(80).springify()} className="items-center mb-8">
            <View className="w-20 h-20 bg-vanz-yellow/15 rounded-3xl items-center justify-center mb-4 border border-vanz-yellow/20">
              <Text className="text-4xl">⭐</Text>
            </View>
            <Text className="text-vanz-navy text-xl font-black mb-1 text-center">
              {ar ? 'كيف كانت الرحلة؟' : "Comment s'est passée la livraison ?"}
            </Text>
            <Text className="text-vanz-navy/60 text-center font-medium px-4">
              {ar ? `تقييمك يساعد ${driverName} على تحسين خدمته.` : `Votre avis aide ${driverName} à améliorer son service.`}
            </Text>
          </Animated.View>

          {/* Stars */}
          <Animated.View entering={FadeInDown.delay(150).springify()} className="flex-row justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)} className="p-1 active:scale-90">
                <Text className="text-5xl">{rating >= i ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Tags (shown for positive ratings, like web) */}
          {rating >= 4 && (
            <Animated.View entering={FadeIn} className="mb-8">
              <Text className={`text-vanz-navy font-black text-xs uppercase tracking-wider mb-4 ${isRtl ? 'text-right' : ''}`}>
                {ar ? 'ما الذي أعجبك؟' : "Qu'avez-vous apprécié ?"}
              </Text>
              <View className={`flex-row flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {TAGS.map((tag) => {
                  const selected = tags.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => toggleTag(tag.id)}
                      className={`px-4 py-2.5 rounded-full border-2 ${selected ? 'bg-vanz-teal border-vanz-teal' : 'bg-white border-gray-100'}`}
                    >
                      <Text className={`font-bold text-sm ${selected ? 'text-white' : 'text-vanz-navy/60'}`}>{ar ? tag.ar : tag.fr}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Comment */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text className={`text-vanz-navy font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>
              {ar ? 'تعليق (اختياري)' : 'Commentaire (optionnel)'}
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              placeholder={ar ? 'اترك تعليقاً...' : 'Laissez un commentaire...'}
              placeholderTextColor="#9CA3AF"
              className={`bg-white rounded-2xl border-2 border-gray-100 p-4 text-base text-vanz-navy h-28 ${isRtl ? 'text-right' : ''}`}
              textAlignVertical="top"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit */}
      <View className="absolute bottom-0 w-full p-5 bg-card-glass border-t border-white/50 pb-8 shadow-elevated">
        <TouchableOpacity onPress={handleSubmit} disabled={rating === 0 || submitting} className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90">
          <LinearGradient
            colors={rating === 0 || submitting ? ['#E2E8F0', '#CBD5E1'] : ['#38B6FF', '#2196D6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full h-full items-center justify-center"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`text-xl font-extrabold ${rating === 0 ? 'text-gray-400' : 'text-white'}`}>
                {ar ? 'إرسال التقييم' : "Soumettre l'avis"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
