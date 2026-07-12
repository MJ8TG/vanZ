import { colors } from '@/theme/colors';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ReviewService } from '@/modules/reviews/reviewService';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import Row from '@/components/ui/Row';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Star, Check, AlertTriangle } from 'lucide-react-native';

// Keep tag ids identical to the web ReviewModal so aggregation is consistent.
const TAGS: { id: string }[] = [
  { id: 'tagPunctual' },
  { id: 'tagProfessional' },
  { id: 'tagCareful' },
  { id: 'tagCommunicative' },
];

type LoadState = 'loading' | 'ready' | 'already' | 'error';

export default function ReviewScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';

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
      if (await ReviewService.hasReviewed(jobId, userId)) { setState('already'); return; }

      const job = await ReviewService.fetchJob(jobId);
      if (!job) throw new Error(t('review.jobNotFound'));
      if (job.client_id !== userId) throw new Error(t('review.notAuthorized'));
      if (job.status !== 'completed') throw new Error(t('review.notCompleted'));
      if (!job.accepted_bid_id) throw new Error(t('review.noDriver'));

      const driver = await ReviewService.fetchAcceptedDriver(job.accepted_bid_id);
      if (!driver) throw new Error(t('review.driverLoadFailed'));

      setDriverId(driver.driverId);
      setDriverName(`${driver.firstName} ${driver.lastName}`.trim() || t('review.fallbackDriver'));
      setState('ready');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setState('error');
    }
  }, [jobId, session?.user?.id, locale]);

  useEffect(() => { load(); }, [load]);

  const toggleTag = (id: string) =>
    setTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async () => {
    if (rating === 0 || !driverId || !session?.user?.id) return;
    setSubmitting(true);
    try {
      await ReviewService.submitReview({
        jobId,
        reviewerId: session.user.id,
        revieweeId: driverId,
        stars: rating,
        comment: comment.trim() || null,
        tags,
      });
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
      title={t('jobDetails.leaveReview')}
      backButton={() => router.back()}
      tall
    />
  );

  if (state === 'loading') {
    return (
      <View className="flex-1 bg-surface">
        <Header />
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.teal} size="large" /></View>
      </View>
    );
  }

  if (state === 'already' || done) {
    return (
      <View className="flex-1 bg-surface">
        <Header />
        <Animated.View entering={FadeInDown.springify()} className="flex-1 items-center justify-center p-8">
          <View className="w-24 h-24 bg-vanz-green/15 rounded-full items-center justify-center mb-6">
            <View className="w-16 h-16 bg-vanz-green rounded-full items-center justify-center shadow-glow-green">
              <Check size={34} color={colors.white} strokeWidth={3} />
            </View>
          </View>
          <Text className="text-content text-2xl font-black mb-2 text-center">
            {done ? t('review.thanksTitle') : t('review.alreadyTitle')}
          </Text>
          <Text className="text-content-secondary text-center font-medium">
            {done ? t('review.thanksBody') : t('review.alreadyBody')}
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View className="flex-1 bg-surface">
        <Header />
        <View className="flex-1 items-center justify-center p-8">
          <View className="mb-4"><AlertTriangle size={48} color="#EF4444" strokeWidth={1.8} /></View>
          <Text className="text-content-secondary text-center font-semibold mb-8">{errorMsg}</Text>
          <TouchableOpacity onPress={() => router.back()} className="px-8 h-14 bg-surface-elevated rounded-2xl items-center justify-center shadow-card border border-line">
            <Text className="text-content font-extrabold">{t('review.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <Header />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(80).springify()} className="items-center mb-8">
            <View className="w-20 h-20 bg-vanz-yellow/15 rounded-3xl items-center justify-center mb-4 border border-vanz-yellow/20">
              <Star size={34} color={colors.yellow} fill={colors.yellow} strokeWidth={2} />
            </View>
            <Text className="text-content text-xl font-black mb-1 text-center">
              {t('review.howWas')}
            </Text>
            <Text className="text-content-secondary text-center font-medium px-4">
              {t('review.helpsDriver', { name: driverName })}
            </Text>
          </Animated.View>

          {/* Stars */}
          <Animated.View entering={FadeInDown.delay(150).springify()} className="flex-row justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((i) => {
              const filled = rating >= i;
              return (
                <TouchableOpacity key={i} onPress={() => setRating(i)} className="p-1 active:scale-90">
                  <Star size={44} color={filled ? colors.yellow : '#CBD5E1'} fill={filled ? colors.yellow : 'transparent'} strokeWidth={1.8} />
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Tags (shown for positive ratings, like web) */}
          {rating >= 4 && (
            <Animated.View entering={FadeIn} className="mb-8">
              <Text className={`text-content font-black text-xs uppercase tracking-wider mb-4 ${isRtl ? 'text-right' : ''}`}>
                {t('review.whatLiked')}
              </Text>
              <Row className="flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const selected = tags.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => toggleTag(tag.id)}
                      className={`px-4 py-2.5 rounded-full border-2 ${selected ? 'bg-vanz-teal border-vanz-teal' : 'bg-surface-elevated border-line'}`}
                    >
                      <Text className={`font-bold text-sm ${selected ? 'text-white' : 'text-content-secondary'}`}>{t(`review.`)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </Row>
            </Animated.View>
          )}

          {/* Comment */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text className={`text-content font-extrabold mb-2 text-sm ${isRtl ? 'text-right mr-1' : 'ml-1'}`}>
              {t('review.commentOptional')}
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              placeholder={t('review.commentPlaceholder')}
              placeholderTextColor={colors.placeholder}
              className={`bg-surface-elevated rounded-2xl border-2 border-line p-4 text-base text-content h-28 ${isRtl ? 'text-right' : ''}`}
              textAlignVertical="top"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit */}
      <View className="absolute bottom-0 w-full p-5 bg-surface-elevated/95 border-t border-line pb-8 shadow-elevated">
        <TouchableOpacity onPress={handleSubmit} disabled={rating === 0 || submitting} className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90">
          <LinearGradient
            colors={rating === 0 || submitting ? ['#E2E8F0', '#CBD5E1'] : [colors.teal, colors.tealDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full h-full items-center justify-center"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`text-xl font-extrabold ${rating === 0 ? 'text-content-muted' : 'text-white'}`}>
                {t('review.submit')}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
