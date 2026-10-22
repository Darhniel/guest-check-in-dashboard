'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgeCheck, Plus } from 'lucide-react';
import type { User } from '@/types';
import { isDemoMode } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { navItems, isNavActive } from '@/components/layout/nav';
import { UserMenu } from '@/components/layout/UserMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function Sidebar({ user }: { user: User | null }) {
    const pathname = usePathname();

    return (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
            <div className="flex h-16 items-center gap-3 px-5">
                <div className="flex size-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground shadow-sm">
                    <BadgeCheck className="size-[19px]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-[13px] leading-none font-semibold tracking-[-0.01em] text-sidebar-foreground">
                        Accreditation
                    </p>
                    <p className="mt-1.5 text-[11px] leading-none text-muted-foreground">
                        Admin console
                    </p>
                </div>
            </div>

            <div className="px-3 pt-5">
                <p className="px-3 pb-2 text-[10px] font-medium tracking-[0.16em] text-muted-foreground/70 uppercase">
                    Workspace
                </p>
                <nav aria-label="Primary" className="space-y-0.5">
                    {navItems.map((item) => {
                        const active = isNavActive(pathname, item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'group relative flex h-10 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40',
                                    active
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
                                )}
                            >
                                {active ? (
                                    <span className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
                                ) : null}
                                <Icon
                                    className={cn(
                                        'size-4 shrink-0 transition-colors duration-150',
                                        active
                                            ? 'text-brand'
                                            : 'text-muted-foreground/80 group-hover:text-foreground'
                                    )}
                                    strokeWidth={1.9}
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-6 px-3">
                <Link
                    href="/dashboard/events/new"
                    className="group flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 p-3 outline-none transition-colors duration-150 hover:border-foreground/20 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-150 group-hover:bg-brand-subtle group-hover:text-brand">
                        <Plus className="size-4" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-[12px] font-medium text-foreground">
                            New event
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                            Set up accreditation
                        </span>
                    </span>
                </Link>
            </div>

            <div className="mt-auto p-3">
                {isDemoMode ? (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-brand-subtle px-3 py-2 text-[11px] font-medium text-brand">
                        <span className="size-1.5 rounded-full bg-brand" />
                        Demo workspace
                    </div>
                ) : null}
                <div className="rounded-xl border border-sidebar-border bg-card p-1 shadow-xs">
                    <UserMenu user={user} />
                </div>
                <div className="mt-1 flex items-center justify-between px-1">
                    <span className="px-2 text-[10px] tracking-wide text-muted-foreground/60">
                        Guest accreditation
                    </span>
                    <ThemeToggle />
                </div>
            </div>
        </aside>
    );
}
