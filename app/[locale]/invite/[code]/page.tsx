import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { datasql as supabase } from '@/lib/datasql';
import Link from 'next/link';

export const metadata = {
  title: 'Invitation VanZ - 10 TND offerts sur votre premier transport',
  description: 'Un ami vous a invité sur VanZ. Inscrivez-vous avec son code et gagnez 10 TND !'
};

export default async function InviteLanding({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  const t = await getTranslations({ locale });

  if (!code) notFound();
  
  // Verify code in DB
  const { data: referrer } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('referral_code', code.toUpperCase())
    .single();

  if (!referrer) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <main className="flex-1 flex items-center justify-center p-6">
         <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-[#051E3C] p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/grid-pattern.svg')]"></div>
               <h1 className="text-3xl font-black text-white relative z-10">
                 {referrer.first_name} vous a invité !
               </h1>
               <p className="text-vanz-teal font-bold mt-2 text-lg">Rejoignez VanZ aujourd'hui.</p>
            </div>
            
            <div className="p-8 text-center space-y-6">
               <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="text-3xl font-black text-vanz-yellow">10</span>
                 <span className="text-sm font-bold text-gray-500 ml-1">TND</span>
               </div>
               
               <p className="text-gray-600 text-[15px] leading-relaxed">
                 Utilisez le code de {referrer.first_name} lors de votre inscription sur l'application VanZ et recevez <strong>10 TND</strong> de crédit pour votre premier transport. 
               </p>

               <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                 <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Votre code promo</p>
                 <p className="text-2xl font-black text-[#051E3C] tracking-widest">{code.toUpperCase()}</p>
               </div>

               <div className="pt-6">
                 <Link 
                   href="#"
                   className="block w-full bg-vanz-yellow hover:bg-yellow-400 text-[#051E3C] font-black text-lg py-4 rounded-xl shadow-md transition-all transform hover:-translate-y-1"
                 >
                   Télécharger l'App (Bientôt)
                 </Link>
                 <p className="text-xs text-gray-400 mt-4 font-medium">Valable uniquement pour les nouveaux utilisateurs lors de leur première commande.</p>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}
