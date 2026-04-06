'use client';

import { useState } from 'react';
import { X, AlertTriangle, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { datasql } from '@/lib/datasql';
import { uploadFile } from '@/lib/upload';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  openerType: 'client' | 'driver';
  userId: string;
}

export default function ReportIssueModal({ isOpen, onClose, jobId, openerType, userId }: ReportIssueModalProps) {
  const t = useTranslations('dispute');
  const tCommon = useTranslations('common');

  const REASONS = [
    t('reasons.delay'),
    t('reasons.damaged'),
    t('reasons.behavior'),
    t('reasons.payment'),
    t('reasons.absent'),
    t('reasons.other')
  ];

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
      setError(t('errorMinChars'));
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
      setError(err.message || t('errorSubmit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200" title={tCommon('close')} aria-label={tCommon('close')}>
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-vanz-teal mx-auto mb-4" />
            <h2 className="text-2xl font-black text-vanz-navy mb-2">{t('successTitle')}</h2>
            <p className="text-sm text-gray-500 font-medium">
              {t('successDesc')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-vanz-navy">{t('title')}</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">{t('mission')} #{jobId.substring(0,8)}</p>
              </div>
            </div>

            {error && <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm font-bold rounded-lg">{error}</div>}

            <div className="space-y-4">
              <div>
                <label htmlFor="reason-select" className="block text-sm font-bold text-[#051E3C] mb-2">{t('reasonLabel')}</label>
                <select 
                  id="reason-select"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-vanz-teal"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  title={t('reasonPlaceholder')}
                >
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description-input" className="block text-sm font-bold text-[#051E3C] mb-2">{t('detailsLabel')}</label>
                <textarea 
                  id="description-input"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-vanz-teal resize-none h-24"
                  placeholder={t('detailsPlaceholder')}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  title={t('detailsLabel')}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#051E3C] mb-2">{t('photosLabel')}</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition" onClick={() => document.getElementById('dispute-photos')?.click()}>
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500">
                    {photos.length > 0 ? t('photoCount', { count: photos.length }) : t('addPhotos')}
                  </p>
                  <input id="dispute-photos" type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} title={tCommon('upload')} aria-label={tCommon('upload')} />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('submit')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
