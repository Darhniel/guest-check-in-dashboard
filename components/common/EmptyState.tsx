import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
    compact?: boolean;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
    compact = false,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 text-center',
                compact ? 'py-10' : 'py-14 sm:py-16',
                className
            )}
        >
            {icon ? (
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border [&_svg]:size-5">
                    {icon}
                </div>
            ) : null}
            <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
            {description ? (
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            ) : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}
