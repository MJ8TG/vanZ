import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { WalletService } from '../services/walletService';

/** Client balance, loyalty points, and recent wallet transactions. */
export function useClientWallet(userId: string | undefined) {
  return useQuery({
    queryKey: qk.wallet(userId),
    queryFn: () => WalletService.fetchClientWallet(userId!),
    enabled: !!userId,
  });
}
