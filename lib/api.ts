import { getAccessToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export const api = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const token = getAccessToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        cache: 'no-store',
    });

    if (response.status === 401) {
        // Token expired — redirect to login
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        throw new ApiError('Session expired', 401);
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
            error.message || error.detail || error.error || 'Request failed',
            response.status
        );
    }

    // Handle 204 No Content
    if (response.status === 204) return {} as T;

    return response.json();
};