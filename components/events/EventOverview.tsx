'use client';

import type { ReactNode } from 'react';
import { Clock3, FileText, MapPin, Tag } from 'lucide-react';
import type { Event } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDay, formatTime } from '@/lib/format';

interface Props {
    event: Event;
}

function Panel({
    children,
    className,
}: {
    children: ReactNode;
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

function PanelTitle({
    icon: Icon,
    title,
    meta,
}: {
    icon: typeof FileText;
    title: string;
    meta?: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
            <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" strokeWidth={1.9} />
                <h2 className="text-[14px] font-semibold">{title}</h2>
            </div>
            {meta ? (
                <span className="text-[11px] text-muted-foreground">{meta}</span>
            ) : null}
        </div>
    );
}

function Meta({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div>
            <p className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                {label}
            </p>
            <div className="mt-1.5 text-[13px] text-foreground">{children}</div>
        </div>
    );
}

export function EventOverview({ event }: Props) {
    const locations = [...(event.locations ?? [])].sort((a, b) => a.order - b.order);
    const categories = event.categories ?? [];
    const scheduleEntries = Object.entries(event.daily_schedule ?? {}).sort(([a], [b]) =>
        a.localeCompare(b)
    );

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
                <Panel>
                    <PanelTitle icon={FileText} title="About this event" />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <p className="text-[13px] leading-relaxed text-muted-foreground">
                            {event.description || (
                                <span className="italic">
                                    No description has been added for this event.
                                </span>
                            )}
                        </p>

                        <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                            <Meta label="Created by">
                                <span className="flex items-center gap-2">
                                    <Avatar
                                        name={event.created_by?.full_name}
                                        size="xs"
                                    />
                                    <span className="truncate">
                                        {event.created_by?.full_name ||
                                            event.created_by?.email ||
                                            '—'}
                                    </span>
                                </span>
                            </Meta>
                            <Meta label="Accreditation">
                                <StatusBadge
                                    label={event.is_active ? 'Open' : 'Closed'}
                                    tone={event.is_active ? 'success' : 'neutral'}
                                />
                            </Meta>
                            <Meta label="Check-in hours">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="size-3.5 text-muted-foreground" />
                                    {event.enforce_hours ? 'Enforced' : 'Anytime'}
                                </span>
                            </Meta>
                        </div>
                    </div>
                </Panel>

                <Panel>
                    <PanelTitle
                        icon={MapPin}
                        title="Accreditation points"
                        meta={`${locations.length} location${locations.length === 1 ? '' : 's'}`}
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {locations.length === 0 ? (
                            <p className="py-4 text-[13px] text-muted-foreground italic">
                                No locations configured yet.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {locations.map((location, index) => (
                                    <li
                                        key={location.id}
                                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                                    >
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-medium">
                                                {location.name}
                                            </p>
                                            {location.description ? (
                                                <p className="mt-0.5 text-[12px] text-muted-foreground">
                                                    {location.description}
                                                </p>
                                            ) : null}
                                        </div>
                                        {!location.is_active ? (
                                            <StatusBadge label="Inactive" tone="neutral" />
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Panel>
            </div>

            <div className="space-y-4">
                <Panel>
                    <PanelTitle
                        icon={Tag}
                        title="Guest categories"
                        meta={`${categories.length} tier${categories.length === 1 ? '' : 's'}`}
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {categories.length === 0 ? (
                            <p className="py-4 text-[13px] text-muted-foreground italic">
                                No categories configured.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {[...categories]
                                    .sort((a, b) => b.priority - a.priority)
                                    .map((category) => (
                                        <li
                                            key={category.id}
                                            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <span
                                                className="size-6 shrink-0 rounded-md ring-1 ring-black/10 ring-inset dark:ring-white/15"
                                                style={{
                                                    backgroundColor: category.color,
                                                }}
                                            />
                                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                                                {category.name}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                                Priority {category.priority}
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                </Panel>

                <Panel>
                    <PanelTitle icon={Clock3} title="Daily schedule" />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {!event.enforce_hours ? (
                            <div className="rounded-lg bg-muted/60 px-3 py-3 text-[12px] text-muted-foreground">
                                Hour enforcement is off. Guests can be accredited at any
                                time during the event.
                            </div>
                        ) : scheduleEntries.length === 0 ? (
                            <p className="py-4 text-[13px] text-muted-foreground italic">
                                No schedule configured.
                            </p>
                        ) : (
                            <ul className="space-y-1">
                                {scheduleEntries.map(([date, times]) => (
                                    <li
                                        key={date}
                                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                                    >
                                        <span className="text-[12.5px] text-foreground">
                                            {formatDay(date)}
                                        </span>
                                        <span className="text-[12px] text-muted-foreground tabular-nums">
                                            {formatTime(times.start)} – {formatTime(times.end)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Panel>
            </div>
        </div>
    );
}
