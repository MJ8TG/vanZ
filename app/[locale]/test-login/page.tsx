'use client';

import { datasql as supabase } from '@/lib/datasql';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function TestLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();

  const handleLogin = async (role: 'client' | 'driver') => {
    setLoading(true);
    setError(null);
    try {
      const email = role === 'client' ? 'test_client_final@vanz.tn' : 'test_driver_final@vanz.tn';
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123'
      });

      if (signInErr) throw signInErr;

      router.push(`/${locale}/messages`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-vanz-navy p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-vanz-navy mb-6 text-center">Test Login Bypass</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            disabled={loading}
            onClick={() => handleLogin('client')}
            className="w-full py-4 bg-vanz-teal text-white font-bold rounded-2xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            Login as Test Client
          </button>

          <button
            disabled={loading}
            onClick={() => handleLogin('driver')}
            className="w-full py-4 bg-vanz-yellow text-vanz-navy font-bold rounded-2xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            Login as Test Driver
          </button>
        </div>

        <p className="mt-8 text-xs text-gray-400 text-center uppercase tracking-widest font-bold">
          E2E Testing Utility
        </p>
      </div>
    </div>
  );
}
