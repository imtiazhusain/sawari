import { ApiError } from '../api/client';

const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "We can't reach the server. Check your connection and try again.",
  TIMEOUT: 'The server is taking too long. Try again in a moment.',
  NO_DRIVERS_AVAILABLE: 'No drivers are free nearby right now. Try again in a minute or switch ride type.',
  RIDER_HAS_ACTIVE_RIDE: 'You already have an active ride. Finish or cancel it before booking another.',
  INVALID_STATE_TRANSITION: 'That ride has already changed. Refresh to see its latest status.',
  DRIVER_UNAVAILABLE: 'This driver is not available for new rides.',
  DRIVER_TOO_FAR: 'You are too far from this pickup to take the ride.',
  DRIVER_BUSY: 'Finish your current ride before changing availability.',
  IDEMPOTENCY_KEY_REUSED: 'This request conflicts with an earlier one. Please start a new booking.',
  VALIDATION_ERROR: 'Some details are not valid. Check the pickup and destination.',
};

/** Turns any thrown value into a sentence a rider can act on. */
export function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) return 'Something went wrong on our side. Please try again.';
    return MESSAGES[error.code] ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}

export const isRetryable = (error: unknown): boolean => error instanceof ApiError && error.retryable;
