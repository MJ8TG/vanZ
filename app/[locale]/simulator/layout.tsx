import { notFound } from 'next/navigation';

/**
 * The simulator has a "live Supabase" mode that writes directly to the
 * production database from the browser — it is how every job currently in
 * 'completed' got there, bypassing the payout pipeline entirely. It is a
 * development tool and must not be reachable in production.
 *
 * Server component: the check runs before the page is sent, so the route 404s
 * rather than shipping the UI and hiding it client-side.
 */
export default function SimulatorLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <>{children}</>;
}
