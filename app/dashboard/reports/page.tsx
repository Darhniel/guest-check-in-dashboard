'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import {
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    CalendarPlus,
    Download,
    Loader2,
    MapPin,
    Search,
    Users,
    X,
} from 'lucide-react';
import type { ReportSummary, ReportsResponse } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { EventMark } from '@/components/common/EventMark';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { downloadReportsOverview } from '@/lib/report-excel';
import {
    eventStatusMeta,
    formatEventDates,
    formatNumber,
    getEventStatus,
    pluralize,
    type EventStatus,
} from '@/lib/format';
import { cn } from '@/lib/utils';

type Filter = 'all' | EventStatus;

const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'live', label: 'Live' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ended', label: 'Ended' },
];

const statusOrder: Record<EventStatus, number> = {
    live: 0,
    upcoming: 1,
    ended: 2,
    unknown: 3,
};

function ReportStat({
    label,
    value,
    hint,
    icon: Icon,
    tone,
}: {
    label: string;
    value: string;
    hint: string;
    icon: typeof Users;
    tone: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card ring-1 ring-border lg:flex-col lg:items-start lg:p-4">
            <span
                className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    tone
                )}
            >
                <Icon className="size-4" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                    {label}
                </p>
                <p className="mt-0.5 text-[20px] leading-none font-semibold tracking-[-0.02em] tabular-nums lg:text-[24px]">
                    {value}
                </p>
                <p className="mt-1 hidden text-[11px] text-muted-foreground lg:block">
                    {hint}
                </p>
            </div>
        </div>
    );
}

function Sparkline({ data }: { data: number[] }) {
    const max = Math.max(1, ...data);

    return (
        <div
            aria-hidden="true"
            className="flex h-7 items-end gap-0.5"
        >
            {data.slice(-10).map((value, index) => (
                <span
                    key={index}
                    className="w-1.5 rounded-sm bg-brand/40 transition-colors duration-200 group-hover:bg-brand/70"
                    style={{
                        height: `${Math.max(12, (value / max) * 100)}%`,
                    }}
                />
            ))}
        </div>
    );
}

