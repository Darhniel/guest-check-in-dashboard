'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
    BarChart3,
    CalendarDays,
    Info,
    KeyRound,
    MapPin,
    Pencil,
    Users,
} from 'lucide-react';
import type { Event } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventOverview } from '@/components/events/EventOverview';
import { EventAmbassadors } from '@/components/events/EventAmbassadors';
import { EventAnalytics } from '@/components/events/EventAnalytics';
import { EventOrganizerApi } from '@/components/events/EventOrganizerApi';
import { EventGuests } from '@/components/events/EventGuests';
import { eventStatusMeta, formatEventDates, getEventStatus, pluralize } from '@/lib/format';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { data: event, loading, error, refetch } = useApiQuery<Event>(
        id ? `/events/${id}/` : null
    );
    const [tab, setTab] = useState('overview');

    if (loading) {
        return (
            <div className="space-y-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-72 max-w-full" />
                <Skeleton className="h-4 w-96 max-w-full" />
                <Skeleton className="mt-6 h-10 w-80 max-w-full" />
                <div className="grid gap-4 lg:grid-cols-3">
                    <Skeleton className="h-[280px] rounded-xl lg:col-span-2" />
                    <Skeleton className="h-[280px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-5">
                <PageHeader
                    backHref="/dashboard/events"
                    backLabel="All events"
                    title="Event"
                    description="We couldn't load this event."
                />
                <ErrorState description={error} onRetry={() => void refetch()} />
                <Button variant="outline" onClick={() => router.push('/dashboard/events')}>
                    Back to events
                </Button>
            </div>
        );
    }

    if (!event) return null;

    const status = eventStatusMeta[getEventStatus(event)];

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    backHref="/dashboard/events"
                    backLabel="All events"
                    eyebrow="Event"
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
                                    <span className="truncate">{event.location_text}</span>
                                </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1.5">
                                <Users className="size-3.5 text-muted-foreground" />
                                {pluralize(event.locations.length, 'location')}
                            </span>
                        </div>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                render={
                                    <Link
                                        href={`/dashboard/events/${event.id}/edit`}
                                    />
                                }
                            >
                                <Pencil className="size-4" />
                                Edit event
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setTab('ambassadors')}
                                className="max-sm:hidden"
                            >
                                <Users className="size-4" />
                                Manage team
                            </Button>
                        </div>
                    }
                />
            </div>

            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <TabsList
                        variant="line"
                        className="h-10 w-full min-w-max justify-start gap-5 border-b border-border px-0.5 pb-0"
                    >
                        <TabsTrigger
                            value="overview"
                            className="h-10 flex-none gap-2 px-0.5 pb-3 text-[13px] data-active:after:bottom-0"
                        >
                            <Info className="size-3.5" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="ambassadors"
                            className="h-10 flex-none gap-2 px-0.5 pb-3 text-[13px] data-active:after:bottom-0"
                        >
                            <Users className="size-3.5" />
                            Ambassadors
                        </TabsTrigger>
                        <TabsTrigger
                            value="guests"
                            className="h-10 flex-none gap-2 px-0.5 pb-3 text-[13px] data-active:after:bottom-0"
                        >
                            <Users className="size-3.5" />
                            Guests
                        </TabsTrigger>
                        <TabsTrigger
                            value="organizer"
                            className="h-10 flex-none gap-2 px-0.5 pb-3 text-[13px] data-active:after:bottom-0"
                        >
                            <KeyRound className="size-3.5" />
                            Organizer
                        </TabsTrigger>
                        <TabsTrigger
                            value="analytics"
                            className="h-10 flex-none gap-2 px-0.5 pb-3 text-[13px] data-active:after:bottom-0"
                        >
                            <BarChart3 className="size-3.5" />
                            Analytics
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="mt-5 animate-fade">
                    <EventOverview event={event} />
                </TabsContent>
                <TabsContent value="ambassadors" className="mt-5 animate-fade">
                    <EventAmbassadors eventId={event.id} />
                </TabsContent>
                <TabsContent value="guests" className="mt-5 animate-fade">
                    <EventGuests eventId={event.id} />
                </TabsContent>
                <TabsContent value="organizer" className="mt-5 animate-fade">
                    <EventOrganizerApi eventId={event.id} />
                </TabsContent>
                <TabsContent value="analytics" className="mt-5 animate-fade">
                    <EventAnalytics eventId={event.id} event={event} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
