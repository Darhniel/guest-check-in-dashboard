'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import type { User } from '@/types';
import { cn } from '@/lib/utils';
import { navItems, isNavActive } from '@/components/layout/nav';
import { MobileUserMenu } from '@/components/layout/UserMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function MobileTopBar({ user }: { user: User | null }) {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl lg:hidden">
            <div className="flex h-14 items-center justify-between px-4">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                    <span className="flex size-8 items-center justify-center rounded-[9px] bg-primary text-primary-foreground">
                        <BadgeCheck className="size-4" strokeWidth={1.9} />
                    </span>
                    <span className="text-[13px] font-semibold tracking-[-0.01em]">
                        Accreditation
                    </span>
                </Link>
                <div className="flex items-center gap-0.5">
                    <ThemeToggle />
                    <MobileUserMenu user={user} />
                </div>
            </div>
        </header>
    );
}

export function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Primary"
            className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pt-1 backdrop-blur-xl lg:hidden"
        >
            <div className="mx-auto grid max-w-md grid-cols-4">
                {navItems.map((item) => {
                    const active = isNavActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40',
                                active
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200',
                                    active ? 'bg-secondary' : 'bg-transparent'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'size-[18px] transition-colors duration-150',
                                        active ? 'text-brand' : 'text-muted-foreground'
                                    )}
                                    strokeWidth={1.9}
                                />
                            </span>
                            {item.shortLabel}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
