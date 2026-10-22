import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'info' | 'neutral' | 'warning' | 'danger' | 'brand';

const tones: Record<StatusTone, string> = {
    success: 'bg-success-subtle text-success ring-success/15',
    info: 'bg-info-subtle text-info ring-info/15',
    neutral: 'bg-muted text-muted-foreground ring-border',
    warning: 'bg-warning-subtle text-warning ring-warning/20',
    danger: 'bg-destructive/10 text-destructive ring-destructive/15',
    brand: 'bg-brand-subtle text-brand ring-brand/15',
};

const dots: Record<StatusTone, string> = {
    success: 'bg-success',
    info: 'bg-info',
    neutral: 'bg-muted-foreground/60',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    brand: 'bg-brand',
};

interface StatusBadgeProps {
    label: string;
    tone?: StatusTone;
    pulse?: boolean;
    className?: string;
}

export function StatusBadge({
    label,
    tone = 'neutral',
    pulse = false,
    className,
}: StatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset',
                tones[tone],
                className
            )}
        >
            <span
                className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    dots[tone],
                    pulse && 'animate-soft-pulse'
                )}
            />
            {label}
        </span>
    );
}
