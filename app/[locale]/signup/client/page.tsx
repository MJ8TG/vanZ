"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { datasql as supabase } from "@/lib/datasql";
import { Loader2, ArrowRight, UserPlus, Gift } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

async function generateReferralCode(firstName: string): Promise<string> {
  // Strip non-letters, take first 6 chars max, uppercase
  const base = firstName
    .replace(/[^a-zA-Z]/g, '') // remove numbers, symbols, and arabic characters
    .slice(0, 6)
    .toUpperCase();

  const finalBase = base.length > 0 ? base : "VANZ";
  const suffix = Math.floor(10 + Math.random() * 90).toString(); // always 2 digits
  const code = finalBase + suffix;

  // After generating, check uniqueness before saving:
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', code)
    .single();

  if (existing) {
    // Collision — regenerate (rare but possible)
    return generateReferralCode(firstName);
  }
  
  return code;
}

function ClientSignupForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  
  const searchParams = useSearchParams();
  const [appliedReferralCode, setAppliedReferralCode] = useState(searchParams?.get("ref")?.toUpperCase() || "");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const t = useTranslations("invite");
  const tSignup = useTranslations("signup");
  
  const router = useRouter();
  const locale = useLocale();

  const handleTestFill = async () => {
    setFirstName("Test");
    setLastName("Client");
    const testEmail = `test_${Math.floor(Math.random() * 1000)}@vanz.tn`;
    const testPassword = process.env.NEXT_PUBLIC_TEST_PASSWORD || "";
    if (!testPassword) { setError("NEXT_PUBLIC_TEST_PASSWORD not set"); setLoading(false); return; }
    const testPhone = `55${Math.floor(100000 + Math.random() * 900000)}`;
    
    setEmail(testEmail);
    setPhone(testPhone);
    setPassword(testPassword);
    setAgreed(true);
    
    setLoading(true);
    setError("");
    
    try {
      // 1. Force Signup via Admin API
      const response = await fetch("/api/dev/force-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          firstName: "Test",
          lastName: "Client",
          phone: testPhone,
          role: 'client'
        })
      });
      
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Force Signup Failed");
      
      // 2. Auto-Login with the newly created account
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInErr) throw signInErr;
      
      // 3. Success! Redirect to dashboard
      router.push(`/${locale}/mes-missions`);
      
    } catch (err: any) {
      console.error("Force Signup Bypass failed:", err);
      setError("Bypass failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!agreed) {
      setError(tSignup("mustAgreeError"));
      setLoading(false);
      return;
    }

    if (phone.length !== 8) {
      setError("Le numéro de téléphone doit comporter exactement 8 chiffres.");
      setLoading(false);
      return;
    }

    const formattedPhone = `+216${phone}`;

    try {
      // 1. Bypass standard signup to auto-confirm testers
      const response = await fetch("/api/dev/force-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          firstName: firstName,
          lastName: lastName,
          phone: formattedPhone,
          role: 'client'
        })
      });
      
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Impossible de créer le compte.");

      // 2. Auto-login immediately
      const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInErr) throw signInErr;

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error("Erreur de création du compte.");
      }

      const referralCode = await generateReferralCode(firstName);

      // 2. Insert into public.users (Upsert to handle trigger collision gracefully)
      const { error: profileError } = await supabase.from("users").upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        phone: formattedPhone,
        email: email,
        role: 'client',
        referral_code: referralCode,
      });

      if (profileError) {
        throw new Error("Ce numéro de téléphone est déjà utilisé, ou les informations sont invalides.");
      }

      // 2.5 Record referral link if provided
      if (appliedReferralCode) {
        const { data: referrer, error: refLookupError } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', appliedReferralCode.toUpperCase())
          .single();
        
        if (referrer && !refLookupError) {
          await supabase.from('referrals').insert({
            referrer_id: referrer.id,
            referred_id: userId,
            status: 'pending'
          });
        }
      }

      // 3. Setup Wallet System 
      const { error: walletErr } = await supabase.from("wallet_transactions").insert({
         user_id: userId,
         amount: 0,
         type: "credit",
         note: "Initialisation du portefeuille"
      });

      // Navigate to client app on success
      router.push(`/${locale}/mes-missions`);
    } catch (err: any) {
      console.error(err);
      
      // Specifically handle Supabase rate limit errors
      if (err.message?.toLowerCase().includes("rate limit") || err.code === "over_rate_limit") {
        setError("Trop de tentatives. Veuillez patienter environ 60 secondes pour des raisons de sécurité.");
      } else {
        setError(err.message || "Impossible de créer le compte pour le moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-vanz-ice/30">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden p-8 animate-in fade-in slide-in-from-bottom-8 duration-500 border border-gray-100">
           
          <div className="flex flex-col items-center mb-8">
             <h1 className="text-3xl font-black text-vanz-navy">Créer un compte</h1>
             <p className="text-sm font-medium text-gray-400 mt-2">
               Rejoignez VanZ en tant que Client
             </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center animate-in shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="firstName">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="given-name"
                  autoComplete="given-name"
                  type="text"
                  required
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-vanz-teal focus:ring-4 focus:ring-vanz-teal/10 outline-none transition-all duration-300 font-medium text-vanz-navy placeholder:text-gray-300 bg-gray-50/50 focus:bg-white"
                  placeholder="Ali"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="lastName">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="family-name"
                  autoComplete="family-name"
                  type="text"
                  required
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-vanz-teal focus:ring-4 focus:ring-vanz-teal/10 outline-none transition-all duration-300 font-medium text-vanz-navy placeholder:text-gray-300 bg-gray-50/50 focus:bg-white"
                  placeholder="Ben Salah"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="phone">
                N° de Téléphone (Tunisie)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-bold tracking-widest text-sm">+216</span>
                </div>
                <input
                  id="phone"
                  name="tel"
                  autoComplete="tel"
                  type="tel"
                  required
                  placeholder="22 333 444"
                  className="w-full pl-16 pr-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-vanz-teal focus:ring-4 focus:ring-vanz-teal/10 outline-none transition-all duration-300 font-bold text-vanz-navy placeholder:text-gray-200 bg-gray-50/50 focus:bg-white tracking-[0.2em]"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setPhone(val);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="email">
                Adresse Email
              </label>
                <input
                  id="email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-vanz-teal focus:ring-4 focus:ring-vanz-teal/10 outline-none transition-all duration-300 font-medium text-vanz-navy placeholder:text-gray-300 bg-gray-50/50 focus:bg-white"
                  placeholder="vous@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
  
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="password">
                  Mot de passe fort
                </label>
                <input
                  id="password"
                  name="new-password"
                  autoComplete="new-password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-vanz-teal focus:ring-4 focus:ring-vanz-teal/10 outline-none transition-all duration-300 font-medium text-vanz-navy placeholder:text-gray-300 bg-gray-50/50 focus:bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              <p className="text-[10px] text-gray-400 mt-2 font-medium">Au moins 6 caractères.</p>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2" htmlFor="referral">
                <Gift className="w-3.5 h-3.5 text-vanz-yellow" />
                {t('referralCodeLabel')}
              </label>
              <input
                id="referral"
                type="text"
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-vanz-yellow focus:ring-4 focus:ring-vanz-yellow/10 outline-none transition-all duration-300 font-bold tracking-widest text-vanz-navy placeholder:text-gray-300 bg-gray-50/50 focus:bg-white"
                placeholder={t('referralPlaceholder')}
                value={appliedReferralCode}
                onChange={(e) => setAppliedReferralCode(e.target.value.toUpperCase())}
              />
            </div>

            {/* Terms Consent Checkbox */}
            <div className="flex items-start gap-3 mt-4">
              <input
                id="agreeToTerms"
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 text-vanz-teal border-2 border-gray-200 rounded focus:ring-vanz-teal outline-none cursor-pointer"
              />
              <label htmlFor="agreeToTerms" className="text-xs text-gray-500 leading-normal cursor-pointer select-none font-medium">
                {locale === "ar" ? (
                  <>
                    أوافق على{" "}
                    <Link href={`/${locale}/conditions-utilisation`} target="_blank" className="text-vanz-teal hover:underline font-bold">
                      شروط الاستخدام
                    </Link>{" "}
                    و{" "}
                    <Link href={`/${locale}/politique-confidentialite`} target="_blank" className="text-vanz-teal hover:underline font-bold">
                      سياسة الخصوصية
                    </Link>{" "}
                    لـ VanZ
                  </>
                ) : (
                  <>
                    J&apos;accepte les{" "}
                    <Link href={`/${locale}/conditions-utilisation`} target="_blank" className="text-vanz-teal hover:underline font-bold">
                      Conditions d&apos;utilisation
                    </Link>{" "}
                    et la{" "}
                    <Link href={`/${locale}/politique-confidentialite`} target="_blank" className="text-vanz-teal hover:underline font-bold">
                      Politique de confidentialité
                    </Link>{" "}
                    de VanZ
                  </>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full bg-vanz-teal hover:bg-[#00ADC6] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group mt-8 shadow-lg shadow-vanz-teal/20 hover:shadow-vanz-teal/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 hover:brightness-110"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <span>S&apos;inscrire en tant que Client</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {process.env.NODE_ENV === 'development' && (
              <button
                type="button"
                onClick={handleTestFill}
                className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl border-2 border-dashed border-gray-300 hover:bg-gray-200 transition-colors text-sm"
              >
                ⚡ Remplissage Test (Dev Only)
              </button>
            )}
          </form>
          <p className="mt-8 text-center text-sm font-medium text-gray-500">
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

export default function ClientSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-vanz-teal animate-spin" />
      </div>
    }>
      <ClientSignupForm />
    </Suspense>
  );
}
