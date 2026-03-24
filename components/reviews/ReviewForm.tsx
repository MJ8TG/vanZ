'use client';

import { useState } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerType: 'client' | 'driver';
  onSuccess?: () => void;
}

const CLIENT_TAGS = ['Ponctuel', 'Soigneux', 'Communicatif', 'Professionnel'];
const DRIVER_TAGS = ['Respectueux', 'Colis bien emballé', 'Facile d\'accès'];

export function ReviewForm({ jobId, reviewerId, revieweeId, reviewerType, onSuccess }: ReviewFormProps) {
  const [stars, setStars] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = reviewerType === 'client' ? CLIENT_TAGS : DRIVER_TAGS;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) return alert('Veuillez sélectionner une note.');
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        job_id: jobId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        reviewer_type: reviewerType,
        stars,
        tags: selectedTags,
        comment
      });

      if (error) throw error;
      
      alert('Merci pour votre avis !');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(error);
      alert('Erreur lors de la soumission de l\'avis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-[#051E3C] text-center mb-6">
        {reviewerType === 'client' ? 'Notez votre chauffeur' : 'Notez le client'}
      </h3>
      
      {/* Stars Selector */}
      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((star) => (
          <button 
            key={star} 
            type="button" 
            onClick={() => setStars(star)}
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
          >
            <Star 
              className={`w-10 h-10 ${star <= stars ? 'fill-[#F5C800] text-[#F5C800]' : 'fill-transparent text-gray-300'}`} 
            />
          </button>
        ))}
      </div>

      {/* Tags Selector */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-500 mb-3">Points forts :</p>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                selectedTags.includes(tag) 
                  ? 'bg-[#E8F8FA] text-[#2BBFDF] border-[#2BBFDF]' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <textarea 
          placeholder="Un commentaire supplémentaire ? (facultatif)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#2BBFDF] focus:outline-none resize-none h-24"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || stars === 0}
        className="w-full bg-[#051E3C] text-white py-4 rounded-xl font-bold hover:bg-[#0a2955] transition disabled:opacity-50"
      >
        {isSubmitting ? 'Envoi...' : 'Soumettre mon avis'}
      </button>
    </div>
  );
}
