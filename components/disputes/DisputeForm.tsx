'use client';

import { useState } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { UploadCloud, X, AlertTriangle } from 'lucide-react';

interface DisputeFormProps {
  job: any; // Requires job.id, job.completed_at, job.status
  openerId: string;
  onSuccess?: () => void;
}

const DISPUTE_REASONS = [
  { value: 'damaged', label: 'Article endommagé' },
  { value: 'no_show', label: 'Chauffeur absent' },
  { value: 'wrong_price', label: 'Prix incorrect facturé' },
  { value: 'refused_payment', label: 'Paiement refusé' },
  { value: 'unsafe', label: 'Comportement dangereux' },
  { value: 'other', label: 'Autre' }
];

export function DisputeForm({ job, openerId, onSuccess }: DisputeFormProps) {
  const [reason, setReason] = useState(DISPUTE_REASONS[0].value);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation Check: Completed & < 24h
  const hoursSinceCompletion = job.completed_at 
    ? (Date.now() - new Date(job.completed_at).getTime()) / 3600000 
    : 999;
    
  const canOpenDispute = job.status === 'completed' && hoursSinceCompletion <= 24 && !job.dispute_id;

  if (!canOpenDispute) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
         Un litige ne peut être ouvert que dans les 24 heures suivant la livraison de la course.
      </div>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (photos.length + newFiles.length > 3) {
        return alert('Vous ne pouvez télécharger que 3 photos maximum.');
      }
      setPhotos(prev => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return alert('Veuillez décrire le problème.');
    
    setIsSubmitting(true);
    try {
      // 1. Upload photos to storage
      const uploadedUrls: string[] = [];
      for (const file of photos) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${job.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('disputes')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('disputes').getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }

      // 2. Insert Dispute
      const { data: dispute, error: disputeError } = await supabase.from('disputes').insert({
        job_id: job.id,
        opener_id: openerId,
        reason,
        description,
        status: 'open',
        photo_urls: uploadedUrls
      }).select('id').single();

      if (disputeError) throw disputeError;

      // Update job to reference this dispute
      await supabase.from('jobs').update({ dispute_id: dispute.id }).eq('id', job.id);

      // 3. Immediately SMS Admin via webhook
      await supabase.functions.invoke('driver-status-change', {
        body: {
          type: 'dispute_opened',
          message: `Nouveau litige ouvert — Job ${job.id} — Raison: ${reason}`,
          notify_admin: true
        }
      });

      alert('Votre litige a été ouvert. Un administrateur va examiner le dossier.');
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error(error);
      alert("Une erreur s'est produite lors de l'ouverture du litige.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6 text-red-600">
        <AlertTriangle className="w-5 h-5"/>
        <h3 className="text-lg font-bold">Ouvrir un Litige</h3>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-semibold text-[#051E3C] mb-2">Motif du litige</label>
        <select 
          value={reason} 
          onChange={e => setReason(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
        >
          {DISPUTE_REASONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-[#051E3C] mb-2">Description détaillée</label>
        <textarea 
          placeholder="Décrivez précisément ce qui s'est passé..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none resize-none h-32"
        />
      </div>

      {/* Photo Uploads */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-[#051E3C] mb-2">Preuves (Photos - Max 3)</label>
        <div className="flex gap-2 flex-wrap">
          {photos.map((file, idx) => (
             <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
               <img src={URL.createObjectURL(file)} alt="preuve" className="w-full h-full object-cover" />
               <button 
                 type="button" 
                 onClick={() => removePhoto(idx)}
                 className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
               >
                 <X className="w-3 h-3" />
               </button>
             </div>
          ))}
          
          {photos.length < 3 && (
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-[#2BBFDF] hover:bg-[#F0FBFC] transition">
              <UploadCloud className="w-6 h-6 mb-1"/>
              <span className="text-[10px] uppercase font-bold">Ajouter</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !description.trim()}
        className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 flex justify-center items-center"
      >
        {isSubmitting ? 'Ouverture...' : 'Soumettre le litige'}
      </button>

      <p className="text-xs text-center text-gray-400 mt-4 font-medium">
        Notre équipe s'engage à traiter votre demande sous 24h ouvrées. Un administrateur examinera l'historique de conversation.
      </p>
    </div>
  );
}
