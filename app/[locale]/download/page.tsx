import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Smartphone, Download, UserCheck, Star } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Télécharger VanZ - Publiez vos jobs',
  description: 'L\'expérience complète VanZ est disponible sur notre application mobile.'
};

export default async function DownloadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        
        <div className="w-24 h-24 bg-vanz-teal/10 rounded-full flex items-center justify-center mb-8">
            <Smartphone className="w-12 h-12 text-vanz-teal" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-vanz-navy mb-6 max-w-2xl leading-tight">
          L'expérience complète VanZ est sur mobile !
        </h1>
        
        <p className="text-xl text-gray-600 max-w-xl mb-12">
          Pour publier un job, suivre votre transporteur en temps réel avec le GPS, et discuter en direct, veuillez télécharger l'application gratuite.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-md mb-12">
           <button className="flex items-center justify-center gap-3 bg-black text-white px-6 py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
              <Download className="w-6 h-6" />
              <div className="text-left leading-tight">
                <div className="text-[10px] text-gray-300 uppercase font-semibold tracking-wider">Bientôt sur</div>
                <div className="text-lg font-bold">App Store</div>
              </div>
           </button>
           
           <button className="flex items-center justify-center gap-3 bg-black text-white px-6 py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
              <Download className="w-6 h-6" />
              <div className="text-left leading-tight">
                <div className="text-[10px] text-gray-300 uppercase font-semibold tracking-wider">Bientôt sur</div>
                <div className="text-lg font-bold">Google Play</div>
              </div>
           </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500 font-medium">
           <div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-vanz-teal"/> Plus de 500 inscrits</div>
           <div className="flex items-center gap-2"><Star className="w-5 h-5 text-vanz-yellow"/> Noté 4.8/5</div>
        </div>

        <div className="mt-16">
            <Link href={`/${locale}`} className="text-vanz-teal hover:underline font-semibold text-lg">
                &larr; Retour à l'accueil
            </Link>
        </div>
      </main>
    </div>
  );
}
