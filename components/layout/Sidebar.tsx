'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import {
    LayoutDashboard,
    Calendar,
    Users,
    LogOut,
    Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/events', label: 'Events', icon: Calendar },
    { href: '/dashboard/ambassadors', label: 'Ambassadors', icon: Users },
];

export function Sidebar() {
    const pathname = usePathname();
    const user = getUser();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-neutral-200 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="font-semibold text-neutral-900">Accreditation</div>
                        <div className="text-xs text-neutral-500">Admin Panel</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-neutral-900 text-white'
                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-neutral-200">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-neutral-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-neutral-700">
                            {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900 truncate">
                            {user?.full_name || 'Admin'}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">{user?.email}</div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}