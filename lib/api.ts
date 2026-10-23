import {
    getAccessToken,
    getRefreshToken,
    isAccessTokenExpired,
    logout,
    setAccessToken,
} from './auth';
import { DEMO_MODE, demoRequest } from './demo-data';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL;

export { API_BASE_URL, isAccessTokenExpired };

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// Extra marker on requests that were already retried once with a fresh token,
// so a server that keeps rejecting valid tokens cannot cause a refresh loop.
type ApiRequestInit = RequestInit & { retried401?: boolean };

/**
 * Session teardown must happen exactly once, however many concurrent requests
 * hit 401 at the same moment.
 */
let sessionEnded = false;

function endSession() {
    if (typeof window === 'undefined' || sessionEnded) return;
    sessionEnded = true;
    logout();
}

/**
 * Single-flight refresh: when several requests expire at once, they all
 * await one refresh call instead of racing to mint new tokens.
 */
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
            cache: 'no-store',
        });
        if (!response.ok) return false;
        const data = (await response.json()) as {
            access?: string;
            refresh?: string;
        };
        if (!data.access) return false;
        setAccessToken(data.access, data.refresh);
        return true;
    } catch {
        return false;
    }
}

async function handleTokenExpiry(): Promise<string | null> {
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
        });
    }
    const refreshed = await refreshPromise;
    return refreshed ? getAccessToken() : null;
}

/** Extracts the backend's error message from a failed response. */
async function parseApiError(response: Response, fallback: string) {
    const error = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const detail = Array.isArray(error.detail)
        ? error.detail.join(' ')
        : (error.detail as string | undefined);
    return new ApiError(
        detail ||
            (error.message as string | undefined) ||
            (error.error as string | undefined) ||
            fallback,
        response.status
    );
}

export const api = async <T = unknown>(
    endpoint: string,
    options: ApiRequestInit = {}
): Promise<T> => {
    if (DEMO_MODE) {
        try {
            return await demoRequest<T>(endpoint, options);
        } catch (error) {
            throw new ApiError(
                error instanceof Error ? error.message : 'Demo request failed',
                500
            );
        }
    }

    const token = getAccessToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    // `retried401` is transport metadata — never forward it to fetch().
    const retried401 = options.retried401 === true;
    const { retried401: _retried401, ...fetchOptions } = options;

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
            cache: 'no-store',
        });
    } catch {
        throw new ApiError(
            'Could not reach the server. Check your connection and try again.',
            0
        );
    }

    if (response.status === 401) {
        const isAuthCall = endpoint.startsWith('/auth/');
        if (isAuthCall) {
            // Wrong credentials or an unusable refresh token on an auth call —
            // surface the backend's message, don't tear down the session.
            throw await parseApiError(response, 'Invalid email or password');
        }
        if (!retried401) {
            // Access token expired — refresh it once and retry the request.
            const newToken = await handleTokenExpiry();
            if (newToken) {
                return api<T>(endpoint, {
                    ...fetchOptions,
                    retried401: true,
                    headers: {
                        ...options.headers,
                        Authorization: `Bearer ${newToken}`,
                    },
                });
            }
        }
        // Refresh failed or was already tried — the session is over.
        endSession();
        throw new ApiError('Session expired', 401);
    }

    if (!response.ok) {
        throw await parseApiError(response, 'Request failed');
    }

    // Handle 204 No Content
    if (response.status === 204) return {} as T;

    return response.json();
};
