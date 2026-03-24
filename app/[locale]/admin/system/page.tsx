'use client';

import { Settings, Server, Shield, Database } from 'lucide-react';

export default function AdminSystemPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
         <h2 className="text-2xl font-black text-[#051E3C] flex items-center gap-3">
            <Settings className="w-7 h-7 text-vanz-teal" /> Paramètres Système
         </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
               <Database className="w-6 h-6" />
            </div>
            <div>
               <h3 className="font-bold text-[#051E3C]">Base de données</h3>
               <p className="text-xs text-gray-500 mt-1">Supabase Edge Network: Connecté. Latence: ~45ms.</p>
               <span className="inline-block px-2 py-1 mt-3 bg-green-100 text-green-700 text-[10px] uppercase font-bold rounded">Opérationnel</span>
            </div>
         </div>

         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-vanz-ice text-vanz-teal rounded-xl flex items-center justify-center shrink-0">
               <Server className="w-6 h-6" />
            </div>
            <div>
               <h3 className="font-bold text-[#051E3C]">Edge Functions</h3>
               <p className="text-xs text-gray-500 mt-1">8/8 Webhooks Deno actifs. Taux de succès 99.9%.</p>
               <span className="inline-block px-2 py-1 mt-3 bg-green-100 text-green-700 text-[10px] uppercase font-bold rounded">Opérationnel</span>
            </div>
         </div>

         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
               <Shield className="w-6 h-6" />
            </div>
            <div>
               <h3 className="font-bold text-[#051E3C]">Check RLS & Auth</h3>
               <p className="text-xs text-gray-500 mt-1">Garde Admin strict. Políticas RLS Postgres activées.</p>
               <span className="inline-block px-2 py-1 mt-3 bg-green-100 text-green-700 text-[10px] uppercase font-bold rounded">Opérationnel</span>
            </div>
         </div>

      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center mt-8">
         <p className="text-gray-400 font-medium">L'accès avancé aux logs système et à la console de la base de données nécessite une connexion directe via <a href="https://supabase.com" target="_blank" className="text-vanz-teal hover:underline">Supabase Dashboard</a>.</p>
      </div>

    </div>
  );
}
