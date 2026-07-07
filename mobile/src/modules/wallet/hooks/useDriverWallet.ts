import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { WalletService } from '../services/walletService';

/** Driver balance, pending commission debt, transactions, and pending withdrawals. */
export function useDriverWallet(userId: string | undefined) {
  return useQuery({
    queryKey: qk.driverWallet(userId),
    queryFn: () => WalletService.fetchDriverWallet(userId!),
    enabled: !!userId,
  });
}
