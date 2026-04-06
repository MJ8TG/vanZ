'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { datasql } from '@/lib/datasql';
import { 
  Truck, MapPin, Package, Calendar, Clock, DollarSign, 
  ChevronRight, ChevronLeft, Check, Camera, X, Loader2,
  Navigation, Shield, Zap, Sofa, Boxes, Building2, Timer
} from 'lucide-react';

import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

const TUNISIAN_GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan", 
  "Kasserine", "Kébili", "Le Kef", "Mahdia", "Manouba", "Médenine", "Monastir", 
  "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"
];

export default function NouveauJobPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('nouveauJob');
  const tCommon = useTranslations('common');
  const tServices = useTranslations('services');
  
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [serviceType, setServiceType] = useState('moving');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [loadCapacity, setLoadCapacity] = useState('van_s');
  const [scheduledDate, setScheduledDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('morning');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const SERVICES = [
    { key: 'moving', icon: Truck, colorClass: 'text-vanz-teal' },
    { key: 'furniture', icon: Sofa, colorClass: 'text-vanz-yellow-dark' },
    { key: 'parcel', icon: Boxes, colorClass: 'text-blue-500' },
    { key: 'express', icon: Zap, colorClass: 'text-purple-500' },
    { key: 'office', icon: Building2, colorClass: 'text-vanz-navy' },
    { key: 'intercity', icon: Navigation, colorClass: 'text-green-500' }
  ];

  const VEHICLE_SIZES = [
    { key: 'moto', label: t('vehicles.moto') || 'Moto / Scooter', capacity: 'Max 20kg' },
    { key: 'van_s', label: t('vehicles.van_s') || 'Petit Van', capacity: 'Max 500kg' },
    { key: 'van_xl', label: t('vehicles.van_xl') || 'Grand Van / Pickup', capacity: 'Max 1.5t' },
    { key: 'camion', label: t('vehicles.camion') || 'Camionette', capacity: 'Max 3.5t' }
  ];

  const TIME_SLOTS = [
    { key: 'morning', label: t('form.morning') || 'Matin', desc: '08:00 - 12:00' },
    { key: 'afternoon', label: t('form.afternoon') || 'Après-midi', desc: '12:00 - 18:00' },
    { key: 'evening', label: t('form.evening') || 'Soir', desc: '18:00 - 21:00' },
    { key: 'anytime', label: t('form.anytime') || 'Flexible', desc: 'Toute la journée' }
  ];

  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await datasql.auth.getUser();
      if (!user) {
        router.push(`/${locale}/test-login`);
        return;
      }
      setLoading(false);
    };
    checkUser();
  }, [locale, router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingPhoto(true);
    setError(null);

    try {
      const file = e.target.files[0];
      const fakeUrl = URL.createObjectURL(file);
      setPhotos(prev => [...prev, fakeUrl]);
    } catch (err) {
      setError(locale === 'ar' ? "خطأ في تحميل الصورة" : "Erreur lors de l'envoi de la photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateStep = () => {
    if (step === 2) {
      if (!pickupAddress || !dropoffAddress) {
        setError(locale === 'ar' ? "يرجى اختيار عنوان الانطلاق والوصول" : "Veuillez choisir les adresses de départ et d'arrivée.");
        return false;
      }
    }
    if (step === 3) {
      if (!scheduledDate) {
        setError(locale === 'ar' ? "يرجى اختيار تاريخ" : "Veuillez choisir une date.");
        return false;
      }
      if (new Date(scheduledDate) < new Date(todayDate)) {
        setError(locale === 'ar' ? "التاريخ لا يمكن أن يكون في الماضي" : "La date ne peut pas être dans le passé.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!budget || Number(budget) <= 0) {
      setError(locale === 'ar' ? "يرجى تحديد المبلغ" : "Veuillez indiquer un budget (ex: 50 TND).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await datasql.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error: insertErr } = await datasql
        .from('jobs')
        .insert({
          client_id: user.id,
          service_type: serviceType,
          pickup_address: pickupAddress,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_address: dropoffAddress,
          dropoff_lat: dropoffLat,
          dropoff_lng: dropoffLng,
          load_capacity: loadCapacity,
          scheduled_at: scheduledDate,
          time_slot: timeSlot,
          description: description,
          client_budget: parseFloat(budget),
          status: 'open',
          photo_urls: photos
        });

      if (insertErr) throw insertErr;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || (locale === 'ar' ? "حدث خطأ أثناء النشر" : "Une erreur est survenue lors de la publication."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-vanz-teal animate-spin" aria-label="Initialisation..." />
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl p-12 text-center max-w-md w-full animate-in zoom-in fade-in duration-500">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-green-100">
               <Check className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-vanz-navy mb-4">{t('success.title')}</h2>
            <p className="text-gray-500 font-medium mb-10 leading-relaxed">
              {t('success.desc')}
            </p>
            <button
              onClick={() => router.push(`/${locale}/mes-missions`)}
              className="w-full py-5 bg-vanz-teal text-white font-black text-lg rounded-2xl shadow-xl shadow-vanz-teal/20 hover:brightness-110 active:scale-95 transition-all"
            >
              {t('success.cta')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 pb-32 md:py-20 md:pb-20">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-vanz-navy mb-4 tracking-tight">{t('title')}</h1>
          <p className="text-lg text-gray-500 font-medium">{t('subtitle')}</p>
        </div>

        <div className="max-w-2xl mx-auto w-full">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between text-[10px] md:text-xs font-black text-gray-400 mb-3 px-1">
              <span className={step >= 1 ? 'text-vanz-teal' : ''}>{t('steps.service')}</span>
              <span className={step >= 2 ? 'text-vanz-teal' : ''}>{t('steps.address')}</span>
              <span className={step >= 3 ? 'text-vanz-teal' : ''}>{t('steps.details')}</span>
              <span className={step >= 4 ? 'text-vanz-teal' : ''}>{t('steps.confirm')}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-100">
              <div 
                className={`h-full bg-vanz-teal rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(43,191,223,0.3)] ${
                  step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'
                }`}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-5 rounded-2xl text-sm font-bold mb-8 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 opacity-70" />
                {error}
              </div>
              <button onClick={() => setError(null)} className="hover:scale-110 transition-transform" title="Fermer l'alerte">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Steps */}
          {step === 1 && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-vanz-navy/5 border border-gray-100 p-8 md:p-10">
                   <h2 className="text-2xl font-black text-vanz-navy mb-8 flex items-center gap-3">
                     <span className="w-10 h-10 rounded-xl bg-vanz-ice flex items-center justify-center">
                        <Truck className="w-6 h-6 text-vanz-teal" />
                     </span>
                     {t('form.serviceTitle')}
                   </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     {SERVICES.map((svc) => (
                       <button
                         key={svc.key}
                         title={`Service: ${tServices(svc.key)}`}
                         onClick={() => setServiceType(svc.key)}
                         className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col gap-2 ${
                           serviceType === svc.key 
                             ? 'border-vanz-teal bg-vanz-ice shadow-lg shadow-vanz-teal/5' 
                             : 'border-transparent bg-gray-50 hover:bg-gray-100'
                         }`}
                       >
                         {serviceType === svc.key && (
                           <div className="absolute top-4 right-4 w-6 h-6 bg-vanz-teal rounded-full flex items-center justify-center">
                             <Check className="w-4 h-4 text-white" />
                           </div>
                         )}
                         <svc.icon className={`w-10 h-10 mb-2 ${svc.colorClass}`} />
                         <div>
                            <p className="font-black text-vanz-navy text-lg">{tServices(svc.key)}</p>
                            <p className="text-sm text-gray-500 font-medium">{tServices(`${svc.key}Desc`)}</p>
                         </div>
                       </button>
                     ))}
                   </div>
                </div>
             </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-[2.5rem] shadow-xl shadow-vanz-navy/5 border border-gray-100 p-8 md:p-10">
                  <h2 className="text-2xl font-black text-vanz-navy mb-8 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-vanz-ice flex items-center justify-center">
                       <MapPin className="w-6 h-6 text-green-500" />
                    </span>
                    {t('steps.address')}
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="pickupGov" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">{t('form.pickup')}</label>
                      <div className="flex flex-col gap-3">
                        <AddressAutocomplete 
                          value={pickupAddress}
                          onChange={setPickupAddress}
                          onSelectCoordinates={(lat, lng) => {
                             setPickupLat(lat);
                             setPickupLng(lng);
                          }}
                          placeholder={t('form.pickupDetailsPlaceholder')}
                          icon={<MapPin className="absolute ltr:left-5 rtl:right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-green-500" />}
                        />
                      </div>
                    </div>

                    <div className="flex justify-center -my-3 relative z-10">
                      <div className="w-10 h-10 bg-vanz-navy rounded-full flex items-center justify-center shadow-lg">
                        <Navigation className="w-5 h-5 text-white rotate-180" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="dropoffGov" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">{t('form.dropoff')}</label>
                      <div className="flex flex-col gap-3">
                        <AddressAutocomplete 
                          value={dropoffAddress}
                          onChange={setDropoffAddress}
                          onSelectCoordinates={(lat, lng) => {
                             setDropoffLat(lat);
                             setDropoffLng(lng);
                          }}
                          placeholder={t('form.dropoffDetailsPlaceholder')}
                          icon={<MapPin className="absolute ltr:left-5 rtl:right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-vanz-yellow" />}
                        />
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-[2.5rem] shadow-xl shadow-vanz-navy/5 border border-gray-100 p-8 md:p-10">
                  <h2 className="text-2xl font-black text-vanz-navy mb-8 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-vanz-ice flex items-center justify-center">
                       <Package className="w-6 h-6 text-[#7B61FF]" />
                    </span>
                    {t('steps.details')}
                  </h2>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">{t('form.vehicleType')}</label>
                      <div className="grid grid-cols-2 gap-4">
                        {VEHICLE_SIZES.map((v) => (
                          <button
                            key={v.key}
                            title={`Véhicule: ${v.label}`}
                            onClick={() => setLoadCapacity(v.key)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              loadCapacity === v.key 
                                ? 'border-vanz-teal bg-vanz-ice' 
                                : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                            }`}
                          >
                            <p className="font-black text-vanz-navy">{v.label}</p>
                            <p className="text-xs text-gray-500 font-bold">{v.capacity}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="scheduledDate" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('form.date')}</label>
                        <input
                          id="scheduledDate"
                          type="date"
                          title="Date"
                          value={scheduledDate}
                          min={todayDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full px-6 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-vanz-teal outline-none font-bold text-vanz-navy"
                        />
                      </div>
                      <div>
                        <label htmlFor="timeSlot" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('form.timeSlot')}</label>
                        <select
                          id="timeSlot"
                          title="Heure"
                          value={timeSlot}
                          onChange={(e) => setTimeSlot(e.target.value)}
                          className="w-full px-6 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-vanz-teal outline-none font-bold text-vanz-navy appearance-none"
                        >
                          {TIME_SLOTS.map(ts => (
                            <option key={ts.key} value={ts.key}>{ts.label} ({ts.desc})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="jobDescription" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('form.description')}</label>
                      <textarea
                        id="jobDescription"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('form.descriptionPlaceholder')}
                        className="w-full px-6 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-vanz-teal outline-none font-bold text-vanz-navy resize-none"
                      />
                    </div>

                    <div>
                      <p className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Photos (Optionnel)</p>
                      <div className="flex flex-wrap gap-4">
                        {photos.map((url, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden group">
                            <img src={url} alt={`Aperçu ${i}`} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setPhotos(prev => prev.filter((_, j) => i !== j))}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete photo"
                            >
                              <X className="w-6 h-6 text-white" />
                            </button>
                          </div>
                        ))}
                        {photos.length < 5 && (
                          <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-vanz-teal hover:bg-vanz-ice transition-all group">
                            <input type="file" accept="image/*" className="hidden" title="Upload" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                            {uploadingPhoto ? <Loader2 className="w-6 h-6 text-vanz-teal animate-spin" /> : <Camera className="w-6 h-6 text-gray-400 group-hover:text-vanz-teal" />}
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-[2.5rem] shadow-xl shadow-vanz-navy/5 border border-gray-100 p-8 md:p-10">
                  <h2 className="text-2xl font-black text-vanz-navy mb-8 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-vanz-ice flex items-center justify-center">
                       <Zap className="w-6 h-6 text-vanz-yellow" />
                    </span>
                    {t('steps.confirm')}
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-vanz-ice/30 p-6 rounded-3xl border border-vanz-teal/10">
                       <h3 className="text-sm font-black text-vanz-teal uppercase tracking-widest mb-4">Résumé</h3>
                       <div className="flex flex-col gap-2">
                        <p className="font-bold text-sm text-vanz-navy">📍 {pickupAddress || 'Non spécifié'}</p>
                        <p className="font-bold text-sm text-vanz-navy">🎯 {dropoffAddress || 'Non spécifié'}</p>
                       </div>
                    </div>

                    <div>
                      <label htmlFor="budget" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('form.budget')}</label>
                      <div className="relative">
                        <div className="absolute ltr:left-5 rtl:right-5 top-1/2 -translate-y-1/2 font-black text-vanz-teal">{tCommon('tnd')}</div>
                        <input
                          id="budget"
                          type="number"
                          placeholder={t('form.budgetPlaceholder')}
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="w-full ltr:pl-16 rtl:pr-16 ltr:pr-6 rtl:pl-6 py-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-vanz-teal focus:bg-white outline-none font-black text-2xl text-vanz-navy transition-all"
                        />
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 md:mt-12 flex gap-4 sticky bottom-4 md:static pb-4 md:pb-0 z-20">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 py-5 rounded-2xl border-2 border-gray-100 bg-white text-vanz-navy font-black text-lg hover:border-gray-200 shadow-lg md:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-6 h-6" />
                {t('actions.prev')}
              </button>
            )}
            
            <button
              onClick={step === totalSteps ? handleSubmit : nextStep}
              disabled={submitting}
              className={`py-5 rounded-2xl font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl ${
                step === totalSteps 
                  ? 'flex-1 bg-vanz-yellow text-vanz-navy shadow-vanz-yellow/20' 
                  : 'flex-[2] bg-vanz-navy text-white shadow-vanz-navy/20'
              } hover:brightness-110 disabled:opacity-50`}
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {step === totalSteps ? t('actions.submit') : t('actions.next')}
                  {step < totalSteps && <ChevronRight className="w-6 h-6" />}
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
