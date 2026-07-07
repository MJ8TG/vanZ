import { datasql } from '@/lib/supabase';

export type ClientWalletTx = {
  id: string;
  amount: number;
  type: 'credit' | 'debit' | 'promo' | 'referral' | 'refund';
  note: string | null;
  created_at: string;
};

export interface ClientWallet {
  balance: number;
  points: number;
  txs: ClientWalletTx[];
}

export type DriverWalletTx = {
  id: string;
  amount: number;
  type: 'earning' | 'refund' | 'penalty' | 'withdrawal';
  created_at: string;
};

export type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

export interface DriverWallet {
  balance: number;
  pendingDebt: number;
  transactions: DriverWalletTx[];
  pendingWithdrawals: Withdrawal[];
}

export class WalletService {
  static async fetchClientWallet(userId: string): Promise<ClientWallet> {
    const [{ data: profile }, { data: txData }] = await Promise.all([
      datasql.from('users').select('credit_balance, loyalty_points').eq('id', userId).single(),
      datasql
        .from('wallet_transactions')
        .select('id, amount, type, note, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    return {
      balance: Number(profile?.credit_balance || 0),
      points: Number(profile?.loyalty_points || 0),
      txs: (txData || []) as ClientWalletTx[],
    };
  }

  static async fetchDriverWallet(userId: string): Promise<DriverWallet> {
    const [{ data: profile }, { data: txs }, { data: withdrawals }] = await Promise.all([
      datasql.from('users').select('credit_balance, pending_commission_debt').eq('id', userId).single(),
      datasql
        .from('wallet_transactions')
        .select('id, amount, type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      datasql
        .from('withdrawals')
        .select('id, amount, status, created_at')
        .eq('driver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);
    return {
      balance: Number(profile?.credit_balance || 0),
      pendingDebt: Number(profile?.pending_commission_debt || 0),
      transactions: (txs || []) as DriverWalletTx[],
      pendingWithdrawals: (withdrawals || []) as Withdrawal[],
    };
  }

  /** Requests a withdrawal of the given amount (driver only). */
  static async requestWithdrawal(driverId: string, amount: number): Promise<void> {
    const { error } = await datasql.from('withdrawals').insert({ driver_id: driverId, amount, status: 'pending' });
    if (error) throw error;
  }
}
