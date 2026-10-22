'use client';

import { FileText, Users } from 'lucide-react';
import Link from 'next/link';
import type { EventReport } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { ReportPanel } from '@/components/reports/Panel';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { GuestTable } from '@/components/reports/GuestTable';
import { Button } from '@/components/ui/button';
import { formatNumber, pluralize } from '@/lib/format';

interface Props {
    eventId: number;
}

/**
 * Guest register for one event, fed by the same backend report the
 * Reports area uses — the richest guest data available (email, ticket,
 * category, check-in counts).
 */
export function EventGuests({ eventId }: Props) {
    const { data, loading, error, refetch } = useApiQuery<EventReport | null>(
        eventId ? `/admin/events/${eventId}/report/` : null
    );

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-56" />
                <Skeleton className="h-[420px] rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <ErrorState description={error} onRetry={() => void refetch()} />
        );
    }

    const report = data;
    const guests = report?.guests ?? [];

    return (
        <div className="space-y-4">
            <ReportPanel>
                <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex items-center gap-2.5">
                        <Users className="size-4 text-muted-foreground" />
                        <h2 className="text-[15px] font-semibold">
                            Guest register
                        </h2>
                        <span className="text-[12px] text-muted-foreground tabular-nums">
                            {report
                                ? `${formatNumber(report.summary.accredited_guests)} of ${pluralize(
                                      report.summary.total_guests,
                                      'guest'
                                  )} accredited`
                                : ''}
                        </span>
                    </div>
                    {report ? (
                        <Button
                            variant="outline"
                            size="sm"
                            render={
                                <Link href={`/dashboard/reports/${eventId}`} />
                            }
                        >
                            <FileText className="size-3.5" />
                            Open full report
                        </Button>
                    ) : null}
                </div>

                <div className="px-0 py-1 sm:px-0">
                    {guests.length === 0 ? (
                        <div className="p-4 sm:p-5">
                            <EmptyState
                                compact
                                icon={<Users />}
                                title="No guests yet"
                                description="Guests appear here as soon as they are registered — via an ambassador, the organizer API key, or a report import."
                            />
                        </div>
                    ) : (
                        <GuestTable guests={guests} />
                    )}
                </div>
            </ReportPanel>
        </div>
    );
}
