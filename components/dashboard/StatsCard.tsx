import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const tones = {
    brand: 'bg-brand-subtle text-brand',
    success: 'bg-success-subtle text-success',
    warning: 'bg-warning-subtle text-warning',
    info: 'bg-info-subtle text-info',
    neutral: 'bg-muted text-muted-foreground',
};

const labelClass =
    'text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase sm:text-[11px]';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    hint?: string;
    tone?: keyof typeof tones;
    sparkline?: number[];
}

function IconChip({
    icon: Icon,
    tone,
    className,
}: {
    icon: LucideIcon;
    tone: keyof typeof tones;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 ease-snappy group-hover:-translate-y-0.5 sm:size-9',
                tones[tone],
                className
            )}
        >
            <Icon className="size-4" strokeWidth={1.9} />
        </span>
    );
}

function Sparkline({ data }: { data: number[] }) {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
        .map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 26 - ((value - min) / range) * 20;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');

    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
            className="h-7 w-20 text-brand/50"
        >
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

export function StatsCard({
    label,
    value,
    icon: Icon,
    hint,
    tone = 'neutral',
    sparkline,
}: StatsCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-border transition-[box-shadow,background-color] duration-200 hover:shadow-[0_2px_8px_-2px_oklch(0.2_0.02_270/0.08)]">
            {/* Mobile: compact list row */}
            <div className="flex items-center gap-3 p-3.5 sm:hidden">
                <IconChip icon={Icon} tone={tone} className="size-9" />
                <div className="min-w-0 flex-1">
                    <p className={labelClass}>{label}</p>
                    {hint ? (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {hint}
                        </p>
                    ) : null}
                </div>
                <p className="pl-1 text-[22px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                    {value}
                </p>
            </div>

            {/* Desktop: stat card */}
            <div className="hidden flex-col justify-between gap-4 p-5 sm:flex">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className={labelClass}>{label}</p>
                        <p className="mt-2.5 text-[30px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                            {value}
                        </p>
                    </div>
                    <IconChip icon={Icon} tone={tone} />
                </div>
                <div className="flex min-h-7 items-end justify-between gap-2">
                    {hint ? (
                        <p className="text-[11px] leading-tight text-muted-foreground">
                            {hint}
                        </p>
                    ) : (
                        <span />
                    )}
                    {sparkline ? <Sparkline data={sparkline} /> : null}
                </div>
            </div>
        </div>
    );
}
