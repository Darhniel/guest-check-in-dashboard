'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import {
    ArrowUpRight,
    CalendarDays,
    CalendarPlus,
    MapPin,
    Plus,
    Search,
    Tag,
    X,
} from 'lucide-react';
import type { Event } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { EventMark } from '@/components/common/EventMark';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    eventStatusMeta,
    formatEventDates,
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
    ended: 3,
    unknown: 2,
};

function EventsSkeleton() {
    return (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[248px] rounded-xl" />
            ))}
        </div>
    );
}

export default function EventsPage() {
    const { data, loading, error, refetch } = useApiQuery<Event[]>('/events/');
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [filter, setFilter] = useState<Filter>('all');

    const events = useMemo(() => data ?? [], [data]);

    const counts = useMemo(() => {
        const next: Record<Filter, number> = {
            all: events.length,
            live: 0,
            upcoming: 0,
            ended: 0,
            unknown: 0,
        };
        for (const event of events) {
            next[getEventStatus(event)] += 1;
        }
        return next;
    }, [events]);

    const visible = useMemo(() => {
        const query = deferredSearch.trim().toLowerCase();
        return events
            .filter((event) => {
                if (filter !== 'all' && getEventStatus(event) !== filter) return false;
                if (!query) return true;
                return (
                    event.name.toLowerCase().includes(query) ||
                    event.location_text?.toLowerCase().includes(query) ||
                    event.description?.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                const statusDiff =
                    statusOrder[getEventStatus(a)] - statusOrder[getEventStatus(b)];
                if (statusDiff !== 0) return statusDiff;
                return getEventStatus(a) === 'ended'
                    ? b.start_date.localeCompare(a.start_date)
                    : a.start_date.localeCompare(b.start_date);
            });
    }, [events, filter, deferredSearch]);

    const liveCount = counts.live;

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    eyebrow="Programme"
                    title="Events"
                    description={
                        <>
                            {pluralize(events.length, 'event')} in your workspace
                            {liveCount > 0 ? ` · ${liveCount} live right now` : ''}
                        </>
                    }
                    actions={
                        <Button render={<Link href="/dashboard/events/new" />}>
                            <Plus className="size-4" />
                            Create event
                        </Button>
                    }
                />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <label htmlFor="event-search" className="sr-only">
                        Search events
                    </label>
                    <Input
                        id="event-search"
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
                    aria-label="Filter events by status"
                    className="flex w-full items-center gap-0.5 rounded-lg bg-muted p-1 sm:w-auto"
                >
                    {filters.map((item) => {
                        const active = filter === item.value;
                        const count = counts[item.value];
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
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {error ? (
                <ErrorState
                    description={error}
                    onRetry={() => {
                        void refetch();
                    }}
                />
            ) : loading ? (
                <EventsSkeleton />
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={search || filter !== 'all' ? <Search /> : <CalendarPlus />}
                    title={
                        events.length === 0
                            ? 'No events yet'
                            : 'No events match these filters'
                    }
                    description={
                        events.length === 0
                            ? 'Create your first event to start accrediting guests and assigning ambassadors.'
                            : 'Try a different search or clear the status filter.'
                    }
                    action={
                        events.length === 0 ? (
                            <Button render={<Link href="/dashboard/events/new" />}>
                                <Plus className="size-4" />
                                Create event
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearch('');
                                    setFilter('all');
                                }}
                            >
                                Clear filters
                            </Button>
                        )
                    }
                />
            ) : (
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visible.map((event, index) => {
                        const status = eventStatusMeta[getEventStatus(event)];
                        return (
                            <Link
                                key={event.id}
                                href={`/dashboard/events/${event.id}`}
                                className="group animate-enter flex flex-col gap-4 rounded-xl bg-card p-4 shadow-card ring-1 ring-border transition-[box-shadow,border-color] duration-200 outline-none hover:shadow-float hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-ring/50 sm:p-5"
                                style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <EventMark
                                        name={event.name}
                                        seed={event.id}
                                        size="lg"
                                    />
                                    <StatusBadge
                                        label={status.label}
                                        tone={status.tone}
                                        pulse={status.label === 'Live'}
                                    />
                                </div>

                                <div>
                                    <h2 className="text-[15px] leading-snug font-semibold tracking-[-0.015em]">
                                        {event.name}
                                    </h2>
                                    {event.description ? (
                                        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                                            {event.description}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="mt-auto space-y-2 text-[12px] text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="size-3.5 shrink-0" />
                                        <span className="truncate">
                                            {formatEventDates(
                                                event.start_date,
                                                event.end_date
                                            )}
                                        </span>
                                    </div>
                                    {event.location_text ? (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="size-3.5 shrink-0" />
                                            <span className="truncate">
                                                {event.location_text}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex items-center justify-between gap-2 border-t border-border pt-3.5">
                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="size-3" />
                                            {event.locations.length} locations
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Tag className="size-3" />
                                            {event.categories.length} categories
                                        </span>
                                    </div>
                                    <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                                        <ArrowUpRight className="size-3.5 transition-transform duration-200 ease-snappy group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
