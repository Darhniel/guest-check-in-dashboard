'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { format } from 'date-fns';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    Clock3,
    Plus,
    Ticket,
    UserCheck,
    Users,
} from 'lucide-react';
import type { DashboardStats, Event, User } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { useNow } from '@/hooks/useNow';
import { useUser } from '@/components/layout/UserProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CheckinsChart } from '@/components/dashboard/CheckinsChart';
import { EventMark } from '@/components/common/EventMark';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ProgressRing } from '@/components/common/ProgressRing';
import { Button } from '@/components/ui/button';
import {
    eventStatusMeta,
    formatEventDates,
    formatHourLabel,
    formatNumber,
    getEventStatus,
    greeting,
    percent,
    pluralize,
} from '@/lib/format';

function Panel({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`rounded-xl bg-card shadow-card ring-1 ring-border ${className ?? ''}`}
        >
            {children}
        </section>
    );
}

function OverviewSkeleton() {
    return (
        <div className="space-y-5">
            <div className="space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-64 max-w-full" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className="h-[70px] rounded-xl sm:h-[132px]"
                    />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-[360px] rounded-xl lg:col-span-2" />
                <Skeleton className="h-[360px] rounded-xl" />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
                <Skeleton className="h-[300px] rounded-xl" />
            </div>
        </div>
    );
}

