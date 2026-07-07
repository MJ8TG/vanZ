/**
 * Central React Query key factory.
 *
 * Keeps cache keys consistent and typo-free across hooks and realtime
 * invalidation. Passing fewer args yields a prefix key, which
 * `invalidateQueries` matches against the more specific keys — e.g.
 * `qk.missions(uid)` invalidates every `qk.missions(uid, tab)`.
 */
export const qk = {
  missions: (userId?: string, tab?: string) => ['missions', userId, tab].filter((v) => v !== undefined),
  trips: (driverId?: string, tab?: string) => ['trips', driverId, tab].filter((v) => v !== undefined),
  jobDetails: (jobId?: string) => ['job-details', jobId].filter((v) => v !== undefined),
  savedAddresses: (userId?: string) => ['saved-addresses', userId] as const,
  favoriteDrivers: (userId?: string) => ['favorite-drivers', userId] as const,
  homeExtras: (userId?: string) => ['home-extras', userId] as const,
  wallet: (userId?: string) => ['wallet', userId] as const,
  driverWallet: (userId?: string) => ['driver-wallet', userId] as const,
  earnings: (userId?: string) => ['earnings', userId] as const,
  notifications: (userId?: string) => ['notifications', userId] as const,
  referral: (userId?: string) => ['referral', userId] as const,
  driverStatus: (userId?: string) => ['driver-status', userId] as const,
  driverStats: (userId?: string) => ['driver-stats', userId] as const,
  driverVehicle: (userId?: string) => ['driver-vehicle', userId] as const,
  conversations: (userId?: string) => ['conversations', userId] as const,
};
