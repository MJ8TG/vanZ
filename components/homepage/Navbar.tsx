"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Truck, Package, Building2, Zap, ArrowLeftRight, Sofa, MessageCircle, ClipboardList } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import MessageBell from "@/components/chat/MessageBell";
import { datasql } from "@/lib/datasql";


const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export default function Navbar() {
  const t = useTranslations("nav");
  const tServices = useTranslations("services");
  const locale = useLocale();
  const otherLocale = locale === "fr" ? "ar" : "fr";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await datasql.auth.getUser();
        if (user) {
          setIsSignedIn(true);
          setUserId(user.id);
          const { data: profile } = await datasql.from('users').select('role').eq('id', user.id).single();
          if (profile?.role === 'driver') setIsDriver(true);
        } else {
          setIsSignedIn(false);
          setUserId(null);
          setIsDriver(false);
        }
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = datasql.auth.onAuthStateChange(() => {
       checkAuth();
    });

    return () => {
       subscription.unsubscribe();
    };
  }, []);


  const services = [
    { key: "moving", icon: Truck, slug: "demenagement-tunis" },
    { key: "furniture", icon: Sofa, slug: "transport-meuble-tunis" },
    { key: "parcel", icon: Package, slug: "demenagement-pas-cher" },
    { key: "intercity", icon: ArrowLeftRight, slug: "livraison-tunis-sfax" },
    { key: "office", icon: Building2, slug: "demenagement-bureaux" },
    { key: "express", icon: Zap, slug: "livraison-express" },
  ] as const;

  return (
    <nav className="sticky top-0 z-50 bg-vanz-teal shadow-lg shadow-vanz-teal/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex-shrink-0">
            <Image
              src="/logo-vanz-white.png"
              alt="VanZ"
              width={110}
              height={40}
              priority
              className="h-9 w-auto md:h-10"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* Services Dropdown */}
            <div className="relative">
              <button
                onClick={() => setServicesOpen(!servicesOpen)}
                onBlur={() => setTimeout(() => setServicesOpen(false), 200)}
                className="flex items-center gap-1.5 px-3 py-2 text-white/90 hover:text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                {t("services")}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`} />
              </button>

              {servicesOpen && (
                <div className="absolute top-full mt-2 ltr:left-0 rtl:right-0 w-64 bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-100 py-2 animate-[fade-in-up_200ms_ease-out]">
                  {services.map(({ key, icon: Icon, slug }) => (
                    <Link
                      key={key}
                      href={`/${locale}/${slug}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-vanz-navy hover:bg-vanz-ice transition-colors duration-150"
                    >
                      <Icon className="w-5 h-5 text-vanz-teal" />
                      <span className="text-sm font-medium">{tServices(key)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Links / Dashboard */}
            {authLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 bg-white/10 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
              </div>
            ) : isSignedIn ? (
              <div className="flex items-center gap-2">
                 <Link href={`/${locale}/mes-missions`} className="px-3 py-2 text-white/90 hover:text-white font-bold text-sm rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center gap-1">
                  {t("dashboard")}
                </Link>
                {IS_DEV_MODE && (
                  <Link href={`/${locale}/admin`} className="px-3 py-2 text-vanz-yellow hover:text-white font-black text-sm rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center gap-1 border border-vanz-yellow/30">
                    ADMIN
                  </Link>
                )}
              </div>
            ) : (
              <>
                <Link href={`/${locale}/login`} className="px-3 py-2 text-white/90 hover:text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all duration-200">{t("login")}</Link>
                <Link
                  href={`/${locale}/signup`}
                  className="px-3 py-2 text-white/90 hover:text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  {t("signup")}
                </Link>
              </>
            )}

            {/* Message Bell */}
            {isSignedIn && <MessageBell userId={userId!} />}

            {/* Notification Bell */}
            {isSignedIn && <NotificationBell userId={userId!} />}

            {/* Role-Specific Primary CTA */}
            {authLoading ? (
              <div className="h-10 w-40 bg-vanz-yellow/30 rounded-full animate-pulse" />
            ) : isDriver ? (
              <Link href={`/${locale}/chauffeur/missions`} className="px-5 py-2.5 bg-vanz-yellow text-vanz-navy font-black text-sm rounded-full hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-vanz-yellow/30 flex items-center gap-2">
                 🚚 {t("market")}
              </Link>
            ) : isSignedIn ? (
              <Link href={`/${locale}/nouveau-job`} className="px-5 py-2.5 bg-vanz-yellow text-vanz-navy font-black text-sm rounded-full hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-vanz-yellow/30 flex items-center gap-2">
                📦 {t("postJob")}
              </Link>
            ) : (
              <Link href={`/${locale}/devenir-chauffeur`} className="px-5 py-2.5 bg-vanz-yellow text-vanz-navy font-black text-sm rounded-full hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-vanz-yellow/30 flex items-center gap-2">
                🚀 {t("becomeDriver")}
              </Link>
            )}

            {/* Language Toggle */}
            <Link
              href={`/${otherLocale}`}
              className="px-3 py-2 text-white/90 hover:text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all duration-200 border border-white/20"
            >
              {t("language")}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative z-50 p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label={mobileOpen ? t("close") : t("menu")}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-vanz-teal-dark border-t border-white/10 animate-[fade-in_200ms_ease-out]">
          <div className="px-4 py-4 space-y-1">
            {/* Services */}
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="flex items-center justify-between w-full px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white/10 transition-colors"
            >
              {t("services")}
              <ChevronDown className={`w-5 h-5 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
            </button>
            {servicesOpen && (
              <div className="ltr:pl-4 rtl:pr-4 space-y-1">
                {services.map(({ key, icon: Icon, slug }) => (
                  <Link
                    key={key}
                    href={`/${locale}/${slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => {
                        setMobileOpen(false);
                        setServicesOpen(false);
                    }}
                  >
                    <Icon className="w-5 h-5 text-vanz-yellow" />
                    <span className="text-sm">{tServices(key)}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Messages */}
            <Link href={`/${locale}/messages`} className="flex items-center gap-3 px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
              <MessageCircle className="w-5 h-5 text-vanz-yellow" />
              {t("messages")}
            </Link>

            {/* Auth Links / Dashboard */}
            {isSignedIn ? (
              <>
                {isDriver && (
                  <Link
                    href={`/${locale}/chauffeur/missions`}
                    className="flex items-center gap-3 px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Truck className="w-5 h-5 text-vanz-yellow" />
                    {t("market")}
                  </Link>
                )}
                <Link
                  href={`/${locale}/mes-missions`}
                  className="flex items-center gap-3 px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <ClipboardList className="w-5 h-5 text-vanz-yellow" />
                  {t("dashboard")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="block px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("login")}
                </Link>
                <Link
                  href={`/${locale}/signup`}
                  className="block px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("signup")}
                </Link>
              </>
            )}

            {/* Role-Specific Primary CTA Mobile */}
            {isDriver ? (
              <Link href={`/${locale}/chauffeur/missions`} className="block w-full text-center px-5 py-3 bg-vanz-yellow text-vanz-navy font-black text-base rounded-full hover:brightness-110 transition-all mt-3" onClick={() => setMobileOpen(false)}>
                🚚 {t("market")}
              </Link>
            ) : (
              isSignedIn ? (
                <Link href={`/${locale}/nouveau-job`} className="block w-full text-center px-5 py-3 bg-vanz-yellow text-vanz-navy font-black text-base rounded-full hover:brightness-110 transition-all mt-3" onClick={() => setMobileOpen(false)}>
                  📦 {t("postJob")}
                </Link>
              ) : (
                <Link href={`/${locale}/devenir-chauffeur`} className="block w-full text-center px-5 py-3 bg-vanz-yellow text-vanz-navy font-black text-base rounded-full hover:brightness-110 transition-all mt-3" onClick={() => setMobileOpen(false)}>
                  🚀 {t("becomeDriver")}
                </Link>
              )
            )}

            {/* Language */}
            <Link
              href={`/${otherLocale}`}
              className="block text-center px-3 py-3 text-white font-medium text-base border border-white/20 rounded-lg hover:bg-white/10 transition-colors mt-2"
              onClick={() => setMobileOpen(false)}
            >
              {t("language")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