export default function DashboardHome() {
    const user = useUser();
    const now = useNow();
    const statsQuery = useApiQuery<DashboardStats>('/admin/dashboard/stats/');
    const eventsQuery = useApiQuery<Event[]>('/events/');
    const ambassadorsQuery = useApiQuery<User[]>('/admin/ambassadors/list/');

    const stats = statsQuery.data;
    const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
    const ambassadors = useMemo(
        () => ambassadorsQuery.data ?? [],
        [ambassadorsQuery.data]
    );

    const firstName = user?.full_name?.split(' ')[1];

    const chartData = useMemo(
        () =>
            (stats?.hourly_checkins ?? []).map((point) => ({
                time: formatHourLabel(point.hour),
                count: point.count,
            })),
        [stats]
    );

    const peak = useMemo(() => {
        return (stats?.hourly_checkins ?? []).reduce(
            (best, point) => (point.count > best.count ? point : best),
            { hour: '', count: 0 }
        );
    }, [stats]);

    const liveEvents = useMemo(
        () => events.filter((event) => getEventStatus(event) === 'live'),
        [events]
    );

    const upcomingEvents = useMemo(
        () =>
            events
                .filter((event) => getEventStatus(event) === 'upcoming')
                .sort((a, b) => a.start_date.localeCompare(b.start_date)),
        [events]
    );

    const featuredEvents = useMemo(
        () => [...liveEvents, ...upcomingEvents].slice(0, 3),
        [liveEvents, upcomingEvents]
    );

    const activeAmbassadors = ambassadors.filter((ambassador) => ambassador.is_active);
    const attendance = percent(stats?.today_checkins ?? 0, stats?.total_guests ?? 0);

    const loading =
        (statsQuery.loading && !statsQuery.data) ||
        (eventsQuery.loading && !eventsQuery.data);

    if (loading) return <OverviewSkeleton />;

    const hasError = statsQuery.error || eventsQuery.error;

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    eyebrow={
                        now ? format(now, 'EEEE, MMMM d') : 'Live overview'
                    }
                    title={
                        firstName
                            ? `${greeting()}, ${firstName}`
                            : 'Accreditation overview'
                    }
                    description="Here's how guest accreditation is moving across your events today."
                    actions={
                        <>
                            <Button
                                variant="outline"
                                render={<Link href="/dashboard/events" />}
                                className="max-sm:hidden"
                            >
                                View events
                            </Button>
                            <Button render={<Link href="/dashboard/events/new" />}>
                                <Plus className="size-4" />
                                Create event
                            </Button>
                        </>
                    }
                />
            </div>

            {hasError ? (
                <ErrorState
                    title="Some numbers are out of date"
                    description={
                        statsQuery.error ??
                        eventsQuery.error ??
                        'We could not refresh this section.'
                    }
                    onRetry={() => {
                        void statsQuery.refetch();
                        void eventsQuery.refetch();
                        void ambassadorsQuery.refetch();
                    }}
                />
            ) : null}

            <div
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
                style={{ animationDelay: '40ms' }}
            >
                <StatsCard
                    label="Active events"
                    value={formatNumber(liveEvents.length || stats?.active_events || 0)}
                    icon={CalendarDays}
                    tone="brand"
                    hint={
                        liveEvents.length > 0
                            ? `${liveEvents.length} live right now`
                            : 'No events live right now'
                    }
                />
                <StatsCard
                    label="Total guests"
                    value={formatNumber(stats?.total_guests ?? 0)}
                    icon={Ticket}
                    tone="neutral"
                    hint="Across every event"
                />
                <StatsCard
                    label="Check-ins today"
                    value={formatNumber(stats?.today_checkins ?? 0)}
                    icon={UserCheck}
                    tone="success"
                    hint={`${attendance}% of the guest list`}
                    sparkline={chartData.map((point) => point.count)}
                />
                <StatsCard
                    label="Ambassadors"
                    value={formatNumber(stats?.total_ambassadors ?? ambassadors.length)}
                    icon={Users}
                    tone="warning"
                    hint={`${activeAmbassadors.length} active · ready to scan`}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Panel className="overflow-hidden lg:col-span-2">
                    <div className="flex items-start justify-between gap-4 p-4 pb-2 sm:p-5 sm:pb-2">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-[15px] font-semibold">
                                    Check-ins today
                                </h2>
                                <StatusBadge label="Live" tone="success" pulse />
                            </div>
                            <p className="mt-1 text-[12px] text-muted-foreground">
                                Hourly arrivals across all active events
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                                Today
                            </p>
                            <p className="mt-1 text-xl font-semibold tracking-[-0.02em] tabular-nums sm:text-2xl">
                                {formatNumber(stats?.today_checkins ?? 0)}
                            </p>
                        </div>
                    </div>
                    <div className="px-2 pt-2 pb-3 sm:px-3 sm:pb-4">
                        {chartData.length > 0 ? (
                            <CheckinsChart data={chartData} />
                        ) : (
                            <div className="flex h-[240px] items-center justify-center sm:h-[280px]">
                                <EmptyState
                                    compact
                                    icon={<Clock3 />}
                                    title="No check-ins yet"
                                    description="Arrivals will appear here as ambassadors scan guests in."
                                    className="border-0 bg-transparent py-0"
                                />
                            </div>
                        )}
                    </div>
                    {peak.hour ? (
                        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[12px] sm:px-5">
                            <span className="text-muted-foreground">Busiest window</span>
                            <span className="font-medium tabular-nums">
                                {formatHourLabel(peak.hour)} · {formatNumber(peak.count)} check-ins
                            </span>
                        </div>
                    ) : null}
                </Panel>

                <Panel className="flex flex-col">
                    <div className="flex items-center justify-between gap-3 p-4 pb-0 sm:p-5 sm:pb-0">
                        <div>
                            <h2 className="text-[15px] font-semibold">Today at a glance</h2>
                            <p className="mt-1 text-[12px] text-muted-foreground">
                                Live across your workspace
                            </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">Now</span>
                    </div>

                    <div className="flex flex-1 flex-col items-center gap-5 p-4 sm:p-5">
                        <ProgressRing value={attendance} size={132}>
                            <span className="text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                                {attendance}%
                            </span>
                            <span className="mt-1.5 text-[10px] text-muted-foreground">
                                of guest list
                            </span>
                        </ProgressRing>

                        <dl className="w-full space-y-3">
                            <div className="flex items-baseline justify-between gap-3">
                                <dt className="text-[12px] text-muted-foreground">
                                    Checked in
                                </dt>
                                <dd className="text-[13px] font-medium tabular-nums">
                                    {formatNumber(stats?.today_checkins ?? 0)}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                                <dt className="text-[12px] text-muted-foreground">
                                    Events live
                                </dt>
                                <dd className="text-[13px] font-medium tabular-nums">
                                    {liveEvents.length}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                                <dt className="text-[12px] text-muted-foreground">
                                    Team active
                                </dt>
                                <dd className="text-[13px] font-medium tabular-nums">
                                    {activeAmbassadors.length}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="border-t border-border px-4 py-3 sm:px-5">
                        <Link
                            href="/dashboard/ambassadors"
                            className="group flex items-center justify-between text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Manage the team
                            <ArrowRight className="size-3.5 transition-transform duration-200 ease-snappy group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Panel className="lg:col-span-2">
                    <div className="flex items-center justify-between gap-3 p-4 pb-2 sm:p-5 sm:pb-2">
                        <div>
                            <h2 className="text-[15px] font-semibold">Events in motion</h2>
                            <p className="mt-1 text-[12px] text-muted-foreground">
                                {pluralize(liveEvents.length, 'event')} live ·{' '}
                                {pluralize(upcomingEvents.length, 'upcoming event')}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/events"
                            className="group inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            All events
                            <ArrowUpRight className="size-3.5 transition-transform duration-200 ease-snappy group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </Link>
                    </div>

                    {featuredEvents.length === 0 ? (
                        <div className="p-4 sm:p-5">
                            <EmptyState
                                compact
                                icon={<CalendarDays />}
                                title="Nothing on the calendar"
                                description="Create an event to start accrediting guests."
                                action={
                                    <Button
                                        size="sm"
                                        render={<Link href="/dashboard/events/new" />}
                                    >
                                        <Plus className="size-3.5" />
                                        Create event
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {featuredEvents.map((event) => {
                                const status = eventStatusMeta[getEventStatus(event)];
                                return (
                                    <li key={event.id}>
                                        <Link
                                            href={`/dashboard/events/${event.id}`}
                                            className="group flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-muted/40 sm:px-5"
                                        >
                                            <EventMark name={event.name} seed={event.id} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[13px] font-medium">
                                                    {event.name}
                                                </p>
                                                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                                    {formatEventDates(
                                                        event.start_date,
                                                        event.end_date
                                                    )}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                label={status.label}
                                                tone={status.tone}
                                                pulse={status.label === 'Live'}
                                                className="max-sm:hidden"
                                            />
                                            <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-all duration-200 ease-snappy group-hover:translate-x-0.5 group-hover:text-foreground" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Panel>

                <Panel>
                    <div className="flex items-center justify-between gap-3 p-4 pb-3 sm:p-5 sm:pb-3">
                        <div>
                            <h2 className="text-[15px] font-semibold">Accreditation team</h2>
                            <p className="mt-1 text-[12px] text-muted-foreground">
                                {activeAmbassadors.length} of {ambassadors.length} active
                            </p>
                        </div>
                        <Link
                            href="/dashboard/ambassadors"
                            aria-label="View all ambassadors"
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </div>

                    {activeAmbassadors.length === 0 ? (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                            <EmptyState
                                compact
                                icon={<Users />}
                                title="No active ambassadors"
                                description="Invite someone to start scanning guests."
                                className="py-8"
                            />
                        </div>
                    ) : (
                        <ul className="space-y-1 px-2 pb-3 sm:px-3 sm:pb-4">
                            {activeAmbassadors.slice(0, 4).map((ambassador) => (
                                <li
                                    key={ambassador.id}
                                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                                >
                                    <Avatar name={ambassador.full_name} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12.5px] font-medium">
                                            {ambassador.full_name}
                                        </p>
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {ambassador.email}
                                        </p>
                                    </div>
                                    <span className="size-1.5 shrink-0 rounded-full bg-success" />
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </div>
    );
}
