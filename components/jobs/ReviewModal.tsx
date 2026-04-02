'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Check, Loader2 } from 'lucide-react';
import { datasql as supabase } from '@/lib/datasql';

interface ReviewModalProps {
  jobId: string;
  driverId: string;
  driverName: string;
  clientId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewModal({ jobId, driverId, driverName, clientId, onClose, onSuccess }: ReviewModalProps) {
  const t = useTranslations('reviews');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const tags = [
    { id: 'tagPunctual', label: t('tagPunctual') },
    { id: 'tagCareful', label: t('tagCareful') },
    { id: 'tagCommunicative', label: t('tagCommunicative') },
    { id: 'tagProfessional', label: t('tagProfessional') },
  ];

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        job_id: jobId,
        reviewer_id: clientId,
        reviewee_id: driverId,
        reviewer_type: 'client',
        stars: rating,
        comment: comment,
        tags: selectedTags
      });

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Review submit error:", err);
      alert("Erreur lors de l'envoi de l'avis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-vanz-navy/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="bg-vanz-teal p-8 text-white relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Fermer"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-md">
              <Star className="w-10 h-10 text-vanz-yellow fill-current" />
            </div>
            <h2 className="text-2xl font-black mb-1">{t('modalTitle')}</h2>
            <p className="text-vanz-ice/80 font-medium">{t('modalSubtitle', { name: driverName })}</p>
          </div>

          <div className="p-8">
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-10 h-10 stroke-[3px]" />
                </div>
                <p className="text-vanz-navy font-black text-xl">{t('success')}</p>
              </motion.div>
            ) : (
              <>
                {/* Stars */}
                <div className="flex justify-center gap-2 mb-8">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <button
                      key={index}
                      onMouseEnter={() => setHover(index)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(index)}
                      className="p-1 transition-transform active:scale-90"
                      title={`${index} étoiles`}
                      aria-label={`${index} étoiles`}
                    >
                      <Star 
                        className={`w-10 h-10 transition-colors ${
                          (hover || rating) >= index 
                            ? 'text-vanz-yellow fill-current' 
                            : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Tags */}
                {rating >= 4 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mb-8"
                  >
                    <p className="text-sm font-black text-vanz-navy uppercase tracking-wider mb-4">{t('tagsTitle')}</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagToggle(tag.id)}
                          className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                            selectedTags.includes(tag.id)
                              ? 'bg-vanz-teal border-vanz-teal text-white shadow-md shadow-vanz-teal/20'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-vanz-teal/30'
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Comment */}
                <div className="mb-8">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('placeholder')}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-vanz-teal/20 focus:border-vanz-teal outline-none transition-all resize-none h-24"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || isSubmitting}
                    className="w-full py-4 bg-vanz-navy text-white rounded-2xl font-black text-lg shadow-xl shadow-vanz-navy/10 hover:brightness-110 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('submit')}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2 text-gray-400 font-bold text-sm hover:text-vanz-navy transition-colors"
                  >
                    {t('skip')}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
