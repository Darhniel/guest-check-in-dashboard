import { BarChart3, CalendarDays, LayoutDashboard, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    href: string;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
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
];

export function isNavActive(pathname: string, href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
}
