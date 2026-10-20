'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth(true);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">{children}</main>
        </div>
    );
}