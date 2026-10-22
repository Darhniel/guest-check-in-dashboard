'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({
    title = 'Could not load this view',
    description,
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div
            role="alert"
            className={cn(
                'flex flex-col items-start gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between',
                className
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-4" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {description ?? 'Please check your connection and try again.'}
                    </p>
                </div>
            </div>
            {onRetry ? (
                <Button variant="outline" size="sm" onClick={onRetry}>
                    <RotateCw className="size-3.5" />
                    Try again
                </Button>
            ) : null}
        </div>
    );
}
