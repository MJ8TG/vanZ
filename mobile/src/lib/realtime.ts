/**
 * Single source of truth for realtime channel/topic names.
 *
 * The driver broadcasts GPS on this channel and the client subscribes to it —
 * both ends MUST use the same string or no messages are delivered.
 */
export const driverTrackingChannel = (driverId: string) => `client-tracking-${driverId}`;

/** Broadcast event name for a live GPS coordinate update. */
export const LOCATION_UPDATE_EVENT = 'location_update';
