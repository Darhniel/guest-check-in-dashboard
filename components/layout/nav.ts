import {
    BarChart3,
    CalendarDays,
    LayoutDashboard,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
    href: string;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
    adminOnly?: boolean;
}

export const navItems: NavItem[] = [
    {
        href: '/dashboard',
        label: 'Overview',
        shortLabel: 'Home',
        icon: LayoutDashboard,
    },
    {
        href: '/dashboard/events',
        label: 'Events',
        shortLabel: 'Events',
        icon: CalendarDays,
    },
    {
        href: '/dashboard/ambassadors',
        label: 'Ambassadors',
        shortLabel: 'Team',
        icon: Users,
    },
    {
        href: '/dashboard/reports',
        label: 'Reports',
        shortLabel: 'Reports',
        icon: BarChart3,
    },
    {
        href: '/dashboard/admins',
        label: 'Admins',
        shortLabel: 'Admins',
        icon: ShieldCheck,
        adminOnly: true,
    },
];

export function navItemsForRole(role: UserRole | undefined) {
    return navItems.filter((item) => !item.adminOnly || role === 'admin');
}

export function isNavActive(pathname: string, href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
}
