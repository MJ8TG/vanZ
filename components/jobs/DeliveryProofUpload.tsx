'use client';

import { useState } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { Camera, CheckCircle2, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface DeliveryProofUploadProps {
  jobId: string;
  driverId: string;
  bidAmount?: number;
  onProofUploaded: () => void;
}

export function DeliveryProofUpload({ jobId, driverId, bidAmount, onProofUploaded }: DeliveryProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'acquiring' | 'acquired' | 'denied'>('idle');

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setGeoStatus('acquiring');

    try {
      // 1. Get geo coordinates with graceful fallback
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setGeoStatus('acquired');
      } catch {
        setGeoStatus('denied');
        // Continue without geo — not a blocker
      }

      // 2. Upload photo to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${driverId}/delivery_${jobId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw new Error("Erreur d'upload: " + uploadError.message);

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      // 3. Call the completion API
      const res = await fetch('/api/jobs/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          driver_id: driverId,
          delivery_photo_url: urlData.publicUrl,
          delivery_photo_lat: lat,
          delivery_photo_lng: lng
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la validation.');
      }

      setSuccess(true);
      if (onProofUploaded) onProofUploaded();

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Erreur lors de l'enregistrement de la preuve de livraison.");
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 p-8 rounded-2xl flex flex-col items-center justify-center text-green-600 border border-green-100">
        <CheckCircle2 className="w-16 h-16 mb-3" />
        <p className="font-black text-xl">Livraison Validée !</p>
        <p className="text-sm font-medium opacity-80 mt-2">Le reçu a été envoyé au client.</p>
        {bidAmount && (
          <p className="mt-4 text-green-700 font-black text-2xl">{bidAmount} <span className="text-base font-normal">TND</span></p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-dashed border-[#2BBFDF]/30 p-6 rounded-2xl text-center">
      <div className="w-14 h-14 bg-[#E8F8FA] text-[#2BBFDF] rounded-full flex items-center justify-center mx-auto mb-4">
        <Camera className="w-7 h-7" />
      </div>
      <h3 className="font-black text-[#051E3C] mb-2 text-lg">Preuve de Livraison Obligatoire</h3>
      <p className="text-sm text-gray-500 font-medium mb-6">
        Pour clôturer cette course et garantir votre paiement, vous devez prendre une photo matérielle du dépôt.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm font-medium mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {geoStatus === 'denied' && (
        <div className="bg-amber-50 text-amber-700 border border-amber-100 p-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          Localisation indisponible — la photo sera enregistrée sans coordonnées GPS.
        </div>
      )}

      {file ? (
        <div className="mb-6 relative w-40 h-40 mx-auto rounded-xl overflow-hidden shadow-lg border-2 border-vanz-teal/20">
          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
          <button 
            onClick={() => setFile(null)} 
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-black/80 transition"
            aria-label="Supprimer la photo"
            title="Supprimer"
          >
            ✕
          </button>
        </div>
      ) : (
        <label htmlFor="delivery-photo-input" className="block w-full bg-gray-50 text-[#051E3C] py-4 rounded-xl font-bold cursor-pointer hover:bg-gray-100 transition mb-4 border border-gray-200">
          📷 Ouvrir l&apos;appareil photo
          <input 
            id="delivery-photo-input"
            type="file" 
            accept="image/*" 
            {...({ capture: 'environment' } as any)}
            className="hidden" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            title="Choisir un fichier photo"
            aria-label="Choisir un fichier photo"
          />
        </label>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full bg-[#2BBFDF] text-white py-4 rounded-xl font-bold hover:bg-[#1A99B4] transition disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Validation en cours...</>
        ) : (
          'Terminer la Course'
        )}
      </button>
    </div>
  );
}
