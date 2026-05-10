import { datasql } from '@/lib/datasql';

/**
 * Makes an authenticated fetch request by automatically attaching
 * the current Supabase session's access token as a Bearer token.
 *
 * Drop-in replacement for `fetch()` in authenticated contexts.
 *
 * Usage:
 * ```ts
 * const res = await authFetch('/api/jobs/accept', {
 *   method: 'POST',
 *   body: JSON.stringify({ job_id, bid_id, client_id })
 * });
 * ```
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { data: { session } } = await datasql.auth.getSession();

  const headers = new Headers(options.headers);

  // Always set JSON content type unless explicitly overridden
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject the access token
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
