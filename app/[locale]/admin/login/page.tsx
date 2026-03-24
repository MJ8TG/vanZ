'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { datasql as supabase } from '@/lib/datasql';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const locale = useLocale();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data?.user) {
        // Verify if user is in admin_users table
        const { data: adminCheck } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (!adminCheck || adminCheck.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error("Accès refusé. Vous n'êtes pas administrateur.");
        }

        // Redirect to admin dash
        router.push('/admin');
        router.refresh(); // force layout reload
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#051E3C] p-4 font-sans focus-within:bg-[#04152A] transition-colors duration-500">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 animate-[fade-in-up_400ms_ease-out]">
         
        <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 bg-vanz-teal/10 text-vanz-teal rounded-full flex items-center justify-center mb-4">
             <ShieldCheck className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-black text-[#051E3C]">Portail Administrateur</h1>
           <p className="text-sm text-gray-500 mt-1">Connexion sécurisée requise</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vanz-teal focus:border-transparent transition-all"
              placeholder="admin@vanz.tn"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vanz-teal focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-vanz-teal text-white font-bold rounded-xl hover:bg-[#24a8c4] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se Connecter'}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
           <p className="text-xs text-gray-400 font-medium">VanZ Technologies © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
