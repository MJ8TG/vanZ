import { createClient } from '@supabase/supabase-js';

// The datasql singleton pattern for global queries, satisfying Rule #5
// "All queries must go through the datasql"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials are missing. Live queries will fail until .env.local is populated.");
}

export const datasql = createClient(supabaseUrl, supabaseAnonKey);

// Helpful wrapper functions for the Auctions soft-delete rule
export const softDeleteAuction = async (auctionId: string) => {
  return await datasql
    .from('Auctions')
    .update({ is_deleted: true })
    .eq('id', auctionId);
};
