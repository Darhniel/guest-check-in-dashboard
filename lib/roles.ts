import type { User, UserRole } from '@/types';

/** Full admins can create and change everything in the console. */
export function isFullAdmin(user: User | null | undefined): boolean {
    return user?.role === 'admin';
}

/** Supervisors can read the console but cannot change anything. */
export function isSupervisor(user: User | null | undefined): boolean {
    return user?.role === 'supervisor';
}

/** Admins and supervisors both see the admin console. */
export function canViewConsole(user: User | null | undefined): boolean {
    return user?.role === 'admin' || user?.role === 'supervisor';
}

export function roleLabel(role: UserRole): string {
    if (role === 'admin') return 'Full admin';
    if (role === 'supervisor') return 'View-only supervisor';
    return 'Brand ambassador';
}
