'use client';

import { useState } from 'react';
import { default as NextImage } from 'next/image';
import { X, AlertTriangle, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { datasql } from '@/lib/datasql';
import { uploadFile } from '@/lib/upload';

const REASONS = [
  "Retard important du chauffeur",
  "Marchandise endommagée",
  "Chauffeur injurieux ou comportement inadapté",
  "Problème de paiement ou surtaxe",
  "Client absent ou injoignable",
  "Autre"
];

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  openerType: 'client' | 'driver';
  userId: string;
}

export default function ReportIssueModal({ isOpen, onClose, jobId, openerType, userId }: ReportIssueModalProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files).slice(0, 3)); // Max 3 photos
    }
  };

  const handleSubmit = async () => {
    if (description.trim().length < 20) {
      setError("Merci de fournir une description détaillée (min 20 caractères).");
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Upload Photos sequentially
      const photoUrls: string[] = [];
      for (const file of photos) {
         const url = await uploadFile('job-images', `disputes/${jobId}/${Date.now()}_${file.name}`, file);
         if (url) photoUrls.push(url);
      }

      // 2. Insert Dispute
      const { error: dbError } = await datasql.from('disputes').insert({
        job_id: jobId,
        opened_by: userId,
        opened_type: openerType,
        reason,
        description,
        photo_urls: photoUrls,
        status: 'open'
      });

      if (dbError) throw new Error(dbError.message);

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setReason(REASONS[0]);
        setDescription('');
        setPhotos([]);
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Erreur lors de la soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200" title="Fermer" aria-label="Fermer">
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-vanz-teal mx-auto mb-4" />
            <h2 className="text-2xl font-black text-vanz-navy mb-2">Signalement Envoyé</h2>
            <p className="text-sm text-gray-500 font-medium">
              Notre équipe va examiner le problème et vous recontacter sous 24h.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-vanz-navy">Signaler un Problème</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Mission #{jobId.substring(0,8)}</p>
              </div>
            </div>

            {error && <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm font-bold rounded-lg">{error}</div>}

            <div className="space-y-4">
              <div>
                <label htmlFor="reason-select" className="block text-sm font-bold text-[#051E3C] mb-2">Raison (Obligatoire)</label>
                <select 
                  id="reason-select"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-vanz-teal"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  title="Sélectionner la raison du problème"
                >
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description-input" className="block text-sm font-bold text-[#051E3C] mb-2">Détails de l'incident (Obligatoire)</label>
                <textarea 
                  id="description-input"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-vanz-teal resize-none h-24"
                  placeholder="Expliquez exactement ce qui s'est passé..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  title="Description du litige"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#051E3C] mb-2">Preuves / Photos (Optionnel)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition" onClick={() => document.getElementById('dispute-photos')?.click()}>
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500">
                    {photos.length > 0 ? `${photos.length} photo(s) sélectionnée(s)` : "Ajouter jusqu'à 3 photos"}
                  </p>
                  <input id="dispute-photos" type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} title="Télécharger des photos" aria-label="Télécharger des photos" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ouvrir Litige'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
