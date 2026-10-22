'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function applyTheme(theme: 'light' | 'dark' | 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
}

export function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
}

interface ThemeToggleProps {
    className?: string;
    size?: 'icon-sm' | 'icon';
}

export function ThemeToggle({ className, size = 'icon-sm' }: ThemeToggleProps) {
    return (
        <Button
            type="button"
            variant="ghost"
            size={size}
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            title="Toggle theme"
            className={cn('relative text-muted-foreground hover:text-foreground', className)}
        >
            <Sun className="size-4 scale-100 rotate-0 transition-transform duration-300 ease-snappy dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-4 scale-0 rotate-90 transition-transform duration-300 ease-snappy dark:scale-100 dark:rotate-0" />
        </Button>
    );
}
