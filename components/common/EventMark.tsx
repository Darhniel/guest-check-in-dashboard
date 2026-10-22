import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/format';

const tones = [
    'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300',
];

const sizes = {
    sm: 'size-8 rounded-lg text-[10px]',
    md: 'size-10 rounded-[10px] text-[11px]',
    lg: 'size-12 rounded-xl text-sm',
};

interface EventMarkProps {
    name: string;
    seed: number;
    size?: keyof typeof sizes;
    className?: string;
}

export function EventMark({ name, seed, size = 'md', className }: EventMarkProps) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex shrink-0 items-center justify-center font-semibold tracking-wide ring-1 ring-black/5 ring-inset dark:ring-white/10',
                tones[Math.abs(seed) % tones.length],
                sizes[size],
                className
            )}
        >
            {getInitials(name, 'EV')}
        </span>
    );
}
