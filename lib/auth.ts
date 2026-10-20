import { User } from '@/types';

export const setAuthData = (accessToken: string, user: User) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
};

export const getAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
};

export const getUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
};

export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};

export const isAdmin = (): boolean => {
    const user = getUser();
    return user?.role === 'admin';
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};