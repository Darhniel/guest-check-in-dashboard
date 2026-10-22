'use client';

import type { ReactNode } from 'react';
import {
    BarChart3,
    MapPin,
    PieChart as PieChartIcon,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
} from 'recharts';
import type { AccreditationLogEntry, Event, EventAnalytics as AnalyticsData } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { formatNumber, formatTime, percent } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
    eventId: number;
    event: Event;
}

const FALLBACK_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

function Panel({
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

function PanelTitle({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof Users;
    title: string;
    description?: string;
}) {
    return (
        <div className="flex items-start gap-2.5 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
            <Icon
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.9}
            />
            <div>
                <h2 className="text-[14px] font-semibold">{title}</h2>
                {description ? (
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function Kpi({
    label,
    value,
    icon: Icon,
    tone,
    hint,
    className,
}: {
    label: string;
    value: string;
    icon: typeof Users;
    tone: string;
    hint?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col justify-between gap-3 rounded-xl bg-card p-4 shadow-card ring-1 ring-border',
                className
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                    {label}
                </p>
                <span
                    className={cn(
                        'flex size-8 items-center justify-center rounded-lg',
                        tone
                    )}
                >
                    <Icon className="size-4" strokeWidth={1.9} />
                </span>
            </div>
            <div>
                <p className="text-[24px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                    {value}
                </p>
                {hint ? (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
                ) : null}
            </div>
        </div>
    );
}

export function EventAnalytics({ eventId, event }: Props) {
    const { data, loading, error, refetch } = useApiQuery<AnalyticsData>(
        `/admin/events/${eventId}/analytics/`
    );

    if (loading && !data) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton
                            key={index}
                            className={cn(
                                'h-[116px] rounded-xl',
                                index === 2 && 'col-span-2 lg:col-span-1'
                            )}
                        />
                    ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <Skeleton className="h-[360px] rounded-xl" />
                    <Skeleton className="h-[360px] rounded-xl" />
                </div>
                <Skeleton className="h-[300px] rounded-xl" />
            </div>
        );
    }

    if (error) {
        return <ErrorState description={error} onRetry={() => void refetch()} />;
    }

    if (!data) return null;

    const rate = percent(data.checked_in_today, data.total_guests);

    const categoryData = data.by_category.map((category, index) => {
        const match = event.categories.find(
            (item) => item.name === category.guest__category__name
        );
        return {
            name: category.guest__category__name || 'Uncategorized',
            value: category.count,
            color: match?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        };
    });

    const categoryTotal = categoryData.reduce((sum, item) => sum + item.value, 0);
    const maxLocation = Math.max(
        1,
        ...data.by_location.map((location) => location.count)
    );
    const maxAmbassador = Math.max(
        1,
        ...data.by_ambassador.map((ambassador) => ambassador.count)
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <Kpi
                    label="Total guests"
                    value={formatNumber(data.total_guests)}
                    icon={Users}
                    tone="bg-brand-subtle text-brand"
                    hint="On the guest list"
                />
                <Kpi
                    label="Checked in today"
                    value={formatNumber(data.checked_in_today)}
                    icon={TrendingUp}
                    tone="bg-success-subtle text-success"
                    hint="Accredited so far"
                />
                <Kpi
                    label="Check-in rate"
                    value={`${rate}%`}
                    icon={BarChart3}
                    tone="bg-warning-subtle text-warning"
                    hint={`${formatNumber(
                        Math.max(0, data.total_guests - data.checked_in_today)
                    )} guests remaining`}
                    className="col-span-2 lg:col-span-1"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel>
                    <PanelTitle
                        icon={PieChartIcon}
                        title="Guest mix"
                        description="Distribution across categories"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {categoryData.length === 0 || categoryTotal === 0 ? (
                            <div className="py-6">
                                <EmptyState
                                    compact
                                    icon={<PieChartIcon />}
                                    title="No guest data yet"
                                    description="Categories will appear once guests are registered."
                                    className="border-0 bg-transparent py-4"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={62}
                                                outerRadius={88}
                                                paddingAngle={2}
                                                cornerRadius={4}
                                                stroke="none"
                                                animationDuration={600}
                                            >
                                                {categoryData.map((entry) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[24px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                                            {formatNumber(categoryTotal)}
                                        </span>
                                        <span className="mt-1.5 text-[10px] text-muted-foreground">
                                            guests
                                        </span>
                                    </div>
                                </div>

                                <ul className="w-full space-y-1">
                                    {categoryData.map((entry) => (
                                        <li
                                            key={entry.name}
                                            className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5"
                                        >
                                            <span
                                                className="size-2.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: entry.color }}
                                            />
                                            <span className="min-w-0 flex-1 truncate text-[12.5px]">
                                                {entry.name}
                                            </span>
                                            <span className="text-[12px] text-muted-foreground tabular-nums">
                                                {percent(entry.value, categoryTotal)}%
                                            </span>
                                            <span className="w-12 text-right text-[12px] font-medium tabular-nums">
                                                {formatNumber(entry.value)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </Panel>

                <Panel>
                    <PanelTitle
                        icon={MapPin}
                        title="By location"
                        description="Where guests were accredited"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {data.by_location.length === 0 ? (
                            <div className="py-6">
                                <EmptyState
                                    compact
                                    icon={<MapPin />}
                                    title="No location data"
                                    description="Check-ins by accreditation point will show up here."
                                    className="border-0 bg-transparent py-4"
                                />
                            </div>
                        ) : (
                            <ul className="space-y-4 pt-1">
                                {data.by_location.map((location) => (
                                    <li key={location.location__name ?? 'none'}>
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="truncate text-[12.5px]">
                                                {location.location__name || 'No location'}
                                            </span>
                                            <span className="text-[12px] font-medium tabular-nums">
                                                {formatNumber(location.count)}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out-soft"
                                                style={{
                                                    width: `${Math.round(
                                                        (location.count / maxLocation) * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Panel>
            </div>

            <Panel>
                <PanelTitle
                    icon={Users}
                    title="Ambassador performance"
                    description="Check-ins verified today"
                />
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    {data.by_ambassador.length === 0 ? (
                        <div className="py-6">
                            <EmptyState
                                compact
                                icon={<Users />}
                                title="No check-ins yet"
                                description="Once the team starts scanning, performance will appear here."
                                className="border-0 bg-transparent py-4"
                            />
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {data.by_ambassador.map((ambassador, index) => (
                                <li
                                    key={ambassador.verified_by__email}
                                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
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
                                        name={ambassador.verified_by__full_name}
                                        seed={ambassador.verified_by__email}
                                        size="sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <p className="truncate text-[12.5px] font-medium">
                                                {ambassador.verified_by__full_name ||
                                                    ambassador.verified_by__email}
                                            </p>
                                            <span className="shrink-0 text-[12px] font-semibold tabular-nums">
                                                {formatNumber(ambassador.count)}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-2.5">
                                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-brand/70"
                                                    style={{
                                                        width: `${Math.round(
                                                            (ambassador.count /
                                                                maxAmbassador) *
                                                                100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="hidden w-40 truncate text-[11px] text-muted-foreground sm:block">
                                                {ambassador.verified_by__email}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Panel>

            <TodayArrivals eventId={eventId} />
        </div>
    );
}

/**
 * Live feed from the backend's activity log: every accreditation recorded
 * for this event today, newest first.
 */
function TodayArrivals({ eventId }: { eventId: number }) {
    const { data, loading, error } = useApiQuery<AccreditationLogEntry[]>(
        `/events/${eventId}/activity-log/`
    );

    if (loading) return <Skeleton className="h-[180px] rounded-xl" />;
    if (error) return null;

    const entries = data ?? [];
    return (
        <Panel>
            <PanelTitle
                icon={TrendingUp}
                title="Arrivals today"
                description="Every accreditation recorded today, newest first"
            />
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                {entries.length === 0 ? (
                    <div className="py-6">
                        <EmptyState
                            compact
                            icon={<TrendingUp />}
                            title="No check-ins today"
                            description="Arrivals will stream in here as the team accredits guests."
                            className="border-0 bg-transparent py-4"
                        />
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {entries.map((entry) => (
                            <li
                                key={entry.id}
                                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                            >
                                <Avatar
                                    name={entry.guest_name}
                                    seed={entry.id}
                                    size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <p className="truncate text-[12.5px] font-medium">
                                            {entry.guest_name}
                                        </p>
                                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                                            {formatTime(entry.time)}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                        {[
                                            entry.category_name,
                                            entry.location_name,
                                            entry.verified_by_name
                                                ? `by ${entry.verified_by_name}`
                                                : null,
                                            entry.kids_count > 0
                                                ? `${entry.kids_count} kid${entry.kids_count === 1 ? '' : 's'}`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Panel>
    );
}
