"use client";

import { DriverFormData } from "@/app/[locale]/devenir-chauffeur/page";
import { CheckCircle, MessageCircle, Clock, ShieldCheck, MapPin, Truck } from "lucide-react";
import { useLocale } from "next-intl";

interface Props {
  data: DriverFormData;
  onBack: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  status?: "pending" | "approved";
}

export default function Step5Confirmation({ data, t, status }: Props) {
  const locale = useLocale();
  return (
    <div className="max-w-xl mx-auto text-center animate-in zoom-in-95 fade-in duration-700 py-12">
      
      <div className="flex justify-center mb-8 relative">
        <div className="absolute inset-0 bg-vanz-teal/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <div className="relative w-24 h-24 bg-vanz-teal text-white rounded-full flex items-center justify-center mb-4 ring-8 ring-vanz-teal/10 shadow-xl shadow-vanz-teal/20">
          <CheckCircle className="w-12 h-12" />
        </div>
      </div>
      
      <h2 className="text-3xl font-black text-vanz-navy mb-4">
        {status === 'approved' 
          ? "Compte Activé !" 
          : (t("confirmTitle") || "Candidature Envoyée !")
        }
      </h2>
      
      <p className="text-gray-600 mb-10 px-6 text-lg leading-relaxed max-w-lg mx-auto">
        {status === 'approved'
          ? "Félicitations ! Votre compte est prêt. Vous pouvez dès maintenant consulter les missions disponibles."
          : (t("confirmDesc") || "Merci pour votre inscription. Notre équipe examine actuellement vos documents. Vous recevrez une notification d'ici 24-48h.")
        }
      </p>

      <div className="grid grid-cols-1 gap-4 mb-10 text-left">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-vanz-navy/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-24 h-24 text-vanz-navy" />
          </div>
          
          <div className="flex items-center justify-between font-bold text-sm mb-8">
            <div className="flex items-center gap-2 text-vanz-navy">
              <Clock className="w-5 h-5 text-vanz-teal" />
              <span className="uppercase tracking-widest text-xs">Statut du Dossier</span>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-black border animate-pulse ${
                status === 'approved' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-vanz-yellow/20 text-vanz-navy border-vanz-yellow/30'
              }`}>
               {status === 'approved' ? "APPROUVÉ ✅" : (t("pendingBadge") || "EN ATTENTE")}
             </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Ville
              </span>
              <p className="font-bold text-vanz-navy text-base">{data.city}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold flex items-center gap-1">
                <Truck className="w-3 h-3" /> Véhicule
              </span>
              <p className="font-bold text-vanz-navy text-base">{data.brand} {data.model}</p>
            </div>

            <div className="space-y-1 md:col-span-2 pt-2 border-t border-gray-50">
              <span className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Identité</span>
              <p className="font-bold text-vanz-navy text-base">{data.firstName} {data.lastName}</p>
              <p className="text-sm text-gray-500 font-medium">+216 {data.phone}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
         {status === 'approved' ? (
           <a
             href={`/${locale}/mes-missions`}
             className="w-full bg-vanz-teal text-white font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-3 shadow-xl shadow-vanz-teal/20"
           >
             Accéder à mon tableau de bord 🚚
           </a>
         ) : (
           <a
             href={`https://wa.me/21655123456?text=Bonjour, je viens de soumettre mon dossier chauffeur sur VanZ. Mon numéro est le ${data.phone}.`}
             target="_blank"
             rel="noopener noreferrer"
             className="w-full bg-[#25D366] text-white font-black py-5 rounded-2xl hover:brightness-105 active:scale-95 transition-all flex justify-center items-center gap-3 shadow-xl shadow-green-500/20 group"
           >
             <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
             {t("whatsappSupport") || "Contacter le support WhatsApp"}
           </a>
         )}
        
        <p className="text-[11px] text-gray-400 font-medium">
          Réf: DRV-{data.phone.slice(-4)}-{new Date().getFullYear()}
        </p>
      </div>
      
    </div>
  );
}
