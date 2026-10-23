'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getRefreshToken,
    getUser,
    isAuthenticated,
    isAccessTokenExpired,
    logout,
} from '@/lib/auth';
import { User } from '@/types';

type AuthState = { user: User | null; loading: boolean };

export const useAuth = (requireAdmin = true) => {
    const router = useRouter();
    const [state, setState] = useState<AuthState>({ user: null, loading: true });

    useEffect(() => {
        // Bail out immediately when the session cannot possibly recover, so a
        // dead profile lands on /login without waiting for a network 401.
        if (!isAuthenticated() || (isAccessTokenExpired() && !getRefreshToken())) {
            logout();
            return;
        }

        const user = getUser();
        if (requireAdmin && user?.role !== 'admin') {
            router.replace('/login');
            return;
        }

        // The session lives in localStorage, which is only readable after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({ user, loading: false });
    }, [router, requireAdmin]);

    return state;
};
