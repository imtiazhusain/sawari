import { API_URL } from '../lib/env';
import { getRiderId } from '../lib/session';

const BASE_URL = API_URL || '/api/v1';

const TIMEOUT_MS = 10_000;

/** Every failure — network, timeout, or server — surfaces as one typed error the UI can reason about. */
export class ApiError extends Error {
  constructor(
    public readonly status: number, // 0 = never reached the server
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Worth retrying automatically / offering a retry button for. */
  get retryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function request<T>(
  path: string,
  { method = 'GET', body, headers }: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => {
      return controller.abort();
    },
    TIMEOUT_MS
  );
  const riderId = getRiderId();
  let response: Response;

  try {
    response = await fetch(
      `${BASE_URL}${path}`,
      {
        method,
        headers: {
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...(riderId && { 'X-Rider-Id': riderId }),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      }
    );
  } catch {
    throw controller.signal.aborted
      ? new ApiError(0, 'TIMEOUT', 'The server took too long to respond.')
      : new ApiError(0, 'NETWORK_ERROR', "Can't reach the server.");
  } finally {
    clearTimeout(timer);
  }

  const payload = await response.json().catch(() => {
    return null;
  });

  if (!response.ok) {
    const err = payload?.error;
    throw new ApiError(
      response.status,
      err?.code ?? 'UNKNOWN_ERROR',
      err?.message ?? 'Something went wrong.',
      err?.requestId,
      err?.details
    );
  }

  return payload?.data as T;
}
