'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    BarChart3,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    TrendingUp,
    Users,
} from 'lucide-react';
import type { EventReport } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/common/Avatar';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { CheckinsChart } from '@/components/dashboard/CheckinsChart';
import { AttendanceDonut } from '@/components/reports/AttendanceDonut';
import { CategoryBreakdown } from '@/components/reports/CategoryBreakdown';
import { DailyAttendanceChart } from '@/components/reports/DailyAttendanceChart';
import { DownloadReportButton } from '@/components/reports/DownloadReportButton';
import { GuestTable } from '@/components/reports/GuestTable';
import { PanelTitle, ReportPanel } from '@/components/reports/Panel';
import {
    eventStatusMeta,
    formatDate,
    formatEventDates,
    formatHourLabel,
    formatNumber,
    formatTime,
    getEventStatus,
} from '@/lib/format';
import { cn } from '@/lib/utils';

function Kpi({
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

function EmptyPanel({ children }: { children: string }) {
    return (
        <p className="py-8 text-center text-[12.5px] text-muted-foreground">
            {children}
        </p>
    );
}

export default function EventReportPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { data: report, loading, error, refetch } = useApiQuery<EventReport>(
        id ? `/admin/events/${id}/report/` : null
    );

    if (loading) {
        return (
            <div className="space-y-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-80 max-w-full" />
                <Skeleton className="h-4 w-96 max-w-full" />
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-[68px] rounded-xl lg:h-[124px]" />
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Skeleton className="h-[340px] rounded-xl" />
                    <Skeleton className="h-[340px] rounded-xl lg:col-span-2" />
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Skeleton className="h-[300px] rounded-xl" />
                    <Skeleton className="h-[300px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-5">
                <PageHeader
                    backHref="/dashboard/reports"
                    backLabel="All reports"
                    title="Event report"
                    description="We couldn't load this report."
                />
                <ErrorState description={error} onRetry={() => void refetch()} />
            </div>
        );
    }

    if (!report) return null;

    const { event, summary } = report;
    const status = eventStatusMeta[getEventStatus(event)];
    const repeatCheckins = Math.max(
        0,
        summary.total_checkins - summary.accredited_guests
    );

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    backHref="/dashboard/reports"
                    backLabel="All reports"
                    eyebrow="Event report"
                    title={event.name}
                    description={
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <StatusBadge
                                label={status.label}
                                tone={status.tone}
                                pulse={status.label === 'Live'}
                            />
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-3.5 text-muted-foreground" />
                                {formatEventDates(event.start_date, event.end_date)}
                            </span>
                            {event.location_text ? (
                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                    <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate">
                                        {event.location_text}
                                    </span>
                                </span>
                            ) : null}
                        </div>
                    }
                    actions={
                        <>
                            <Button
                                variant="outline"
                                render={
                                    <Link
                                        href={`/dashboard/events/${event.id}`}
                                    />
                                }
                                className="max-sm:hidden"
                            >
                                View event
                            </Button>
                            <DownloadReportButton report={report} />
                        </>
                    }
                />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                <Kpi
                    label="Total guests"
                    value={formatNumber(summary.total_guests)}
                    hint="On the guest list"
                    icon={Users}
                    tone="bg-brand-subtle text-brand"
                />
                <Kpi
                    label="Accredited"
                    value={formatNumber(summary.accredited_guests)}
                    hint={`${formatNumber(summary.no_shows)} not yet`}
                    icon={CheckCircle2}
                    tone="bg-success-subtle text-success"
                />
                <Kpi
                    label="Attendance"
                    value={`${summary.attendance_rate}%`}
                    hint="Accredited ÷ total guests"
                    icon={BarChart3}
                    tone="bg-warning-subtle text-warning"
                />
                <Kpi
                    label="Check-ins today"
                    value={formatNumber(summary.checked_in_today)}
                    hint={`${formatNumber(
                        summary.total_checkins
                    )} in total`}
                    icon={TrendingUp}
                    tone="bg-info-subtle text-info"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ReportPanel className="animate-enter">
                    <PanelTitle
                        icon={CheckCircle2}
                        title="Attendance"
                        description="Guests who have been accredited"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <AttendanceDonut
                            accredited={summary.accredited_guests}
                            total={summary.total_guests}
                        />
                        <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="text-[11px] text-muted-foreground">
                                Average per day
                            </span>
                            <span className="text-[12px] font-semibold tabular-nums">
                                {formatNumber(summary.avg_checkins_per_day)}
                            </span>
                        </div>
                    </div>
                </ReportPanel>

                <ReportPanel className="animate-enter lg:col-span-2">
                    <PanelTitle
                        icon={CalendarDays}
                        title="Daily attendance"
                        description="Check-ins and unique guests per event day"
                        action={
                            <div className="hidden items-center gap-3 text-[10px] text-muted-foreground sm:flex">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-brand" />
                                    Check-ins
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-chart-2/60" />
                                    Unique
                                </span>
                            </div>
                        }
                    />
                    <div className="px-2 pb-4 sm:px-4 sm:pb-5">
                        {summary.total_checkins === 0 ? (
                            <EmptyPanel>
                                No check-ins have been recorded yet.
                            </EmptyPanel>
                        ) : (
                            <DailyAttendanceChart data={report.daily} />
                        )}
                    </div>
                </ReportPanel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ReportPanel>
                    <PanelTitle
                        icon={Clock3}
                        title="Arrivals by hour"
                        description="When guests collect their accreditation"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {summary.total_checkins === 0 ? (
                            <EmptyPanel>
                                No check-ins have been recorded yet.
                            </EmptyPanel>
                        ) : (
                            <CheckinsChart
                                data={report.hourly.map((point) => ({
                                    time: formatHourLabel(point.hour),
                                    count: point.count,
                                }))}
                            />
                        )}
                    </div>
                </ReportPanel>

                <ReportPanel>
                    <PanelTitle
                        icon={BarChart3}
                        title="Guest mix"
                        description="Attendance by guest category"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <CategoryBreakdown data={report.by_category} />
                    </div>
                </ReportPanel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ReportPanel>
                    <PanelTitle
                        icon={MapPin}
                        title="Accreditation points"
                        description="Where badges were collected"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {report.by_location.length === 0 ? (
                            <EmptyPanel>No location data yet.</EmptyPanel>
                        ) : (
                            <ul className="space-y-4">
                                {report.by_location.map((location) => (
                                    <li key={location.name}>
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="min-w-0 truncate text-[12.5px]">
                                                {location.name}
                                            </span>
                                            <span className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums">
                                                {formatNumber(location.count)} ·{' '}
                                                {location.share}%
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out-soft"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        location.share
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </ReportPanel>

                <ReportPanel>
                    <PanelTitle
                        icon={Users}
                        title="Team performance"
                        description="Check-ins verified by each ambassador"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {report.by_ambassador.length === 0 ? (
                            <EmptyPanel>
                                Once the team starts scanning, performance will
                                appear here.
                            </EmptyPanel>
                        ) : (
                            <ul className="divide-y divide-border">
                                {report.by_ambassador.map(
                                    (ambassador, index) => (
                                        <li
                                            key={
                                                ambassador.email ||
                                                ambassador.name
                                            }
                                            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <span
                                                className={cn(
                                                    'flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold tabular-nums',
                                                    index === 0
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground'
                                                )}
                                            >
                                                {index + 1}
                                            </span>
                                            <Avatar
                                                name={ambassador.name}
                                                seed={ambassador.email}
                                                size="sm"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[12.5px] font-medium">
                                                    {ambassador.name}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {ambassador.email ||
                                                        'No email'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[12px] font-semibold tabular-nums">
                                                {formatNumber(ambassador.count)}
                                            </span>
                                        </li>
                                    )
                                )}
                            </ul>
                        )}
                    </div>
                </ReportPanel>
            </div>

            <ReportPanel>
                <PanelTitle
                    icon={Clock3}
                    title="Recent check-ins"
                    description="The latest guests through accreditation"
                />
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    {report.recent_checkins.length === 0 ? (
                        <EmptyPanel>No check-ins yet.</EmptyPanel>
                    ) : (
                        <ul className="divide-y divide-border">
                            {report.recent_checkins.map((item, index) => (
                                <li
                                    key={`${item.guest_name}-${item.date}-${index}`}
                                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                                >
                                    <Avatar
                                        name={item.guest_name}
                                        seed={`${item.guest_name}-${index}`}
                                        size="sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12.5px] font-medium">
                                            {item.guest_name}
                                        </p>
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {item.category ?? 'Uncategorized'}
                                            {' · '}
                                            {item.location ?? 'No location'}
                                            {' · '}
                                            {item.ambassador ?? 'Unassigned'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                                        {formatDate(item.date, 'MMM d')}
                                        {item.time
                                            ? ` · ${formatTime(item.time)}`
                                            : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </ReportPanel>

            <ReportPanel>
                <PanelTitle
                    icon={Users}
                    title="Guest list"
                    description={`${formatNumber(
                        report.guests.length
                    )} guests · ${formatNumber(
                        summary.accredited_guests
                    )} accredited${repeatCheckins > 0 ? ` · ${formatNumber(
                        repeatCheckins
                    )} repeat check-ins` : ''}`}
                />
                <GuestTable guests={report.guests} />
            </ReportPanel>

            <p className="pb-2 text-center text-[11px] text-muted-foreground">
                Report generated{' '}
                {formatDate(report.generated_at, 'MMM d, yyyy · h:mm a')} ·{' '}
                {formatNumber(report.guests.length)} guests in the workbook
            </p>
        </div>
    );
}
