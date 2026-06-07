import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Extracts and verifies the authenticated user from a request's Authorization header.
 * 
 * Usage in API routes:
 * ```ts
 * const { user, error } = await getAuthenticatedUser(req);
 * if (error) return error;
 * // user is guaranteed non-null here
 * ```
 * 
 * The frontend must pass the Supabase access token as:
 *   Authorization: Bearer <access_token>
 */
export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Non authentifié. Token manquant.' },
        { status: 401 }
      ),
    };
  }

  // Use the service role client to verify the token — this is the only
  // reliable way to validate a JWT without @supabase/ssr.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Session invalide ou expirée.' },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Creates a Supabase admin client (service role) for privileged DB operations.
 * Only use AFTER verifying the caller via getAuthenticatedUser().
 */
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Extracts client IP address from headers safely with standard fallbacks.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim();
    if (ip) return ip;
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * Verifies JWT session token and then enforces a database-level role check.
 */
export async function getAuthenticatedUserWithRole(
  req: Request,
  allowedRoles: ('client' | 'driver' | 'admin')[]
) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError || !user) {
    return { user: null, role: null, error: authError };
  }

  const supabase = getServiceClient();
  const { data: profile, error: dbError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (dbError || !profile) {
    return {
      user: null,
      role: null,
      error: NextResponse.json(
        { error: 'Profil utilisateur introuvable.' },
        { status: 404 }
      ),
    };
  }

  if (!allowedRoles.includes(profile.role as any)) {
    return {
      user: null,
      role: profile.role,
      error: NextResponse.json(
        { error: 'Accès interdit. Rôle insuffisant.' },
        { status: 403 }
      ),
    };
  }

  return { user, role: profile.role as 'client' | 'driver' | 'admin', error: null };
}
