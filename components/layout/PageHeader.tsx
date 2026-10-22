import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: ReactNode;
    eyebrow?: ReactNode;
    actions?: ReactNode;
    backHref?: string;
    backLabel?: string;
}

export function PageHeader({
    title,
    description,
    eyebrow,
    actions,
    backHref,
    backLabel = 'Back',
}: PageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="min-w-0">
                {backHref ? (
                    <Link
                        href={backHref}
                        className="-ml-1.5 mb-3 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                        <ArrowLeft className="size-3.5" />
                        {backLabel}
                    </Link>
                ) : null}
                {eyebrow ? (
                    <div className="mb-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        {eyebrow}
                    </div>
                ) : null}
                <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-[30px]">
                    {title}
                </h1>
                {description ? (
                    <div className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </div>
                ) : null}
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    {actions}
                </div>
            ) : null}
        </header>
    );
}
