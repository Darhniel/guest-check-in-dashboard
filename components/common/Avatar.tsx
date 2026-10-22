import { cn } from '@/lib/utils';
import { avatarTone, getInitials } from '@/lib/format';

const sizes = {
    xs: 'size-6 text-[9px]',
    sm: 'size-8 text-[10px]',
    md: 'size-9 text-[11px]',
    lg: 'size-11 text-sm',
    xl: 'size-14 text-base',
};

interface AvatarProps {
    name?: string | null;
    seed?: string | number;
    size?: keyof typeof sizes;
    className?: string;
}

export function Avatar({ name, seed, size = 'md', className }: AvatarProps) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ring-1 ring-black/5 ring-inset dark:ring-white/10',
                avatarTone(seed ?? name ?? ''),
                sizes[size],
                className
            )}
        >
            {getInitials(name)}
        </span>
    );
}
