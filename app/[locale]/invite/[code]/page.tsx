import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { datasql as supabase } from '@/lib/datasql';
import Link from 'next/link';
import Navbar from "@/components/homepage/Navbar";
import Footer from "@/components/homepage/Footer";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'invite' });
  
  return {
    title: t('landingTitle'),
    description: t('landingDesc')
  };
}

export default async function InviteLanding({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  const t = await getTranslations({ locale, namespace: 'invite' });

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
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 mt-16">
         <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#051E3C] p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/grid-pattern.svg')]"></div>
               <h1 className="text-3xl font-black text-white relative z-10">
                 {t('invitedBy', { name: referrer.first_name })}
               </h1>
               <p className="text-vanz-teal font-bold mt-2 text-lg">{t('landingDesc')}</p>
            </div>
            
            <div className="p-8 text-center space-y-6">
               <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="text-3xl font-black text-vanz-yellow">{t('creditValue')}</span>
                 <span className="text-sm font-bold text-gray-500 rtl:mr-1 ltr:ml-1">{t('creditCurrency')}</span>
               </div>
               
               <p className="text-gray-600 text-[15px] leading-relaxed">
                 {t.rich('landingBody', {
                   name: referrer.first_name,
                   strong: (chunks) => <strong>{chunks}</strong>
                 })}
               </p>

               <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                 <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">{t('yourPromoCode')}</p>
                 <p className="text-2xl font-black text-[#051E3C] tracking-widest">{code.toUpperCase()}</p>
               </div>

               <div className="pt-6">
                 <Link 
                   href={`/${locale}/signup?ref=${code.toUpperCase()}`}
                   className="block w-full bg-vanz-yellow hover:bg-yellow-400 text-[#051E3C] font-black text-lg py-4 rounded-xl shadow-md transition-all transform hover:-translate-y-1 mb-4"
                 >
                   {t('signupCTA')}
                 </Link>
                 <Link 
                   href="#"
                   className="block w-full bg-vanz-ice hover:bg-gray-100 text-[#051E3C] font-bold text-lg py-4 rounded-xl transition-all"
                 >
                   {t('downloadApp')}
                 </Link>
                 <p className="text-xs text-gray-400 mt-4 font-medium">{t('validityNote')}</p>
               </div>
            </div>
         </div>
      </main>
      <Footer />
    </div>
  );
}
