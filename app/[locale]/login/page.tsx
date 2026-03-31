"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { datasql as supabase } from "@/lib/datasql";
import { Loader2, ArrowRight, UserCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/homepage/Navbar";
import Footer from "@/components/homepage/Footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const locale = useLocale();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data?.user) {
        // Redirect to user dashboard after successful login
        router.push(`/${locale}/mes-missions`);
      }
    } catch (err: any) {
      setError("Les identifiants fournis sont incorrects."); // Safe user message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-20">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden p-8 animate-in fade-in slide-in-from-bottom-8 duration-500 border border-gray-100">
           
          <div className="flex flex-col items-center mb-8">
             <div className="w-16 h-16 bg-vanz-teal/10 text-vanz-teal rounded-full flex items-center justify-center mb-4">
                 <UserCircle className="w-8 h-8" />
             </div>
             <h1 className="text-3xl font-black text-vanz-navy">Bienvenue</h1>
             <p className="text-sm font-medium text-gray-400 mt-2">Connectez-vous pour continuer</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center animate-in shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="email">
                Adresse Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-vanz-teal focus:ring-4 focus:ring-vanz-teal/10 outline-none transition-all duration-300 font-medium text-vanz-navy placeholder:text-gray-300 bg-gray-50/50 focus:bg-white"
                placeholder="vous@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="password">
                  Mot de passe
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-vanz-teal focus:ring-4 focus:ring-vanz-teal/10 outline-none transition-all duration-300 font-medium text-vanz-navy placeholder:text-gray-300 bg-gray-50/50 focus:bg-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vanz-yellow hover:bg-yellow-400 text-vanz-navy font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group mt-8 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-vanz-navy/70" />
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            Nouveau sur VanZ ?{' '}
            <Link href={`/${locale}/signup`} className="text-vanz-teal hover:text-vanz-navy font-bold transition-colors underline decoration-2 underline-offset-4 decoration-vanz-teal/30 hover:decoration-vanz-navy">
              Créer un compte
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
