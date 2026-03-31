'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { datasql } from '@/lib/datasql';
import Navbar from '@/components/homepage/Navbar';
import Footer from '@/components/homepage/Footer';
import { 
  Truck, Sofa, Package, MapPinned, Building2, Zap,
  MapPin, Navigation, Camera, Clock, DollarSign, 
  ChevronRight, ChevronLeft, Check, Loader2, Plus, X,
  CalendarDays, FileText, Shield
} from 'lucide-react';

// ─── Service Types ─────────────────────────────────────────
const SERVICES = [
  { key: 'moving', label: 'Déménagement', desc: 'Maison / Appartement complet', icon: Truck, colorClass: 'text-[#2BBFDF]' },
  { key: 'furniture', label: 'Transport Meuble', desc: 'Canapé, lit, table...', icon: Sofa, colorClass: 'text-[#F5A623]' },
  { key: 'parcel', label: 'Livraison Colis', desc: 'Cartons, électroménager', icon: Package, colorClass: 'text-[#7B61FF]' },
  { key: 'intercity', label: 'Intervilles', desc: 'Tunis ↔ Sfax, Sousse...', icon: MapPinned, colorClass: 'text-[#E74C6F]' },
  { key: 'office', label: 'Bureaux & Pro', desc: 'Entreprise, machines', icon: Building2, colorClass: 'text-[#34C759]' },
  { key: 'express', label: 'Express', desc: 'Livraison rapide < 2h', icon: Zap, colorClass: 'text-[#FF9500]' },
];

const VEHICLE_SIZES = [
  { key: 'moto', label: 'Moto / Scooter', desc: 'Petits colis < 20kg', capacity: '20 kg' },
  { key: 'van_s', label: 'Petit Van', desc: 'Cartons, petit meuble', capacity: '300 kg' },
  { key: 'van_xl', label: 'Grand Van', desc: 'Studio / 2 pièces', capacity: '800 kg' },
  { key: 'camion', label: 'Camion', desc: 'Appartement complet', capacity: '2000 kg' },
];

const TIME_SLOTS = [
  { key: 'morning', label: 'Matin', desc: '08h – 12h', icon: '🌅' },
  { key: 'afternoon', label: 'Après-midi', desc: '12h – 18h', icon: '☀️' },
  { key: 'evening', label: 'Soir', desc: '18h – 22h', icon: '🌆' },
  { key: 'flexible', label: 'Flexible', desc: 'Je suis disponible', icon: '🤷' },
];

