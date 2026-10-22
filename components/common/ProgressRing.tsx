import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    children?: ReactNode;
    className?: string;
    tone?: string;
}

export function ProgressRing({
    value,
    size = 132,
    strokeWidth = 8,
    children,
    className,
    tone = 'var(--brand)',
}: ProgressRingProps) {
    const clamped = Math.max(0, Math.min(100, value));
    const radius = (100 - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <div
            className={cn('relative shrink-0', className)}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 100 100"
                className="-rotate-90"
                role="img"
                aria-label={`${clamped}% complete`}
            >
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={tone}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - clamped / 100)}
                    className="animate-ring"
                    style={
                        {
                            '--ring-circumference': `${circumference}`,
                        } as CSSProperties
                    }
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {children}
            </div>
        </div>
    );
}
