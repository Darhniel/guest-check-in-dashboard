'use client';

import { Event } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Tag, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
    event: Event;
}

export function EventOverview({ event }: Props) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="text-sm font-medium text-neutral-500 mb-1">Description</div>
                        <p className="text-neutral-900">
                            {event.description || <span className="italic text-neutral-400">No description</span>}
                        </p>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-neutral-500 mb-1">Created by</div>
                        <p className="text-neutral-900">{event.created_by?.full_name || event.created_by?.email}</p>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-neutral-500 mb-1">Status</div>
                        <Badge className={event.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}>
                            {event.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-neutral-500 mb-1">Hour Enforcement</div>
                        <p className="text-neutral-900">
                            {event.enforce_hours ? 'Enabled' : 'Disabled (check-ins allowed anytime)'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Locations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Locations ({event.locations.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {(!event.locations || event.locations.length === 0) ? (
                        <p className="text-sm italic text-neutral-400">No locations configured</p>
                    ) : (
                        <div className="space-y-2">
                            {event.locations.map((loc) => (
                                <div key={loc.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                                    <div className="w-8 h-8 bg-white border border-neutral-200 rounded-lg flex items-center justify-center text-xs font-bold text-neutral-600">
                                        {(loc.order || 0) + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-neutral-900">{loc.name}</div>
                                        {loc.description && (
                                            <div className="text-sm text-neutral-500 mt-0.5">{loc.description}</div>
                                        )}
                                    </div>
                                    <Badge variant={loc.is_active ? 'default' : 'secondary'} className="text-xs">
                                        {loc.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Categories */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Guest Categories ({event.categories.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {(!event.categories || event.categories.length === 0) ? (
                        <p className="text-sm italic text-neutral-400">No categories configured</p>
                    ) : (
                        <div className="space-y-2">
                            {event.categories.map((cat) => (
                                <div key={cat.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                        style={{ backgroundColor: cat.color }}
                                    >
                                        {cat.priority}
                                    </div>
                                    <div className="flex-1 font-medium text-neutral-900">{cat.name}</div>
                                    <code className="text-xs text-neutral-500 bg-white px-2 py-1 rounded border border-neutral-200">
                                        {cat.color}
                                    </code>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Daily Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Daily Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!event.enforce_hours ? (
                        <p className="text-sm italic text-neutral-400">Hour enforcement disabled</p>
                    ) : !event.daily_schedule || Object.keys(event.daily_schedule).length === 0 ? (
                        <p className="text-sm italic text-neutral-400">No schedule configured</p>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(event.daily_schedule)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([date, times]) => {
                                    return (
                                    <div key={date} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                        <div className="font-medium text-neutral-900">
                                            {format(parseISO(date), 'EEE, MMM d')}
                                        </div>
                                        <div className="text-sm text-neutral-600 font-mono">
                                            {times.start} – {times.end}
                                        </div>
                                    </div>
                                    )
                                })
                            }
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}