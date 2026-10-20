'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Loader2,
    Users,
    BarChart3,
    Info,
} from 'lucide-react';
import { format, parseISO, isWithinInterval, isFuture } from 'date-fns';
import { EventOverview } from '@/components/events/EventOverview';
import { EventAmbassadors } from '@/components/events/EventAmbassadors';
import { EventAnalytics } from '@/components/events/EventAnalytics';

export default function EventDetailPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        loadEvent();
    }, [id]);

    const loadEvent = async () => {
        try {
            const data = await api<Event>(`/events/${id}/`);
            setEvent(data);
        } catch (e) {
            console.error(e);
            router.push('/dashboard/events');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!event) return null;

    const getEventStatus = () => {
        try {
            const start = parseISO(event.start_date);
            const end = parseISO(event.end_date);
            const now = new Date();

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return { label: 'Unknown', color: 'bg-neutral-100 text-neutral-600' };
            }

            if (isFuture(start)) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
            if (isWithinInterval(now, { start, end })) return { label: 'Live', color: 'bg-green-100 text-green-700' };
            return { label: 'Ended', color: 'bg-neutral-100 text-neutral-600' };
        } catch (e) {
            console.error("Date parsing error:", e);
            return { label: 'Unknown', color: 'bg-neutral-100 text-neutral-600' };
        }
    };

    const status = getEventStatus();

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard/events')}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Events
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-neutral-900">{event.name}</h1>
                            <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-neutral-500">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {format(parseISO(event.start_date), 'MMM d')} –{' '}
                                {format(parseISO(event.end_date), 'MMM d, yyyy')}
                            </div>
                            {event.location_text && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {event.location_text}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {event.locations.length} location{event.locations.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-white border border-neutral-200">
                    <TabsTrigger value="overview" className="gap-2">
                        <Info className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="ambassadors" className="gap-2">
                        <Users className="w-4 h-4" />
                        Ambassadors
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <EventOverview event={event} />
                </TabsContent>
                <TabsContent value="ambassadors" className="mt-6">
                    <EventAmbassadors eventId={event.id} />
                </TabsContent>
                <TabsContent value="analytics" className="mt-6">
                    <EventAnalytics eventId={event.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}