export default function NouveauJobPage() {
  const router = useRouter();
  const locale = useLocale();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [serviceType, setServiceType] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loadCapacity, setLoadCapacity] = useState('');
  const [clientBudget, setClientBudget] = useState('');
  const [timeSlot, setTimeSlot] = useState('flexible');
  const [scheduledDate, setScheduledDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [insuranceSelected, setInsuranceSelected] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    setTodayDate(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await datasql.auth.getUser();
      if (user) setUserId(user.id);
    };
    checkAuth();
  }, []);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/job_${Date.now()}.${ext}`;
      const { error: upErr } = await datasql.storage.from('documents').upload(path, file);
      if (upErr) throw upErr;
      const { data } = datasql.storage.from('documents').getPublicUrl(path);
      setPhotos(prev => [...prev, data.publicUrl]);
    } catch {
      setError("Erreur lors de l'upload de la photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Submit job
  const handleSubmit = async () => {
    if (!userId) {
      alert("⚠️ Vous devez être connecté pour publier une mission.");
        router.push(`/${locale}/login`);
        return;
      }

    setLoading(true);
    setError(null);

    try {
      const { error: insertErr } = await datasql.from('jobs').insert({
        client_id: userId,
        service_type: serviceType,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        description,
        load_capacity: loadCapacity,
        client_budget: clientBudget ? parseFloat(clientBudget) : null,
        time_slot: timeSlot,
        scheduled_at: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        payment_method: paymentMethod,
        insurance_selected: insuranceSelected,
        photo_urls: photos.length > 0 ? photos : null,
        status: 'open'
      });

      if (insertErr) throw insertErr;

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/mes-missions`);
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!serviceType;
      case 2: return pickupAddress.length >= 3 && dropoffAddress.length >= 3;
      case 3: return !!loadCapacity;
      case 4: return true;
      default: return false;
    }
  };

  const handleNextStep = () => {
    if (canProceed()) {
      setStep(s => s + 1);
      window.scrollTo(0, 0);
    } else {
      // Visual feedback
      if (step === 3 && !loadCapacity) {
        setError("Veuillez sélectionner la taille du véhicule pour continuer.");
      } else if (step === 2 && (pickupAddress.length < 3 || dropoffAddress.length < 3)) {
        setError("Veuillez renseigner les adresses de prise en charge et de destination.");
      }
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md mx-4 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-vanz-navy mb-3">Mission Publiée !</h2>
            <p className="text-gray-500 font-medium mb-2">Les chauffeurs près de chez vous vont recevoir votre demande.</p>
            <p className="text-sm text-vanz-teal font-bold animate-pulse mt-6">Redirection vers vos missions...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-vanz-navy mb-2">
              Nouvelle Mission
            </h1>
            <p className="text-gray-500 font-medium">
              Décrivez votre besoin, recevez des offres en temps réel.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
              <span className={step >= 1 ? 'text-vanz-teal' : ''}>Service</span>
              <span className={step >= 2 ? 'text-vanz-teal' : ''}>Adresses</span>
              <span className={step >= 3 ? 'text-vanz-teal' : ''}>Détails</span>
              <span className={step >= 4 ? 'text-vanz-teal' : ''}>Confirmer</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-vanz-teal to-[#20A8C5] rounded-full transition-all duration-500 ${
                  step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'
                }`}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0 cursor-pointer" onClick={() => setError(null)} />
              {error}
            </div>
          )}

          {/* ─── STEP 1: Service Type ─── */}
          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-in fade-in slide-in-from-right-5 duration-300">
              <h2 className="text-xl font-black text-vanz-navy mb-6 flex items-center gap-3">
                <Truck className="w-6 h-6 text-vanz-teal" />
                Quel service recherchez-vous ?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {SERVICES.map((svc) => (
                  <button
                    key={svc.key}
                    onClick={() => setServiceType(svc.key)}
                    className={`relative p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md active:scale-[0.98] ${
                      serviceType === svc.key 
                        ? 'border-vanz-teal bg-vanz-ice shadow-lg' 
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    {serviceType === svc.key && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-vanz-teal rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <svc.icon className={`w-8 h-8 mb-3 ${svc.colorClass}`} />
                    <p className="font-bold text-vanz-navy text-sm">{svc.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{svc.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 2: Addresses ─── */}
          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-in fade-in slide-in-from-right-5 duration-300">
              <h2 className="text-xl font-black text-vanz-navy mb-6 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-vanz-teal" />
                D&apos;où à où ?
              </h2>

              <div className="space-y-5">
                {/* Pickup */}
                <div>
                  <label htmlFor="pickup" className="block text-sm font-bold text-gray-600 mb-2">
                    📍 Adresse de prise en charge
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    <input
                      id="pickup"
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Ex: Lac 2, Tunis"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-vanz-teal focus:ring-0 outline-none text-vanz-navy font-medium transition-colors"
                    />
                  </div>
                </div>

                {/* Visual connector */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-0.5 h-3 bg-gray-200" />
                    <Navigation className="w-4 h-4 text-gray-300 rotate-180" />
                    <div className="w-0.5 h-3 bg-gray-200" />
                  </div>
                </div>

                {/* Dropoff */}
                <div>
                  <label htmlFor="dropoff" className="block text-sm font-bold text-gray-600 mb-2">
                    📍 Adresse de livraison
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                    <input
                      id="dropoff"
                      type="text"
                      value={dropoffAddress}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                      placeholder="Ex: La Marsa, Tunis"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-vanz-teal focus:ring-0 outline-none text-vanz-navy font-medium transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Details ─── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              {/* Vehicle Size */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-xl font-black text-vanz-navy mb-6 flex items-center gap-3">
                  <Truck className="w-6 h-6 text-vanz-teal" />
                  Taille du véhicule
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {VEHICLE_SIZES.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => setLoadCapacity(v.key)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        loadCapacity === v.key 
                          ? 'border-vanz-teal bg-vanz-ice' 
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <p className="font-bold text-vanz-navy text-sm">{v.label}</p>
                      <p className="text-xs text-gray-400">{v.desc}</p>
                      <p className="text-[10px] font-bold text-vanz-teal mt-1">Max {v.capacity}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-lg font-black text-vanz-navy mb-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-vanz-teal" />
                  Quand ?
                </h2>
                
                <div className="mb-4">
                  <label htmlFor="scheduled-date" className="block text-sm font-bold text-gray-600 mb-2">
                    <CalendarDays className="w-4 h-4 inline mr-1" /> Date souhaitée
                  </label>
                  <input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={todayDate}
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-100 focus:border-vanz-teal outline-none font-medium text-vanz-navy"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((ts) => (
                    <button
                      key={ts.key}
                      onClick={() => setTimeSlot(ts.key)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        timeSlot === ts.key 
                          ? 'border-vanz-teal bg-vanz-ice' 
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-lg block">{ts.icon}</span>
                      <p className="text-[10px] font-bold text-vanz-navy mt-1">{ts.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description & Photos */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-lg font-black text-vanz-navy mb-4 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-vanz-teal" />
                  Description & Photos
                </h2>
                
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez les objets à transporter, l'étage, les accès..."
                  rows={3}
                  className="w-full py-3 px-4 rounded-xl border-2 border-gray-100 focus:border-vanz-teal outline-none font-medium text-vanz-navy resize-none mb-4"
                />

                {/* Photo Grid */}
                <div className="flex gap-3 flex-wrap">
                  {photos.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                      <img src={url} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-[10px]"
                        aria-label="Supprimer la photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-vanz-teal hover:bg-vanz-ice transition-colors">
                      {uploadingPhoto ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-gray-400" />
                          <span className="text-[9px] text-gray-400 font-bold mt-1">Ajouter</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} title="Ajouter une photo" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Review & Confirm ─── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-xl font-black text-vanz-navy mb-6">Récapitulatif</h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500 font-medium">Service</span>
                    <span className="font-bold text-vanz-navy">{SERVICES.find(s => s.key === serviceType)?.label}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500 font-medium">Départ</span>
                    <span className="font-bold text-vanz-navy text-right max-w-[60%]">{pickupAddress}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500 font-medium">Arrivée</span>
                    <span className="font-bold text-vanz-navy text-right max-w-[60%]">{dropoffAddress}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500 font-medium">Véhicule</span>
                    <span className="font-bold text-vanz-navy">{VEHICLE_SIZES.find(v => v.key === loadCapacity)?.label}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500 font-medium">Créneau</span>
                    <span className="font-bold text-vanz-navy">{TIME_SLOTS.find(t => t.key === timeSlot)?.label}</span>
                  </div>
                  {description && (
                    <div className="py-3 border-b border-gray-50">
                      <span className="text-sm text-gray-500 font-medium block mb-1">Description</span>
                      <p className="text-sm text-vanz-navy font-medium">{description}</p>
                    </div>
                  )}
                  {photos.length > 0 && (
                    <div className="py-3">
                      <span className="text-sm text-gray-500 font-medium block mb-2">Photos ({photos.length})</span>
                      <div className="flex gap-2">
                        {photos.map((url, i) => (
                          <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget & Payment */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-lg font-black text-vanz-navy mb-4 flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-vanz-teal" />
                  Budget & Paiement
                </h2>

                <div className="mb-5">
                  <label htmlFor="budget" className="block text-sm font-bold text-gray-600 mb-2">
                    Budget indicatif (optionnel)
                  </label>
                  <div className="relative">
                    <input
                      id="budget"
                      type="number"
                      value={clientBudget}
                      onChange={(e) => setClientBudget(e.target.value)}
                      placeholder="Ex: 80"
                      className="w-full py-3 px-4 pr-16 rounded-xl border-2 border-gray-100 focus:border-vanz-teal outline-none font-bold text-vanz-navy text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">TND</span>
                  </div>
                </div>

                <div className="flex gap-3 mb-5">
                  {[
                    { key: 'cash', label: 'Espèces', emoji: '💵' },
                    { key: 'flouci', label: 'Flouci', emoji: '📱' },
                    { key: 'card', label: 'Carte', emoji: '💳' },
                  ].map(pm => (
                    <button
                      key={pm.key}
                      onClick={() => setPaymentMethod(pm.key)}
                      className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${
                        paymentMethod === pm.key 
                          ? 'border-vanz-teal bg-vanz-ice' 
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-lg block">{pm.emoji}</span>
                      <p className="text-xs font-bold text-vanz-navy mt-1">{pm.label}</p>
                    </button>
                  ))}
                </div>

                {/* Insurance */}
                <button
                  onClick={() => setInsuranceSelected(!insuranceSelected)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    insuranceSelected 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <Shield className={`w-6 h-6 ${insuranceSelected ? 'text-green-600' : 'text-gray-300'}`} />
                  <div className="text-left flex-1">
                    <p className="font-bold text-sm text-vanz-navy">Assurance transport</p>
                    <p className="text-xs text-gray-400">Couverture en cas de dommage sur vos biens</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    insuranceSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {insuranceSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ─── Navigation Buttons ─── */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-6 py-4 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" /> Retour
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-vanz-teal text-white font-bold shadow-lg shadow-vanz-teal/20 hover:shadow-vanz-teal/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 disabled:shadow-none disabled:translate-y-0"
              >
                Continuer <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-vanz-yellow text-vanz-navy font-black text-lg shadow-lg shadow-vanz-yellow/30 hover:shadow-vanz-yellow/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Publication...</>
                ) : (
                  <>🚀 Publier ma Mission</>
                )}
              </button>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
