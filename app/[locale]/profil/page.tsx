'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { datasql } from '@/lib/datasql';
import { 
  User, Phone, Mail, MapPin, Star, Shield, LogOut, Loader2, 
  Package, Truck, CreditCard, Heart, Settings, ChevronRight 
} from 'lucide-react';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  role: string;
  cached_rating: number;
  total_reviews: number;
  credit_balance: number;
  referral_code: string;
  created_at: string;
}

export default function ProfilPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('profil');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await datasql.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data } = await datasql
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data as UserProfile);
      setLoading(false);
    };
    fetchProfile();
  }, [locale, router]);

  const handleLogout = async () => {
    await datasql.auth.signOut();
    router.push(`/${locale}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center">
        <Loader2 className="w-10 h-10 text-vanz-teal animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const menuItems = [
    { 
      icon: Package, 
      label: t('menu.mesMissions'), 
      href: profile.role === 'driver' ? `/${locale}/chauffeur/dashboard` : `/${locale}/mes-missions`, 
      color: 'text-vanz-teal' 
    },
    { icon: Heart, label: t('menu.favorites'), href: `/${locale}/profil/favoris`, color: 'text-rose-500' },
    { icon: CreditCard, label: t('menu.wallet', { balance: profile.credit_balance || 0 }), href: `/${locale}/profil/wallet`, color: 'text-emerald-500' },
    { icon: Settings, label: t('menu.settings'), href: `/${locale}/profil/settings`, color: 'text-gray-500' },
  ];

  if (profile.role === 'driver') {
    menuItems.splice(1, 0, {
      icon: Truck,
      label: t('menu.market'),
      href: `/${locale}/chauffeur/missions`,
      color: 'text-vanz-navy',
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-br from-vanz-navy via-vanz-navy to-vanz-teal p-8 text-white text-center">
            <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border-4 border-white/30">
              <span className="text-3xl font-black">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </span>
            </div>
            <h1 className="text-2xl font-black mb-1">
              {profile.first_name} {profile.last_name}
            </h1>
            <div className="flex items-center justify-center gap-2 text-white/70 text-sm font-medium">
              <Shield className="w-4 h-4" />
              <span className="capitalize">{profile.role === 'driver' ? t('roleDriver') : t('roleClient')}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 p-4 bg-gray-50/50">
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 text-vanz-yellow mb-1">
                <Star className="w-4 h-4 fill-vanz-yellow" />
                <span className="text-lg font-black text-vanz-navy">
                  {profile.cached_rating ? profile.cached_rating.toFixed(1) : '—'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('note')}</p>
            </div>
            <div className="text-center px-2">
              <p className="text-lg font-black text-vanz-navy mb-1">{profile.total_reviews || 0}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('reviews')}</p>
            </div>
            <div className="text-center px-2">
              <p className="text-lg font-black text-vanz-navy mb-1">
                {new Date(profile.created_at).toLocaleDateString(locale === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('member')}</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6 space-y-4">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">{t('info')}</h2>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-vanz-ice rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-vanz-teal" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold">{t('phone')}</p>
              <p className="text-sm font-bold text-vanz-navy">{profile.phone || '—'}</p>
            </div>
          </div>

          {profile.email && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-vanz-ice rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-vanz-teal" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">{t('email')}</p>
                <p className="text-sm font-bold text-vanz-navy">{profile.email}</p>
              </div>
            </div>
          )}

          {profile.city && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-vanz-ice rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-vanz-teal" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">{t('city')}</p>
                <p className="text-sm font-bold text-vanz-navy">{profile.city}</p>
              </div>
            </div>
          )}

          {profile.referral_code && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-vanz-yellow/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-vanz-yellow" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">{t('referral')}</p>
                <p className="text-sm font-black text-vanz-navy tracking-widest">{profile.referral_code}</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left ${i > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="flex-1 text-sm font-bold text-vanz-navy">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-50 text-red-500 font-bold rounded-3xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>
      </main>
    </div>
  );
}
