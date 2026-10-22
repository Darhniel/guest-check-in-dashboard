'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Users,
    X,
} from 'lucide-react';
import type { ReportGuest } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

type GuestFilter = 'all' | 'in' | 'out';

const filters: { value: GuestFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'in', label: 'Checked in' },
    { value: 'out', label: 'Not yet' },
];

export function GuestTable({ guests }: { guests: ReportGuest[] }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<GuestFilter>('all');
    const [page, setPage] = useState(0);
    const deferredSearch = useDeferredValue(search);

    const counts = useMemo(() => {
        const inCount = guests.filter((guest) => guest.checked_in).length;
        return {
            all: guests.length,
            in: inCount,
            out: guests.length - inCount,
        };
    }, [guests]);

    const filtered = useMemo(() => {
        const query = deferredSearch.trim().toLowerCase();

        return guests.filter((guest) => {
            if (filter === 'in' && !guest.checked_in) return false;
            if (filter === 'out' && guest.checked_in) return false;
            if (!query) return true;

            return (
                guest.adult_names.toLowerCase().includes(query) ||
                guest.email.toLowerCase().includes(query) ||
                guest.ticket_number.toLowerCase().includes(query) ||
                (guest.category ?? '').toLowerCase().includes(query)
            );
        });
    }, [guests, deferredSearch, filter]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pageCount - 1);
    const start = current * PAGE_SIZE;
    const visible = filtered.slice(start, start + PAGE_SIZE);

    return (
        <div>
            <div className="flex flex-col gap-3 px-4 pb-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <label htmlFor="report-guest-search" className="sr-only">
                        Search guests
                    </label>
                    <Input
                        id="report-guest-search"
                        type="search"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(0);
                        }}
                        placeholder="Search guests, tickets, categories"
                        className="pl-9 [&::-webkit-search-cancel-button]:hidden"
                    />
                    {search ? (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setPage(0);
                            }}
                            aria-label="Clear search"
                            className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-3.5" />
                        </button>
                    ) : null}
                </div>

                <div
                    role="group"
                    aria-label="Filter guests by check-in status"
                    className="flex w-full items-center gap-0.5 rounded-lg bg-muted p-1 lg:w-auto"
                >
                    {filters.map((item) => {
                        const active = filter === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => {
                                    setFilter(item.value);
                                    setPage(0);
                                }}
                                className={cn(
                                    'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 lg:flex-none',
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
                                    {formatNumber(counts[item.value])}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="px-4 pb-4 sm:px-5">
                    <EmptyState
                        compact
                        icon={<Users />}
                        title="No guests match this view"
                        description="Try a different search or clear the status filter."
                        action={
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearch('');
                                    setFilter('all');
                                    setPage(0);
                                }}
                            >
                                Clear filters
                            </Button>
                        }
                        className="border-0 bg-transparent"
                    />
                </div>
            ) : (
                <ul className="divide-y divide-border border-t border-border">
                    {visible.map((guest) => (
                        <li
                            key={guest.id}
                            className="flex items-center gap-3 px-4 py-2.5 sm:px-5"
                        >
                            <Avatar
                                name={guest.adult_names}
                                seed={guest.email || guest.ticket_number}
                                size="sm"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate text-[12.5px] font-medium">
                                        {guest.adult_names}
                                    </p>
                                    {guest.kids_count > 0 ? (
                                        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
                                            +{guest.kids_count}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                    {guest.category ?? 'Uncategorized'} ·{' '}
                                    {guest.ticket_number}
                                </p>
                            </div>

                            <div className="hidden w-32 shrink-0 text-right md:block">
                                <p className="text-[11.5px] tabular-nums">
                                    {guest.last_checkin_date
                                        ? formatDate(
                                              guest.last_checkin_date,
                                              'MMM d'
                                          )
                                        : '—'}
                                    {guest.last_checkin_time ? (
                                        <span className="text-muted-foreground">
                                            {' · '}
                                            {guest.last_checkin_time.slice(
                                                0,
                                                5
                                            )}
                                        </span>
                                    ) : null}
                                </p>
                                <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                                    {guest.location ?? 'No location'}
                                </p>
                            </div>

                            <StatusBadge
                                label={
                                    guest.checked_in
                                        ? guest.checkins > 1
                                            ? `Checked in · ${guest.checkins}×`
                                            : 'Checked in'
                                        : 'Not yet'
                                }
                                tone={guest.checked_in ? 'success' : 'neutral'}
                                className="shrink-0"
                            />
                        </li>
                    ))}
                </ul>
            )}

            {filtered.length > 0 ? (
                <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
                    <p className="text-[11px] text-muted-foreground">
                        Showing {formatNumber(start + 1)}–
                        {formatNumber(Math.min(start + PAGE_SIZE, filtered.length))} of{' '}
                        {formatNumber(filtered.length)}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            disabled={current === 0}
                            onClick={() => setPage(current - 1)}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="size-3.5" />
                        </Button>
                        <span className="min-w-14 text-center text-[11px] text-muted-foreground tabular-nums">
                            {current + 1} / {pageCount}
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            disabled={current >= pageCount - 1}
                            onClick={() => setPage(current + 1)}
                            aria-label="Next page"
                        >
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
