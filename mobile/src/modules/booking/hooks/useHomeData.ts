import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { BookingService, type SavedAddress } from '../services/bookingService';

export type FavDriver = {
  driver_id: string;
  name: string;
  rating: number | null;
  vehicle: string | null;
  initials: string;
};

export type HomeData = {
  savedAddresses: SavedAddress[];
  favDrivers: FavDriver[];
};

/** Client home extras (saved addresses + favorite drivers), shaped for the UI. */
export function useHomeData(userId: string | undefined) {
  return useQuery<HomeData>({
    queryKey: qk.homeExtras(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { savedAddresses, favRaw } = await BookingService.fetchClientHome(userId!);
      const favDrivers: FavDriver[] = favRaw.map((f) => {
        const u = Array.isArray(f.drivers?.users) ? f.drivers.users[0] : f.drivers?.users;
        const first = u?.first_name ?? '';
        const last = u?.last_name ?? '';
        return {
          driver_id: f.driver_id,
          name: `${first} ${last}`.trim(),
          rating: u?.cached_rating != null ? Number(u.cached_rating) : null,
          vehicle: f.drivers?.vehicle_type ?? null,
          initials: `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || 'C',
        };
      });
      return { savedAddresses, favDrivers };
    },
  });
}
