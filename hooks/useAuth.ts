'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/lib/auth';
import { User } from '@/types';

type AuthState = { user: User | null; loading: boolean };

export const useAuth = (requireAdmin = true) => {
    const router = useRouter();
    const [state, setState] = useState<AuthState>({ user: null, loading: true });

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace('/login');
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
