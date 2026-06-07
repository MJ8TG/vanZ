"use client";

import { useEffect, useState, use } from "react";
import { 
  Phone, MapPin, Truck, User, CreditCard, ArrowRight, RefreshCw, 
  Star, Play, Check, X, AlertCircle, Laptop, Database, Globe, ArrowLeftRight
} from "lucide-react";
import { datasql } from "@/lib/datasql";

// Local translation dictionary for the simulator
const translations = {
  fr: {
    title: "Simulateur Interactif VanZ",
    subtitle: "Visualisez et testez les flux Client et Chauffeur en temps réel",
    toggleMode: "Mode de simulation",
    sandbox: "Bac à sable (Sandbox)",
    liveDb: "Base de données en direct (Supabase)",
    clientTitle: "Application Client",
    driverTitle: "Application Chauffeur",
    currency: "TND",
    phoneFormat: "+216 XX XXX XXX",
    verifyTitle: "Vérification Chauffeur",
    verifyDesc: "Votre compte est en cours d'approbation.",
    verifyBtn: "Approuver le Chauffeur",
    postJobTitle: "Demander un transport",
    pickup: "Point de départ",
    dropoff: "Destination",
    serviceType: "Type de véhicule",
    vanStandard: "Van Standard",
    vanLarge: "Grand Fourgon",
    paymentMethod: "Mode de paiement",
    cash: "Espèces (TND)",
    phoneLabel: "Numéro de téléphone Tunisien",
    postBtn: "Publier l'annonce",
    waitingBids: "Recherche de transporteurs...",
    noBidsYet: "En attente des offres des chauffeurs...",
    bidAmount: "Montant de l'offre",
    acceptBtn: "Accepter",
    jobMatched: "Chauffeur en route !",
    activeTrip: "Course en cours",
    startTrip: "Commencer la course",
    completeTrip: "Terminer la course",
    tripCompleted: "Course terminée !",
    commissionDebt: "Commission due (15%)",
    driverPayout: "Versement Chauffeur",
    resetBtn: "Réinitialiser la simulation",
    autologinBtn: "Connexion E2E automatique",
    realtimeSync: "Synchronisation Realtime activée",
    arabicToggle: "Vers l'Arabe (العربية)",
    frenchToggle: "Vers le Français"
  },
  ar: {
    title: "محاكي فانز التفاعلي",
    subtitle: "تتبع واختبر تدفقات العميل والسائق في الوقت الفعلي",
    toggleMode: "وضع المحاكاة",
    sandbox: "بيئة تجريبية",
    liveDb: "قاعدة بيانات مباشرة (سوبابيس)",
    clientTitle: "تطبيق العميل",
    driverTitle: "تطبيق السائق",
    currency: "د.ت",
    phoneFormat: "+216 XX XXX XXX",
    verifyTitle: "تأكيد السائق",
    verifyDesc: "حسابك قيد المراجعة والموافقة.",
    verifyBtn: "تفعيل السائق",
    postJobTitle: "طلب نقل",
    pickup: "نقطة الانطلاق",
    dropoff: "نقطة الوصول",
    serviceType: "نوع السيارة",
    vanStandard: "فان عادي",
    vanLarge: "شاحنة كبيرة",
    paymentMethod: "طريقة الدفع",
    cash: "نقداً (د.ت)",
    phoneLabel: "رقم الهاتف التونسي",
    postBtn: "نشر الطلب",
    waitingBids: "البحث عن ناقلين...",
    noBidsYet: "في انتظار عروض السائقين...",
    bidAmount: "قيمة العرض",
    acceptBtn: "قبول",
    jobMatched: "السائق في الطريق!",
    activeTrip: "الرحلة الحالية",
    startTrip: "بدء الرحلة",
    completeTrip: "إنهاء الرحلة",
    tripCompleted: "تمت الرحلة بنجاح!",
    commissionDebt: "العمولة المستحقة (15%)",
    driverPayout: "مستحقات السائق",
    resetBtn: "إعادة تعيين المحاكاة",
    autologinBtn: "تسجيل دخول تلقائي",
    realtimeSync: "البث المباشر نشط",
    arabicToggle: "الفرنسية",
    frenchToggle: "العربية"
  }
};

