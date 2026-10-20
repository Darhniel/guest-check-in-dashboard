'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Loader2, Users } from 'lucide-react';
import { format, parseISO, isWithinInterval, isFuture, isPast } from 'date-fns';

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await api<Event[]>('/events/');
            setEvents(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getEventStatus = (event: Event) => {
        const start = parseISO(event.start_date);
        const end = parseISO(event.end_date);
        const now = new Date();

        if (isFuture(start)) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
        if (isWithinInterval(now, { start, end })) return { label: 'Live', color: 'bg-green-100 text-green-700' };
        return { label: 'Ended', color: 'bg-neutral-100 text-neutral-600' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Events</h1>
                    <p className="text-neutral-500 mt-1">
                        {events.length} event{events.length !== 1 ? 's' : ''} total
                    </p>
                </div>
                <Link href="/dashboard/events/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                    </Button>
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
                    <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">No events yet</h3>
                    <p className="text-neutral-500 mb-6">Create your first event to get started</p>
                    <Link href="/dashboard/events/new">
                        <Button>Create Event</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event) => {
                        const status = getEventStatus(event);
                        return (
                            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                                <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 transition-colors cursor-pointer h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-neutral-900 truncate">
                                                {event.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>
                                                    {format(parseISO(event.start_date), 'MMM d')} –{' '}
                                                    {format(parseISO(event.end_date), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className={status.color}>{status.label}</Badge>
                                    </div>

                                    {event.location_text && (
                                        <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-3">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="truncate">{event.location_text}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {event.locations.length} location{event.locations.length !== 1 ? 's' : ''}
                                        </div>
                                        <div>{event.categories.length} categories</div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}