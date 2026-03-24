'use client';

import { useState } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { Camera, CheckCircle2 } from 'lucide-react';

interface DeliveryProofUploadProps {
  jobId: string;
  driverId: string;
  onProofUploaded: () => void;
}

export function DeliveryProofUpload({ jobId, driverId, onProofUploaded }: DeliveryProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get exact current geo coords for strict proof mapping
      const pos: GeolocationPosition = await new Promise((resolve, reject) => {
         navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // 2. Upload photo to bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `delivery-photos/${jobId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      // 3. Update job schema explicitly locking the photo strings before status update
      const { error: dbError } = await supabase.from('jobs').update({
        delivery_photo_url: urlData.publicUrl,
        delivery_photo_lat: pos.coords.latitude,
        delivery_photo_lng: pos.coords.longitude,
        delivery_photo_at: new Date().toISOString(),
        status: 'completed' // This triggers the job-completed secure Edge Webhook!
      }).eq('id', jobId).eq('accepted_bid_id', driverId); // Ensure security bind

      if (dbError) throw dbError;

      setSuccess(true);
      if (onProofUploaded) onProofUploaded();

    } catch (e: any) {
      console.error(e);
      alert("Erreur lors de l'enregistrement de la preuve de livraison.");
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
     return (
       <div className="bg-green-50 p-6 rounded-2xl flex flex-col items-center justify-center text-green-600 border border-green-100">
         <CheckCircle2 className="w-12 h-12 mb-2" />
         <p className="font-bold">Livraison Validée !</p>
         <p className="text-sm font-medium opacity-80 mt-1">Le reçu a été envoyé au client.</p>
       </div>
     );
  }

  return (
    <div className="bg-white border-2 border-dashed border-[#2BBFDF]/30 p-6 rounded-2xl text-center">
      <div className="w-12 h-12 bg-[#E8F8FA] text-[#2BBFDF] rounded-full flex items-center justify-center mx-auto mb-4">
        <Camera className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-[#051E3C] mb-2">Preuve de Livraison Obligatoire</h3>
      <p className="text-sm text-gray-500 font-medium mb-6">
        Pour clôturer cette course et garantir votre paiement, vous devez prendre une photo matérielle du dépôt.
      </p>

      {file ? (
        <div className="mb-6 relative w-32 h-32 mx-auto rounded-xl overflow-hidden shadow-sm">
          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
          <button onClick={() => setFile(null)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 text-xs">✕</button>
        </div>
      ) : (
        <label className="block w-full bg-gray-50 text-[#051E3C] py-4 rounded-xl font-bold cursor-pointer hover:bg-gray-100 transition mb-4">
          Ouvrir l'appareil photo
          <input 
             type="file" 
             accept="image/*" 
             capture="environment" 
             className="hidden" 
             onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full bg-[#2BBFDF] text-white py-4 rounded-xl font-bold hover:bg-[#1A99B4] transition disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
      >
        {isUploading ? 'Validation...' : 'Terminer la Course'}
      </button>
    </div>
  );
}
