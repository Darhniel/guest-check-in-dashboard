'use client';

import { useState } from 'react';
import { KeyRound, LogOut, Moon, Sun } from 'lucide-react';
import type { User } from '@/types';
import { logout, isDemoMode } from '@/lib/auth';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChangePasswordDialog } from '@/components/layout/ChangePasswordDialog';
import { toggleTheme } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';

interface UserMenuProps {
    user: User | null;
    compact?: boolean;
    className?: string;
}

export function UserMenu({ user, compact = false, className }: UserMenuProps) {
    const [passwordOpen, setPasswordOpen] = useState(false);
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        aria-label="Open account menu"
                        className={cn(
                            'group flex items-center gap-2.5 rounded-lg text-left transition-colors duration-150 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/40',
                            compact ? 'p-0.5' : 'w-full p-2',
                            className
                        )}
                    />
                }
            >
                <Avatar name={user?.full_name} size={compact ? 'md' : 'md'} />
                {compact ? null : (
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-foreground">
                            {user?.full_name || 'Admin'}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                            {user?.email}
                        </span>
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-60">
                <DropdownMenuLabel className="px-2 py-2">
                    <span className="block text-[13px] font-medium text-foreground">
                        {user?.full_name || 'Admin'}
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {user?.email}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isDemoMode ? (
                    <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-success" />
                        Demo workspace · sample data
                    </DropdownMenuLabel>
                ) : null}
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer py-2">
                    <Sun className="dark:hidden" />
                    <Moon className="hidden dark:block" />
                    Toggle theme
                </DropdownMenuItem>
                {!isDemoMode ? (
                    <DropdownMenuItem
                        onClick={() => setPasswordOpen(true)}
                        className="cursor-pointer py-2"
                    >
                        <KeyRound />
                        Change password
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    onClick={logout}
                    className="cursor-pointer py-2"
                >
                    <LogOut />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
            <ChangePasswordDialog
                open={passwordOpen}
                onOpenChange={setPasswordOpen}
            />
        </DropdownMenu>
    );
}

/** Icon-only account button used in the mobile header. */
export function MobileUserMenu({ user }: { user: User | null }) {
    const [passwordOpen, setPasswordOpen] = useState(false);
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Open account menu"
                        className="rounded-full"
                    />
                }
            >
                <Avatar name={user?.full_name} size="sm" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="px-2 py-2">
                    <span className="block text-[13px] font-medium text-foreground">
                        {user?.full_name || 'Admin'}
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {user?.email}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer py-2">
                    <Sun className="dark:hidden" />
                    <Moon className="hidden dark:block" />
                    Toggle theme
                </DropdownMenuItem>
                {!isDemoMode ? (
                    <DropdownMenuItem
                        onClick={() => setPasswordOpen(true)}
                        className="cursor-pointer py-2"
                    >
                        <KeyRound />
                        Change password
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    onClick={logout}
                    className="cursor-pointer py-2"
                >
                    <LogOut />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
            <ChangePasswordDialog
                open={passwordOpen}
                onOpenChange={setPasswordOpen}
            />
        </DropdownMenu>
    );
}
