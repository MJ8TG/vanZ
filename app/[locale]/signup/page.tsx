"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowRight, Package, Truck } from "lucide-react";

export default function SignupRoleSelectionPage() {
  const locale = useLocale();

  return (
    <div className="flex flex-col min-h-screen bg-vanz-ice/30">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden p-8 md:p-12 animate-in fade-in slide-in-from-bottom-8 duration-500 border border-gray-100">
          
          <div className="flex flex-col items-center mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-black text-vanz-navy">Rejoignez VanZ</h1>
            <p className="text-sm md:text-base font-medium text-gray-500 mt-3 max-w-sm mx-auto">
              Choisissez comment vous souhaitez utiliser notre plateforme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Card */}
            <Link 
              href={`/${locale}/signup/client`}
              className="group relative bg-gray-50 hover:bg-vanz-navy rounded-3xl p-8 border-2 border-gray-100 hover:border-vanz-navy transition-all duration-300 flex flex-col items-center text-center overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <Package className="w-10 h-10 text-vanz-navy group-hover:text-vanz-teal transition-colors" />
              </div>
              <h2 className="text-2xl font-black text-vanz-navy group-hover:text-white mb-2 transition-colors">Client</h2>
              <p className="text-gray-500 group-hover:text-gray-300 font-medium text-sm transition-colors">
                Je veux expédier des colis ou déménager des meubles.
              </p>
              
              <div className="mt-8 flex items-center justify-center gap-2 text-vanz-teal font-bold group-hover:text-vanz-yellow transition-colors">
                Créer mon compte <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Driver Card */}
            <Link 
              href={`/${locale}/devenir-chauffeur`}
              className="group relative bg-gray-50 hover:bg-vanz-teal rounded-3xl p-8 border-2 border-gray-100 hover:border-vanz-teal transition-all duration-300 flex flex-col items-center text-center overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <Truck className="w-10 h-10 text-vanz-teal group-hover:text-vanz-navy transition-colors" />
              </div>
              <h2 className="text-2xl font-black text-vanz-navy group-hover:text-white mb-2 transition-colors">Chauffeur</h2>
              <p className="text-gray-500 group-hover:text-gray-100 font-medium text-sm transition-colors">
                J&apos;ai un véhicule utilitaire et je veux générer des revenus.
              </p>
              
              <div className="mt-8 flex items-center justify-center gap-2 text-vanz-navy font-bold group-hover:text-vanz-yellow transition-colors">
                Devenir chauffeur <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            Vous avez déjà un compte ?{' '}
            <Link href={`/${locale}/login`} className="text-vanz-yellow hover:text-vanz-navy font-bold transition-colors underline decoration-2 underline-offset-4 decoration-vanz-yellow/30 hover:decoration-vanz-navy">
              Connectez-vous
            </Link>
          </p>

        </div>
      </main>
    </div>
  );
}
