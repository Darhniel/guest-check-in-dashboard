'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav, MobileTopBar } from '@/components/layout/MobileNav';
import { UserProvider } from '@/components/layout/UserProvider';
import { Skeleton } from '@/components/common/Skeleton';

function ShellSkeleton() {
    return (
        <div className="min-h-dvh bg-background">
            <div className="fixed inset-y-0 left-0 hidden w-[264px] flex-col gap-6 border-r border-border bg-sidebar p-5 lg:flex">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-[11px]" />
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2.5 w-16" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="lg:pl-[264px]">
                <div className="mx-auto w-full max-w-[1440px] px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="mt-2 h-4 w-64" />
                    <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-[120px] rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="mt-4 h-[340px] rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth(true);

    if (loading) return <ShellSkeleton />;

    return (
        <div className="min-h-dvh bg-background">
            <a
                href="#main-content"
                className="sr-only z-50 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                Skip to content
            </a>
            <Sidebar user={user} />
            <MobileTopBar user={user} />
            <div className="lg:pl-[264px]">
                <main
                    id="main-content"
                    className="mx-auto w-full max-w-[1440px] px-4 pt-5 pb-28 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 lg:pb-12 xl:px-10"
                >
                    <UserProvider user={user}>{children}</UserProvider>
                </main>
            </div>
            <MobileBottomNav />
        </div>
    );
}
