import { User } from '@/types';
import { DEMO_MODE, DEMO_USER } from './demo-data';

export const setAuthData = (accessToken: string, user: User, refreshToken?: string) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
};

export const getAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
};

export const setAccessToken = (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
};

export const getUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem('user');
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
};

export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};

export const isAdmin = (): boolean => {
    const user = getUser();
    return user?.role === 'admin';
};

/**
 * True when the stored access token carries a past `exp`. Malformed tokens are
 * left to the server-side 401 path — the client cannot be sure.
 */
export const isAccessTokenExpired = (): boolean => {
    const token = getAccessToken();
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
        if (!payload.exp) return false;
        return payload.exp * 1000 <= Date.now();
    } catch {
        return false;
    }
};

export const isDemoMode = DEMO_MODE;

/**
 * Signs into the locally generated demo workspace. Only available when the
 * app is started with NEXT_PUBLIC_DEMO_MODE=true.
 */
export const signInDemo = () => {
    setAuthData('demo-token', DEMO_USER);
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.replace('/login');
};
