'use client';

import { useEffect, useState } from "react";
import { datasql as supabase } from '@/lib/datasql';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { LayoutDashboard, Users, UserCog, Briefcase, Ticket, HandCoins, Send, LogOut, Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const locale = useLocale();
  
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!adminUser || adminUser.role !== 'admin') {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setUserEmail(user.email || '');
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navLinks = [
    { href: `/admin`, icon: LayoutDashboard, label: "Métriques" },
    { href: `/admin/jobs`, icon: Briefcase, label: "Missions" },
    { href: `/admin/users`, icon: Users, label: "Utilisateurs" },
    { href: `/admin/promos`, icon: Ticket, label: "Codes Promo" },
    { href: `/admin/withdrawals`, icon: HandCoins, label: "Paiements" },
    { href: `/admin/notifications`, icon: Send, label: "Marketing" },
    { href: `/admin/system`, icon: UserCog, label: "Système" }
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#051E3C]"><Loader2 className="w-8 h-8 text-vanz-teal animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-[#051E3C] text-white flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-black text-vanz-yellow tracking-tight">VanZ Panel</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all font-medium"
            >
              <link.icon className="w-5 h-5 text-vanz-teal" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-all font-bold">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shadow-sm">
          <h1 className="text-lg font-bold text-gray-800">Console Administration</h1>
          <div className="ml-auto flex items-center gap-4">
             <div className="h-8 w-8 bg-vanz-teal rounded-full flex items-center justify-center text-white font-bold text-sm">
               A
             </div>
             <span className="text-sm font-semibold text-gray-700">{userEmail}</span>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
