import { getAccessToken, getRefreshToken, setAccessToken } from './auth';
import { DEMO_MODE, demoRequest } from './demo-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export { API_BASE_URL };

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
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

export const api = async <T = unknown>(
    endpoint: string,
    options: RequestInit = {}
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

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
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
        // Access token expired — refresh it once and retry the request.
        const isAuthCall = endpoint.startsWith('/auth/');
        if (!isAuthCall) {
            const newToken = await handleTokenExpiry();
            if (newToken) {
                return api<T>(endpoint, {
                    ...options,
                    headers: {
                        ...options.headers,
                        Authorization: `Bearer ${newToken}`,
                    },
                });
            }
        }
        // Refresh failed — the session is over.
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.replace('/login');
        }
        throw new ApiError('Session expired', 401);
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const detail = Array.isArray(error.detail)
            ? error.detail.join(' ')
            : error.detail;
        throw new ApiError(
            error.message || detail || error.error || 'Request failed',
            response.status
        );
    }

    // Handle 204 No Content
    if (response.status === 204) return {} as T;

    return response.json();
};