function ReportsSkeleton() {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-[68px] rounded-xl lg:h-[124px]" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-[242px] rounded-xl" />
                ))}
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const { data, loading, error, refetch } = useApiQuery<ReportsResponse>(
        '/admin/reports/'
    );
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [filter, setFilter] = useState<Filter>('all');
    const [exporting, setExporting] = useState(false);

    const reports = useMemo(() => data?.reports ?? [], [data]);

    const counts = useMemo(() => {
        const next: Record<Filter, number> = {
            all: reports.length,
            live: 0,
            upcoming: 0,
            ended: 0,
            unknown: 0,
        };

        for (const report of reports) {
            next[getEventStatus(report.event)] += 1;
        }

        return next;
    }, [reports]);

    const visible = useMemo(() => {
        const query = deferredSearch.trim().toLowerCase();

        return reports
            .filter((report) => {
                if (
                    filter !== 'all' &&
                    getEventStatus(report.event) !== filter
                ) {
                    return false;
                }
                if (!query) return true;

                return (
                    report.event.name.toLowerCase().includes(query) ||
                    report.event.location_text
                        ?.toLowerCase()
                        .includes(query)
                );
            })
            .sort((a, b) => {
                const diff =
                    statusOrder[getEventStatus(a.event)] -
                    statusOrder[getEventStatus(b.event)];
                if (diff !== 0) return diff;

                return getEventStatus(a.event) === 'ended'
                    ? b.event.start_date.localeCompare(a.event.start_date)
                    : a.event.start_date.localeCompare(b.event.start_date);
            });
    }, [reports, filter, deferredSearch]);

    async function handleExport() {
        if (!data) return;

        setExporting(true);
        try {
            await downloadReportsOverview(data);
            toast.add({
                type: 'success',
                title: 'Overview downloaded',
                description: `${pluralize(
                    data.reports.length,
                    'event'
                )} in one workbook, ready for Excel.`,
            });
        } catch (exportError) {
            toast.add({
                type: 'error',
                title: 'Could not build the spreadsheet',
                description:
                    exportError instanceof Error
                        ? exportError.message
                        : 'Please try again in a moment.',
            });
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    eyebrow="Insights"
                    title="Reports"
                    description={
                        data
                            ? `${pluralize(
                                  data.totals.events,
                                  'event'
                              )} · ${formatNumber(
                                  data.totals.accredited_guests
                              )} guests accredited across the workspace`
                            : 'Attendance, guest mix, and team performance for every event.'
                    }
                    actions={
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={!data || exporting}
                        >
                            {exporting ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Download className="size-4" />
                            )}
                            {exporting ? 'Preparing…' : 'Download overview'}
                        </Button>
                    }
                />
            </div>

            {error ? (
                <ErrorState
                    description={error}
                    onRetry={() => {
                        void refetch();
                    }}
                />
            ) : loading || !data ? (
                <ReportsSkeleton />
            ) : reports.length === 0 ? (
                <EmptyState
                    icon={<BarChart3 />}
                    title="No reports yet"
                    description="Create an event and start accrediting guests. Its attendance report will appear here automatically."
                    action={
                        <Button render={<Link href="/dashboard/events/new" />}>
                            <CalendarPlus className="size-4" />
                            Create event
                        </Button>
                    }
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                        <ReportStat
                            label="Guests"
                            value={formatNumber(data.totals.total_guests)}
                            hint="Across every event"
                            icon={Users}
                            tone="bg-brand-subtle text-brand"
                        />
                        <ReportStat
                            label="Accredited"
                            value={formatNumber(data.totals.accredited_guests)}
                            hint="At least one check-in"
                            icon={ArrowUpRight}
                            tone="bg-success-subtle text-success"
                        />
                        <ReportStat
                            label="Attendance"
                            value={`${data.totals.attendance_rate}%`}
                            hint="Accredited ÷ total guests"
                            icon={BarChart3}
                            tone="bg-warning-subtle text-warning"
                        />
                        <ReportStat
                            label="Check-ins"
                            value={formatNumber(data.totals.total_checkins)}
                            hint={`${formatNumber(
                                data.totals.checked_in_today
                            )} today`}
                            icon={CalendarDays}
                            tone="bg-info-subtle text-info"
                        />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <label htmlFor="report-search" className="sr-only">
                                Search reports
                            </label>
                            <Input
                                id="report-search"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search events or locations"
                                className="pl-9 [&::-webkit-search-cancel-button]:hidden"
                            />
                            {search ? (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    aria-label="Clear search"
                                    className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="size-3.5" />
                                </button>
                            ) : null}
                        </div>

                        <div
                            role="group"
                            aria-label="Filter reports by event status"
                            className="flex w-full items-center gap-0.5 rounded-lg bg-muted p-1 sm:w-auto"
                        >
                            {filters.map((item) => {
                                const active = filter === item.value;
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => setFilter(item.value)}
                                        className={cn(
                                            'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:flex-none',
                                            active
                                                ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
                                                : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        {item.label}
                                        <span
                                            className={cn(
                                                'text-[10px] tabular-nums',
                                                active
                                                    ? 'text-muted-foreground'
                                                    : 'text-muted-foreground/60'
                                            )}
                                        >
                                            {counts[item.value]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {visible.length === 0 ? (
                        <EmptyState
                            icon={<Search />}
                            title="No reports match this view"
                            description="Try a different search or clear the status filter."
                            action={
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearch('');
                                        setFilter('all');
                                    }}
                                >
                                    Clear filters
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                            {visible.map((report, index) => (
                                <ReportCard
                                    key={report.event.id}
                                    report={report}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ReportCard({
    report,
    index,
}: {
    report: ReportSummary;
    index: number;
}) {
    const status = eventStatusMeta[getEventStatus(report.event)];

    return (
        <Link
            href={`/dashboard/reports/${report.event.id}`}
            className="group animate-enter flex flex-col gap-4 rounded-xl bg-card p-4 shadow-card ring-1 ring-border transition-[box-shadow,border-color] duration-200 outline-none hover:shadow-float hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-ring/50 sm:p-5"
            style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <EventMark name={report.event.name} seed={report.event.id} />
                    <div className="min-w-0">
                        <h2 className="truncate text-[14px] font-semibold tracking-[-0.01em]">
                            {report.event.name}
                        </h2>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-muted-foreground">
                            <CalendarDays className="size-3 shrink-0" />
                            {formatEventDates(
                                report.event.start_date,
                                report.event.end_date
                            )}
                        </p>
                    </div>
                </div>
                <StatusBadge
                    label={status.label}
                    tone={status.tone}
                    pulse={status.label === 'Live'}
                />
            </div>

            <div>
                <div className="flex items-end justify-between gap-3">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                            {report.attendance_rate}%
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            attendance
                        </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                        {formatNumber(report.accredited_guests)} of{' '}
                        {formatNumber(report.total_guests)}
                    </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out-soft"
                        style={{
                            width: `${Math.min(100, report.attendance_rate)}%`,
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5">
                <div>
                    <p className="text-[10px] text-muted-foreground">
                        Check-ins
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold tabular-nums">
                        {formatNumber(report.total_checkins)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-muted-foreground">Today</p>
                    <p className="mt-0.5 text-[13px] font-semibold tabular-nums">
                        {formatNumber(report.checked_in_today)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-muted-foreground">Team</p>
                    <p className="mt-0.5 text-[13px] font-semibold tabular-nums">
                        {formatNumber(report.ambassadors)}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
                <div className="flex min-w-0 items-center gap-2">
                    {report.total_checkins > 0 ? (
                        <Sparkline
                            data={report.daily
                                .filter((point) => point.checkins > 0)
                                .map((point) => point.checkins)}
                        />
                    ) : (
                        <span className="text-[11px] text-muted-foreground">
                            Waiting for check-ins
                        </span>
                    )}
                    {report.event.location_text && report.total_checkins > 0 ? (
                        <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                            <MapPin className="size-3 shrink-0" />
                            <span className="max-w-28 truncate">
                                {report.event.location_text}
                            </span>
                        </span>
                    ) : null}
                </div>
                <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                    Open report
                    <ArrowUpRight className="size-3.5 transition-transform duration-200 ease-snappy group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
            </div>
        </Link>
    );
}