export default function SimulatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [lang, setLang] = useState<"fr" | "ar">("fr");
  const t = translations[lang];

  // Simulation mode: "sandbox" (pure state) or "livedb" (Supabase query)
  const [simMode, setSimMode] = useState<"sandbox" | "livedb">("sandbox");
  const [isLivedbConnected, setIsLivedbConnected] = useState(false);
  const [dbLogs, setDbLogs] = useState<string[]>([]);

  // Sandbox Local States
  const [sbJob, setSbJob] = useState<any>(null);
  const [sbBids, setSbBids] = useState<any[]>([]);
  const [sbDriverStatus, setSbDriverStatus] = useState<"offline" | "online" | "bidding" | "matched" | "completed">("online");
  const [sbDriverDebt, setSbDriverDebt] = useState<number>(0);
  const [sbDriverPayout, setSbDriverPayout] = useState<number>(0);
  const [sbCommission, setSbCommission] = useState<number>(0);

  // Live Database States
  const [dbClientSession, setDbClientSession] = useState<any>(null);
  const [dbDriverSession, setDbDriverSession] = useState<any>(null);
  const [dbActiveJob, setDbActiveJob] = useState<any>(null);
  const [dbBids, setDbBids] = useState<any[]>([]);
  const [dbDriverDebt, setDbDriverDebt] = useState<number>(0);

  // Form inputs (shared model)
  const [formPickup, setFormPickup] = useState("Lac 1, Tunis");
  const [formDropoff, setFormDropoff] = useState("Marsa, Tunis");
  const [formPhone, setFormPhone] = useState("+216 99 000 001");
  const [formServiceType, setFormServiceType] = useState("van_standard");
  const [formBidAmount, setFormBidAmount] = useState(150);

  // Auto set initial locale lang
  useEffect(() => {
    if (locale === "ar" || locale === "fr") {
      setLang(locale as "fr" | "ar");
    }
  }, [locale]);

  // Log outputs helper
  const addDbLog = (msg: string) => {
    setDbLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Check Supabase configurations on load
  useEffect(() => {
    if (simMode === "livedb") {
      checkDatabaseSession();
    }
  }, [simMode]);

  // DB Polling for real-time updates when in database mode
  useEffect(() => {
    if (simMode !== "livedb") return;

    const interval = setInterval(async () => {
      // 1. Fetch active jobs for test client
      if (dbClientSession?.user?.id) {
        const { data: jobs } = await datasql
          .from("jobs")
          .select("*")
          .eq("client_id", dbClientSession.user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (jobs && jobs.length > 0) {
          const currentJob = jobs[0];
          setDbActiveJob(currentJob);

          // 2. Fetch bids on this active job
          const { data: bids } = await datasql
            .from("bids")
            .select("*, drivers(users(first_name, last_name))")
            .eq("job_id", currentJob.id);
          
          if (bids) {
            setDbBids(bids);
          }
        }
      }

      // 3. Fetch driver commission debt
      if (dbDriverSession?.user?.id) {
        const { data: user } = await datasql
          .from("users")
          .select("pending_commission_debt")
          .eq("id", dbDriverSession.user.id)
          .single();
        if (user) {
          setDbDriverDebt(user.pending_commission_debt || 0);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [simMode, dbClientSession, dbDriverSession]);

  const checkDatabaseSession = async () => {
    try {
      const clientEmail = "e2e_client_permanent@vanz.tn";
      const driverEmail = "e2e_driver_permanent@vanz.tn";

      addDbLog("Vérification des connexions Supabase...");
      
      // Check if logged in already (client)
      const { data: cUser } = await datasql.auth.getSession();
      if (cUser?.session) {
        if (cUser.session.user.email === clientEmail) {
          setDbClientSession(cUser.session);
          addDbLog("Client connecté : " + clientEmail);
        }
      }

      setIsLivedbConnected(true);
    } catch (e: any) {
      addDbLog("Erreur de connexion Supabase : " + e.message);
    }
  };

  const handleAutoLogin = async () => {
    try {
      addDbLog("Initialisation des identités E2E...");
      const E2E_PASSWORD = "Password123!";
      
      // Auto login client
      const { data: cAuth, error: cErr } = await datasql.auth.signInWithPassword({
        email: "e2e_client_permanent@vanz.tn",
        password: E2E_PASSWORD
      });
      if (cErr) {
        addDbLog("Erreur connexion client : " + cErr.message);
      } else {
        setDbClientSession(cAuth.session);
        addDbLog("Client E2E connecté !");
      }

      // Fetch driver session info
      const { data: dAuth, error: dErr } = await datasql.auth.signInWithPassword({
        email: "e2e_driver_permanent@vanz.tn",
        password: E2E_PASSWORD
      });
      if (dErr) {
        addDbLog("Erreur connexion chauffeur : " + dErr.message);
      } else {
        setDbDriverSession(dAuth.session);
        addDbLog("Chauffeur E2E connecté !");
      }

      // Cleanup past active jobs to start clean
      if (cAuth.session?.user?.id) {
        addDbLog("Purge des anciennes missions en cours...");
        await datasql
          .from("jobs")
          .delete()
          .eq("client_id", cAuth.session.user.id);
        setDbActiveJob(null);
        setDbBids([]);
        addDbLog("Purge terminée. Prêt pour test en direct !");
      }

    } catch (e: any) {
      addDbLog("Erreur lors de la configuration auto : " + e.message);
    }
  };

  // --- ACTIONS: Sandbox Flows ---
  const sbReset = () => {
    setSbJob(null);
    setSbBids([]);
    setSbDriverStatus("online");
    setSbCommission(0);
    setSbDriverPayout(0);
  };

  const sbPostJob = () => {
    // Tunisian Phone Check
    const phoneRegex = /^\+216\s?\d{2}\s?\d{3}\s?\d{3}$/;
    if (!phoneRegex.test(formPhone)) {
      alert("Format du téléphone Tunisien invalide. Ex: +216 99 000 001");
      return;
    }

    const job = {
      id: Math.random().toString(36).substring(7),
      pickup: formPickup,
      dropoff: formDropoff,
      phone: formPhone,
      service_type: formServiceType,
      status: "open"
    };

    setSbJob(job);
    setSbDriverStatus("bidding");
  };

  const sbPlaceBid = () => {
    if (!sbJob) return;

    const bid = {
      id: Math.random().toString(36).substring(7),
      amount: formBidAmount,
      driver_name: "Nabil Ben Ali",
      rating: 4.8,
      vehicle: formServiceType === "van_standard" ? "Peugeot Partner" : "Iveco Daily"
    };

    setSbBids([bid]);
    setSbDriverStatus("bidding");
  };

  const sbAcceptBid = (bidAmount: number) => {
    if (!sbJob) return;
    setSbJob({ ...sbJob, status: "matched", accepted_amount: bidAmount });
    setSbDriverStatus("matched");
  };

  const sbCompleteJob = () => {
    if (!sbJob) return;
    const amount = sbJob.accepted_amount || formBidAmount;
    const comm = amount * 0.15; // 15% standard commission
    const payout = amount - comm;

    setSbJob({ ...sbJob, status: "completed" });
    setSbDriverStatus("completed");
    setSbCommission(comm);
    setSbDriverPayout(payout);
    setSbDriverDebt((prev) => prev + comm);
  };

  // --- ACTIONS: Supabase Flows ---
  const dbPostJob = async () => {
    if (!dbClientSession) {
      alert("Veuillez d'abord connecter les identités E2E.");
      return;
    }

    // Phone validation
    const phoneRegex = /^\+216\s?\d{2}\s?\d{3}\s?\d{3}$/;
    if (!phoneRegex.test(formPhone)) {
      alert("Numéro tunisien invalide (+216 XX XXX XXX)");
      return;
    }

    addDbLog("Création de la mission dans la base de données...");

    const { data: job, error } = await datasql
      .from("jobs")
      .insert({
        client_id: dbClientSession.user.id,
        pickup_address: formPickup,
        dropoff_address: formDropoff,
        pickup_lat: 36.83,
        pickup_lng: 10.23,
        dropoff_lat: 36.88,
        dropoff_lng: 10.32,
        service_type: formServiceType,
        status: "open"
      })
      .select()
      .single();

    if (error) {
      addDbLog("Erreur de création : " + error.message);
    } else {
      setDbActiveJob(job);
      addDbLog("✅ Mission créée avec succès ! ID: " + job.id);
    }
  };

  const dbPlaceBid = async () => {
    if (!dbActiveJob || !dbDriverSession) {
      alert("Aucune mission active ou chauffeur non connecté.");
      return;
    }

    addDbLog("Envoi de l'offre par le chauffeur...");
    const { data: bid, error } = await datasql
      .from("bids")
      .insert({
        job_id: dbActiveJob.id,
        driver_id: dbDriverSession.user.id,
        amount: formBidAmount,
        status: "pending"
      })
      .select()
      .single();

    if (error) {
      addDbLog("Erreur d'offre : " + error.message);
    } else {
      addDbLog(`✅ Offre de ${formBidAmount} TND soumise !`);
    }
  };

  const dbAcceptBid = async (bidId: string) => {
    addDbLog("Acceptation de l'offre...");
    const { error } = await datasql
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bidId);

    if (error) {
      addDbLog("Erreur acceptation : " + error.message);
    } else {
      addDbLog("✅ Offre acceptée ! Chargement de la course...");
    }
  };

  const dbCompleteJob = async () => {
    if (!dbActiveJob) return;
    addDbLog("Finalisation de la course...");
    const { error } = await datasql
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", dbActiveJob.id);

    if (error) {
      addDbLog("Erreur de finalisation : " + error.message);
    } else {
      addDbLog("✅ Mission terminée ! Calcul de la commission en cours...");
    }
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen py-8 px-4 flex flex-col items-center">
      {/* Top Banner */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-8 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 md:mt-0 items-center">
          {/* Lang Toggle */}
          <button 
            onClick={() => setLang(lang === "fr" ? "ar" : "fr")} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            <Globe size={14} />
            {lang === "fr" ? t.arabicToggle : t.frenchToggle}
          </button>

          {/* Simulator Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setSimMode("sandbox")} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${simMode === "sandbox" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              <Laptop size={14} />
              {t.sandbox}
            </button>
            <button 
              onClick={() => setSimMode("livedb")} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${simMode === "livedb" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              <Database size={14} />
              {t.liveDb}
            </button>
          </div>
        </div>
      </div>

      {/* Database Mode Operations Bar */}
      {simMode === "livedb" && (
        <div className="w-full max-w-6xl mb-8 p-4 rounded-xl border border-blue-900/50 bg-blue-950/20 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
            <p className="text-xs font-semibold text-blue-300">{t.realtimeSync}</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleAutoLogin} 
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-md"
            >
              ⚙️ {t.autologinBtn}
            </button>
            <button 
              onClick={async () => {
                if (dbClientSession?.user?.id) {
                  await datasql.from("jobs").delete().eq("client_id", dbClientSession.user.id);
                  setDbActiveJob(null);
                  setDbBids([]);
                  addDbLog("Simulation réinitialisée.");
                }
              }} 
              className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition"
            >
              🧹 {t.resetBtn}
            </button>
          </div>
        </div>
      )}

      {/* Simulator Grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 justify-items-center">
        
        {/* --- DEVICE 1: CLIENT APP VIEW --- */}
        <div className="flex flex-col items-center">
          <div className="mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            <h2 className="text-xl font-bold tracking-wide text-cyan-400 uppercase">{t.clientTitle}</h2>
          </div>

          {/* Smartphone Bezel */}
          <div className="relative border-[12px] border-slate-800 rounded-[3rem] w-[370px] h-[740px] bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-slate-800 rounded-b-2xl z-50 flex justify-center items-center">
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-full mr-2"></span>
              <span className="w-12 h-1 bg-slate-900 rounded-full"></span>
            </div>

            {/* Simulated Phone Screen Content */}
            <div className="flex-1 flex flex-col bg-slate-950 pt-8 px-4 overflow-y-auto">
              
              {/* Screen Top Bar */}
              <div className="flex justify-between items-center mb-6 text-xs text-slate-500 font-bold">
                <span>15:45</span>
                <div className="flex gap-1.5 items-center">
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-slate-600 rounded-sm p-0.5 flex items-center">
                    <div className="h-full w-4 bg-green-500 rounded-sm"></div>
                  </div>
                </div>
              </div>

              {/* Sandbox vs DB Job Render Control */}
              {simMode === "sandbox" ? (
                // --- SANDBOX CLIENT VIEW ---
                !sbJob ? (
                  /* Client State: Request Form */
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                      <Truck size={18} />
                      {t.postJobTitle}
                    </h3>

                    {/* Inputs */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1 font-bold">{t.pickup}</label>
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                          <MapPin className="text-green-500 mr-2" size={16} />
                          <input 
                            value={formPickup} 
                            onChange={(e) => setFormPickup(e.target.value)} 
                            className="bg-transparent text-sm w-full outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1 font-bold">{t.dropoff}</label>
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                          <MapPin className="text-red-500 mr-2" size={16} />
                          <input 
                            value={formDropoff} 
                            onChange={(e) => setFormDropoff(e.target.value)} 
                            className="bg-transparent text-sm w-full outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1 font-bold">{t.serviceType}</label>
                          <select 
                            value={formServiceType}
                            onChange={(e) => setFormServiceType(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs w-full text-white outline-none"
                          >
                            <option value="van_standard">{t.vanStandard}</option>
                            <option value="van_large">{t.vanLarge}</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 block mb-1 font-bold">{t.paymentMethod}</label>
                          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white flex items-center font-bold">
                            <CreditCard size={14} className="text-cyan-400 mr-1.5" />
                            {t.cash}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1 font-bold">{t.phoneLabel}</label>
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                          <Phone className="text-cyan-400 mr-2" size={16} />
                          <input 
                            value={formPhone} 
                            onChange={(e) => setFormPhone(e.target.value)} 
                            className="bg-transparent text-sm w-full outline-none font-semibold"
                            placeholder="+216 XX XXX XXX"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={sbPostJob} 
                      className="mt-8 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-1"
                    >
                      {t.postBtn}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ) : sbJob.status === "open" ? (
                  /* Client State: Waiting for Bids */
                  <div className="flex-1 flex flex-col">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded text-[10px] font-bold uppercase">{sbJob.service_type}</span>
                        <span className="text-[10px] text-slate-500 font-mono">#{sbJob.id}</span>
                      </div>
                      <p className="text-sm font-semibold text-white mb-1"><span className="text-xs text-slate-400">De:</span> {sbJob.pickup}</p>
                      <p className="text-sm font-semibold text-white"><span className="text-xs text-slate-400">À:</span> {sbJob.dropoff}</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-start">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wide">{t.waitingBids}</h4>
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
                      </div>

                      {sbBids.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                          <AlertCircle size={24} className="mb-2 text-slate-600" />
                          <p className="text-xs">{t.noBidsYet}</p>
                          <p className="text-[10px] text-cyan-500/80 mt-2 font-bold animate-pulse">💡 Soumettez une offre depuis l'application Chauffeur à droite</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sbBids.map((bid) => (
                            <div key={bid.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex justify-between items-center">
                              <div>
                                <h5 className="text-xs font-bold text-white">{bid.driver_name}</h5>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-slate-400">{bid.vehicle}</span>
                                  <div className="flex items-center text-[10px] text-yellow-500">
                                    <Star size={10} fill="currentColor" className="mr-0.5" />
                                    {bid.rating}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-sm font-extrabold text-cyan-400">{bid.amount} {t.currency}</span>
                                <button 
                                  onClick={() => sbAcceptBid(bid.amount)} 
                                  className="px-2.5 py-1 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-lg text-xs transition"
                                >
                                  {t.acceptBtn}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : sbJob.status === "matched" ? (
                  /* Client State: Job Matched / En Route */
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-green-950 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mb-4 animate-bounce">
                      <Truck size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{t.jobMatched}</h3>
                    <p className="text-xs text-slate-400 mb-6 max-w-xs">Le chauffeur Nabil Ben Ali a accepté la mission pour {sbJob.accepted_amount} TND. Il se dirige vers {sbJob.pickup}.</p>
                    
                    <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-left space-y-2 mb-8">
                      <div className="text-xs font-bold text-slate-400 uppercase">Infos Chauffeur</div>
                      <div className="text-sm font-bold">Nabil Ben Ali (+216 99 111 002)</div>
                      <div className="text-xs text-slate-400">Véhicule : Peugeot Partner (Standard)</div>
                    </div>

                    <p className="text-[10px] text-green-400/80 animate-pulse font-bold">💡 Mettez à jour le statut depuis l'application Chauffeur à droite</p>
                  </div>
                ) : (
                  /* Client State: Completed */
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-cyan-950 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 mb-4">
                      <Check size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{t.tripCompleted}</h3>
                    <p className="text-xs text-slate-400 mb-8">La mission a été clôturée. Merci d'avoir choisi VanZ !</p>

                    <button 
                      onClick={sbReset} 
                      className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition"
                    >
                      {t.resetBtn}
                    </button>
                  </div>
                )
              ) : (
                // --- LIVE DB CLIENT VIEW ---
                !dbActiveJob ? (
                  /* Live DB state: Request Form */
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                      <Database size={18} />
                      {t.postJobTitle}
                    </h3>

                    {/* Inputs */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1 font-bold">{t.pickup}</label>
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                          <MapPin className="text-green-500 mr-2" size={16} />
                          <input 
                            value={formPickup} 
                            onChange={(e) => setFormPickup(e.target.value)} 
                            className="bg-transparent text-sm w-full outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1 font-bold">{t.dropoff}</label>
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                          <MapPin className="text-red-500 mr-2" size={16} />
                          <input 
                            value={formDropoff} 
                            onChange={(e) => setFormDropoff(e.target.value)} 
                            className="bg-transparent text-sm w-full outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1 font-bold">{t.serviceType}</label>
                          <select 
                            value={formServiceType}
                            onChange={(e) => setFormServiceType(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs w-full text-white outline-none"
                          >
                            <option value="van_standard">{t.vanStandard}</option>
                            <option value="van_large">{t.vanLarge}</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 block mb-1 font-bold">{t.paymentMethod}</label>
                          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white flex items-center font-bold">
                            <CreditCard size={14} className="text-cyan-400 mr-1.5" />
                            {t.cash}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={dbPostJob} 
                      className="mt-8 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-1"
                    >
                      {t.postBtn}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ) : dbActiveJob.status === "open" ? (
                  /* Live DB state: Waiting for Bids */
                  <div className="flex-1 flex flex-col">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded text-[10px] font-bold uppercase">{dbActiveJob.service_type}</span>
                        <span className="text-[10px] text-slate-500 font-mono">#{dbActiveJob.id.substring(0,6)}</span>
                      </div>
                      <p className="text-sm font-semibold text-white mb-1"><span className="text-xs text-slate-400">De:</span> {dbActiveJob.pickup_address}</p>
                      <p className="text-sm font-semibold text-white"><span className="text-xs text-slate-400">À:</span> {dbActiveJob.dropoff_address}</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-start">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wide">{t.waitingBids}</h4>
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
                      </div>

                      {dbBids.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                          <AlertCircle size={24} className="mb-2 text-slate-600" />
                          <p className="text-xs">{t.noBidsYet}</p>
                          <p className="text-[10px] text-cyan-500/80 mt-2 font-bold animate-pulse">💡 Soumettez une offre depuis l'application Chauffeur à droite</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dbBids.map((bid) => (
                            <div key={bid.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex justify-between items-center">
                              <div>
                                <h5 className="text-xs font-bold text-white">Chauffeur E2E</h5>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-slate-400">Van standard</span>
                                  <div className="flex items-center text-[10px] text-yellow-500">
                                    <Star size={10} fill="currentColor" className="mr-0.5" />
                                    4.9
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-sm font-extrabold text-cyan-400">{bid.amount} {t.currency}</span>
                                <button 
                                  onClick={() => dbAcceptBid(bid.id)} 
                                  className="px-2.5 py-1 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-lg text-xs transition"
                                >
                                  {t.acceptBtn}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : dbActiveJob.status === "matched" ? (
                  /* Live DB state: Matched */
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-green-950 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mb-4 animate-bounce">
                      <Truck size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{t.jobMatched}</h3>
                    <p className="text-xs text-slate-400 mb-6 max-w-xs">La mission a été jumelée. Le chauffeur se dirige vers le lieu de chargement.</p>
                    
                    <p className="text-[10px] text-green-400/80 animate-pulse font-bold">💡 Finalisez la course depuis l'application Chauffeur à droite</p>
                  </div>
                ) : (
                  /* Live DB state: Completed */
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-cyan-950 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 mb-4">
                      <Check size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{t.tripCompleted}</h3>
                    <p className="text-xs text-slate-400 mb-8 font-semibold text-green-400 animate-pulse">💡 La commission de 15% a été créditée !</p>

                    <button 
                      onClick={async () => {
                        if (dbClientSession?.user?.id) {
                          await datasql.from("jobs").delete().eq("client_id", dbClientSession.user.id);
                          setDbActiveJob(null);
                          setDbBids([]);
                        }
                      }} 
                      className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition"
                    >
                      {t.resetBtn}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* --- DEVICE 2: DRIVER APP VIEW --- */}
        <div className="flex flex-col items-center">
          <div className="mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <h2 className="text-xl font-bold tracking-wide text-blue-500 uppercase">{t.driverTitle}</h2>
          </div>

          {/* Smartphone Bezel */}
          <div className="relative border-[12px] border-slate-800 rounded-[3rem] w-[370px] h-[740px] bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-slate-800 rounded-b-2xl z-50 flex justify-center items-center">
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-full mr-2"></span>
              <span className="w-12 h-1 bg-slate-900 rounded-full"></span>
            </div>

            {/* Simulated Phone Screen Content */}
            <div className="flex-1 flex flex-col bg-slate-950 pt-8 px-4 overflow-y-auto">
              
              {/* Screen Top Bar */}
              <div className="flex justify-between items-center mb-6 text-xs text-slate-500 font-bold">
                <span>15:45</span>
                <div className="flex gap-1.5 items-center">
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-slate-600 rounded-sm p-0.5 flex items-center">
                    <div className="h-full w-4 bg-green-500 rounded-sm"></div>
                  </div>
                </div>
              </div>

              {/* Sandbox vs DB Driver Control */}
              {simMode === "sandbox" ? (
                // --- SANDBOX DRIVER VIEW ---
                sbDriverStatus === "online" ? (
                  /* Driver State: Looking for Jobs */
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-6 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{t.commissionDebt}</div>
                        <div className="text-lg font-extrabold text-red-400">{sbDriverDebt.toFixed(2)} {t.currency}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Gains nets</div>
                        <div className="text-lg font-extrabold text-green-400">{sbDriverPayout.toFixed(2)} {t.currency}</div>
                      </div>
                    </div>

                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wide mb-4">Missions disponibles</h4>

                    {!sbJob || sbJob.status !== "open" ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center py-12">
                        <AlertCircle size={24} className="mb-2 text-slate-600" />
                        <p className="text-xs">Aucune mission disponible pour le moment.</p>
                        <p className="text-[10px] text-cyan-500/80 mt-2 font-bold animate-pulse">💡 Créez une mission depuis l'application Client à gauche</p>
                      </div>
                    ) : (
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded text-[9px] font-bold uppercase">{sbJob.service_type}</span>
                          <span className="text-[9px] text-slate-500 font-mono">#{sbJob.id}</span>
                        </div>
                        <p className="text-xs"><span className="text-slate-400">De:</span> {sbJob.pickup}</p>
                        <p className="text-xs"><span className="text-slate-400">À:</span> {sbJob.dropoff}</p>

                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">Prop. : Cash</span>
                          <button 
                            onClick={sbPlaceBid} 
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg text-xs transition"
                          >
                            Proposer un prix
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : sbDriverStatus === "bidding" ? (
                  /* Driver State: Placed Bid, waiting for Client */
                  <div className="flex-1 flex flex-col">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Votre Offre</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-extrabold text-white">{formBidAmount} {t.currency}</span>
                        <span className="px-2 py-0.5 bg-yellow-950 text-yellow-400 border border-yellow-800 rounded text-[10px] font-bold">En attente</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                      <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4"></div>
                      <p className="text-xs">Le client examine votre offre de {formBidAmount} TND.</p>
                      <p className="text-[10px] text-green-400/80 animate-pulse mt-2 font-bold">💡 Acceptez l'offre depuis l'application Client à gauche</p>
                    </div>
                  </div>
                ) : sbDriverStatus === "matched" ? (
                  /* Driver State: Job Matched, driving to pickup/dropoff */
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="bg-green-950 border border-green-800/40 p-3.5 rounded-xl flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-green-400">{t.activeTrip}</span>
                        <span className="text-sm font-extrabold text-white">{sbJob.accepted_amount} TND</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                        <p className="text-xs"><span className="text-slate-400">Client:</span> Test Client</p>
                        <p className="text-xs"><span className="text-slate-400">Tel:</span> +216 99 000 001</p>
                        <p className="text-xs"><span className="text-slate-400">Départ:</span> {sbJob.pickup}</p>
                        <p className="text-xs"><span className="text-slate-400">Arrivée:</span> {sbJob.dropoff}</p>
                      </div>
                    </div>

                    <button 
                      onClick={sbCompleteJob} 
                      className="w-full bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Check size={18} />
                      {t.completeTrip}
                    </button>
                  </div>
                ) : (
                  /* Driver State: Completed */
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-950 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mb-4 mx-auto">
                        <Check size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{t.tripCompleted}</h3>
                      <p className="text-xs text-slate-400 mb-6">Course finalisée avec succès.</p>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left space-y-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Montant total:</span>
                          <span className="font-bold">{sbJob.accepted_amount} TND</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Commission due (15%):</span>
                          <span className="font-bold text-red-400">-{sbCommission.toFixed(2)} TND</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-slate-800 pt-2 font-bold text-green-400">
                          <span>Gain net:</span>
                          <span>+{sbDriverPayout.toFixed(2)} TND</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={sbReset} 
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl transition"
                    >
                      Retour au tableau de bord
                    </button>
                  </div>
                )
              ) : (
                // --- LIVE DB DRIVER VIEW ---
                !dbActiveJob ? (
                  /* Live DB state: Offline/Looking for jobs */
                  <div className="flex-1 flex flex-col">
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 mb-6">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{t.commissionDebt}</div>
                      <div className="text-lg font-extrabold text-red-400">{dbDriverDebt.toFixed(2)} {t.currency}</div>
                    </div>

                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wide mb-4">Missions disponibles</h4>

                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center py-12">
                      <AlertCircle size={24} className="mb-2 text-slate-600" />
                      <p className="text-xs">Aucune mission disponible pour le moment.</p>
                      <p className="text-[10px] text-cyan-500/80 mt-2 font-bold animate-pulse">💡 Créez une mission depuis l'application Client à gauche</p>
                    </div>
                  </div>
                ) : dbActiveJob.status === "open" ? (
                  /* Live DB state: Bid Input */
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded text-[9px] font-bold uppercase">{dbActiveJob.service_type}</span>
                        <span className="text-[9px] text-slate-500 font-mono">#{dbActiveJob.id.substring(0,6)}</span>
                      </div>
                      <p className="text-xs"><span className="text-slate-400">De:</span> {dbActiveJob.pickup_address}</p>
                      <p className="text-xs"><span className="text-slate-400">À:</span> {dbActiveJob.dropoff_address}</p>

                      <div className="pt-3 border-t border-slate-800">
                        <label className="text-[10px] text-slate-400 block mb-1 font-bold">{t.bidAmount}</label>
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                          <input 
                            type="number"
                            value={formBidAmount}
                            onChange={(e) => setFormBidAmount(Number(e.target.value))}
                            className="bg-transparent text-sm w-full outline-none font-bold text-white"
                          />
                          <span className="text-xs text-slate-400 font-bold">TND</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={dbPlaceBid} 
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl transition"
                    >
                      Proposer le tarif
                    </button>
                  </div>
                ) : dbActiveJob.status === "matched" ? (
                  /* Live DB state: Matched, driving */
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="bg-green-950 border border-green-800/40 p-3.5 rounded-xl flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-green-400">{t.activeTrip}</span>
                        <span className="text-sm font-extrabold text-white">Tarif accepté</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                        <p className="text-xs"><span className="text-slate-400">Client:</span> Test Client</p>
                        <p className="text-xs"><span className="text-slate-400">Départ:</span> {dbActiveJob.pickup_address}</p>
                        <p className="text-xs"><span className="text-slate-400">Arrivée:</span> {dbActiveJob.dropoff_address}</p>
                      </div>
                    </div>

                    <button 
                      onClick={dbCompleteJob} 
                      className="w-full bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Check size={18} />
                      {t.completeTrip}
                    </button>
                  </div>
                ) : (
                  /* Live DB state: Completed */
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-950 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mb-4 mx-auto">
                        <Check size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{t.tripCompleted}</h3>
                      <p className="text-xs text-slate-400">Course finalisée et commission de 15% déduite.</p>
                    </div>

                    <button 
                      onClick={async () => {
                        if (dbClientSession?.user?.id) {
                          await datasql.from("jobs").delete().eq("client_id", dbClientSession.user.id);
                          setDbActiveJob(null);
                          setDbBids([]);
                        }
                      }} 
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl transition"
                    >
                      Retour
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Simulator Log Board */}
      <div className="w-full max-w-6xl mt-12 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <RefreshCw size={14} className="text-cyan-400 animate-spin" />
          Console de Suivi de Flux
        </h3>
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-2">
          {simMode === "sandbox" ? (
            <>
              <p className="text-slate-500">[SYSTEM] Simulator Sandbox Mode active. In-memory state tracking.</p>
              {sbJob && <p className="text-cyan-400">[CLIENT] Job created: De "{sbJob.pickup}" à "{sbJob.dropoff}" pour le type {sbJob.service_type}.</p>}
              {sbBids.map((b) => (
                <p key={b.id} className="text-yellow-400">[DRIVER] Bid placed: {b.amount} TND by {b.driver_name} (Rating: {b.rating}).</p>
              ))}
              {sbJob?.status === "matched" && <p className="text-green-400">[SYSTEM] MATCHED! Client accepted driver's bid of {sbJob.accepted_amount} TND.</p>}
              {sbJob?.status === "completed" && (
                <>
                  <p className="text-cyan-400">[SYSTEM] COMPLETED! Commission Math: {sbCommission.toFixed(2)} TND (15%) | Driver Payout: {sbDriverPayout.toFixed(2)} TND.</p>
                  <p className="text-red-400">[SYSTEM] Driver pending commission debt updated: {sbDriverDebt.toFixed(2)} TND total.</p>
                </>
              )}
            </>
          ) : (
            dbLogs.length === 0 ? (
              <p className="text-slate-600">Aucun log disponible. Cliquez sur "Connexion E2E automatique" pour démarrer.</p>
            ) : (
              dbLogs.map((log, index) => (
                <p key={index} className="text-slate-300">{log}</p>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
