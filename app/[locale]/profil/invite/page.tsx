import { getTranslations } from "next-intl/server";
import { datasql as supabase } from "@/lib/datasql";
import Navbar from "@/components/homepage/Navbar";
import Footer from "@/components/homepage/Footer";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Share2, Users, Gift, CheckCircle } from "lucide-react";

export default async function ReferralDashboardPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "invite" });
  
  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from('users')
    .select('role, referral_code, first_name')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect(`/${params.locale}/login`);
  }

  const role = profile.role || 'client'; // 'client' or 'driver'
  const referralCode = profile.referral_code;

  // 3. Fetch Referrals Stats
  const { count: totalInvited } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id);

  const { count: totalCompleted } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('status', 'completed');

  // Currently pending if totalInvited > totalCompleted
  const pendingCount = (totalInvited || 0) - (totalCompleted || 0);

  // Completed referrals give 10 TND each
  // In the future this might come from `wallet_transactions` summary instead
  const earnedAmount = (totalCompleted || 0) * 10;

  // 4. Generate WhatsApp Share Text
  const shareMessage = role === 'client' 
    ? t("whatsappShareClient", { code: referralCode })
    : t("whatsappShareDriver", { code: referralCode });
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  return (
    <main className="min-h-screen bg-gray-50/50 pt-24 pb-16">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* Header Section */}
        <div className="bg-vanz-navy rounded-3xl p-8 mb-8 shadow-xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
          <Gift className="w-16 h-16 text-vanz-yellow mx-auto mb-4" />
          <h1 className="text-4xl font-black text-white mb-4">
            {t("dashboardTitle")}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto font-medium">
            {role === 'client' ? t("clientSubtitle") : t("driverSubtitle")}
          </p>
          {role === 'driver' && (
            <p className="mt-4 text-vanz-teal font-bold bg-white/10 p-3 rounded-lg inline-block">
              {t("driverBonus")}
            </p>
          )}
        </div>

        {/* Code & Share Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
             <h2 className="text-lg font-bold text-gray-500 mb-4">{t("yourCodeLabel")}</h2>
             <div className="bg-gray-50 py-4 px-8 rounded-2xl w-full border-2 border-dashed border-gray-200">
               <span className="text-4xl font-black text-vanz-navy tracking-widest">{referralCode}</span>
             </div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white hover:bg-[#1ebd59] active:scale-95 transition-all rounded-2xl py-5 px-6 font-bold text-lg flex items-center justify-center gap-3 w-full shadow-lg shadow-[#25D366]/20"
            >
              <Share2 className="w-6 h-6" />
              {t("shareWhatsApp")}
            </a>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-16">
          <h2 className="text-2xl font-black text-vanz-navy mb-8">{t("statsTitle")}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50/50 p-6 rounded-2xl flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">{t("statInvited")}</p>
                <p className="text-3xl font-black text-vanz-navy">{totalInvited || 0}</p>
              </div>
            </div>
            
            <div className="bg-yellow-50/50 p-6 rounded-2xl flex items-center gap-4">
              <div className="bg-yellow-100 p-4 rounded-xl text-yellow-600">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">{t("statPending")}</p>
                <p className="text-3xl font-black text-vanz-navy">{pendingCount}</p>
              </div>
            </div>
            
            <div className="bg-green-50/50 p-6 rounded-2xl flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-xl text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">{t("statEarned")}</p>
                <p className="text-3xl font-black text-vanz-navy">{earnedAmount} TND</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </main>
  );
}
