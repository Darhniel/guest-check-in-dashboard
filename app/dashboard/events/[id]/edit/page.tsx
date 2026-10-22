'use client';

import { useParams, useRouter } from 'next/navigation';
import type { Event } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/ui/button';
import { EventForm } from '@/components/events/EventForm';

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { data: event, loading, error, refetch } = useApiQuery<Event>(
        id ? `/events/${id}/` : null
    );

    if (loading) {
        return (
            <div className="space-y-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-64 max-w-full" />
                <Skeleton className="h-4 w-96 max-w-full" />
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="space-y-4">
                        <Skeleton className="h-[280px] rounded-xl" />
                        <Skeleton className="h-[220px] rounded-xl" />
                        <Skeleton className="h-[220px] rounded-xl" />
                    </div>
                    <Skeleton className="h-[300px] rounded-xl" />
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
                    title="Edit event"
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

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    backHref={`/dashboard/events/${event.id}`}
                    backLabel={event.name}
                    eyebrow="Edit"
                    title="Edit event"
                    description="Update the dates, accreditation points, guest categories, and custom fields. Changes apply immediately."
                />
            </div>
            <EventForm event={event} />
        </div>
    );
}
