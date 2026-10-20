'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated, isAdmin } from '@/lib/auth';
import { User } from '@/types';

export const useAuth = (requireAdmin = true) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace('/login');
            return;
        }

        const u = getUser();
        if (requireAdmin && u?.role !== 'admin') {
            router.replace('/login');
            return;
        }

        setUser(u);
        setLoading(false);
    }, [router, requireAdmin]);

    return { user, loading };
};