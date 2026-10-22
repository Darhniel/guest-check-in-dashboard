import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ReportPanel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-xl bg-card shadow-card ring-1 ring-border',
                className
            )}
        >
            {children}
        </section>
    );
}

export function PanelTitle({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
            <div className="flex min-w-0 items-start gap-2.5">
                <Icon
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    strokeWidth={1.9}
                />
                <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold">{title}</h2>
                    {description ? (
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}
