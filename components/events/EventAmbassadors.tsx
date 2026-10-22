'use client';

import { useMemo, useState } from 'react';
import {
    Loader2,
    Search,
    UserMinus,
    UserPlus,
    Users as UsersIcon,
    X,
} from 'lucide-react';
import type { Event, User } from '@/types';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/useApi';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Props {
    eventId: number;
}

function resolveAssigned(event: Event | null, ambassadors: User[]) {
    if (!event) return [];

    if (Array.isArray(event.ambassadors)) return event.ambassadors;
    if (Array.isArray(event.assigned_ambassadors)) return event.assigned_ambassadors;

    const ids = event.assigned_user_ids ?? event.ambassador_ids;
    if (Array.isArray(ids)) {
        return ambassadors.filter((ambassador) => ids.includes(ambassador.id));
    }

    return [];
}

export function EventAmbassadors({ eventId }: Props) {
    const ambassadorsQuery = useApiQuery<User[]>('/admin/ambassadors/list/');
    const eventQuery = useApiQuery<Event>(`/events/${eventId}/`);

    const [open, setOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [search, setSearch] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');
    const [removingId, setRemovingId] = useState<number | null>(null);

    const ambassadors = useMemo(
        () => ambassadorsQuery.data ?? [],
        [ambassadorsQuery.data]
    );
    const assigned = useMemo(
        () => resolveAssigned(eventQuery.data, ambassadors),
        [eventQuery.data, ambassadors]
    );
    const assignedIds = useMemo(
        () => new Set(assigned.map((ambassador) => ambassador.id)),
        [assigned]
    );

    const loading =
        (ambassadorsQuery.loading && !ambassadorsQuery.data) ||
        (eventQuery.loading && !eventQuery.data);
    const error = ambassadorsQuery.error ?? eventQuery.error;

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return ambassadors
            .filter(
                (ambassador) =>
                    !query ||
                    ambassador.full_name?.toLowerCase().includes(query) ||
                    ambassador.email.toLowerCase().includes(query)
            )
            .sort((a, b) => Number(b.is_active ?? true) - Number(a.is_active ?? true));
    }, [ambassadors, search]);

    const selectable = filtered.filter((ambassador) => !assignedIds.has(ambassador.id));
    const allSelected =
        selectable.length > 0 && selectable.every((ambassador) => selectedIds.includes(ambassador.id));

    const handleOpenChange = (next: boolean) => {
        if (next) {
            // Start each assignment pass from a clean slate.
            setSelectedIds([]);
            setSearch('');
            setAssignError('');
        }
        setOpen(next);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (allSelected) {
            const selectableIds = new Set(selectable.map((ambassador) => ambassador.id));
            setSelectedIds((prev) => prev.filter((id) => !selectableIds.has(id)));
        } else {
            setSelectedIds((prev) =>
                Array.from(new Set([...prev, ...selectable.map((ambassador) => ambassador.id)]))
            );
        }
    };

    const handleAssign = async () => {
        if (selectedIds.length === 0) return;
        setAssigning(true);
        setAssignError('');

        try {
            await api(`/admin/events/${eventId}/assign-bulk/`, {
                method: 'POST',
                body: JSON.stringify({ user_ids: selectedIds }),
            });
            await eventQuery.refetch();
            toast.add({
                type: 'success',
                title: 'Team updated',
                description: `${selectedIds.length} ambassador${
                    selectedIds.length === 1 ? '' : 's'
                } can now accredit guests at this event.`,
            });
            setOpen(false);
        } catch (err) {
            setAssignError(
                err instanceof Error ? err.message : 'Could not assign ambassadors.'
            );
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassign = async (ambassador: User) => {
        setRemovingId(ambassador.id);

        try {
            await api(`/admin/events/${eventId}/assign-bulk/`, {
                method: 'DELETE',
                body: JSON.stringify({ user_ids: [ambassador.id] }),
            });
            await eventQuery.refetch();
            toast.add({
                type: 'success',
                title: 'Ambassador unassigned',
                description: `${
                    ambassador.full_name || ambassador.email
                } can no longer accredit guests at this event.`,
            });
        } catch (err) {
            toast.add({
                type: 'error',
                title: 'Could not unassign ambassador',
                description:
                    err instanceof Error ? err.message : 'Please try again.',
            });
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-[84px] rounded-xl" />
                <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-[68px] rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <section className="rounded-xl bg-card shadow-card ring-1 ring-border">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-[15px] font-semibold">
                                Assigned ambassadors
                            </h2>
                            <StatusBadge
                                label={`${assigned.length} assigned`}
                                tone="neutral"
                            />
                        </div>
                        <p className="mt-1 text-[12px] text-muted-foreground">
                            Control who can accredit guests at this event.
                        </p>
                    </div>
                    <DialogTrigger render={<Button />}>
                        <UserPlus className="size-4" />
                        Assign ambassadors
                    </DialogTrigger>
                </div>

                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    {error ? (
                        <ErrorState
                            description={error}
                            onRetry={() => {
                                void ambassadorsQuery.refetch();
                                void eventQuery.refetch();
                            }}
                        />
                    ) : assigned.length === 0 ? (
                        <EmptyState
                            compact
                            icon={<UsersIcon />}
                            title="No one assigned yet"
                            description="Add ambassadors to this event so they can scan guests in."
                            action={
                                <DialogTrigger
                                    render={<Button variant="outline" size="sm" />}
                                >
                                    <UserPlus className="size-3.5" />
                                    Assign ambassadors
                                </DialogTrigger>
                            }
                        />
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {assigned.map((ambassador) => (
                                <div
                                    key={ambassador.id}
                                    className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors duration-150 hover:bg-muted/40"
                                >
                                    <Avatar name={ambassador.full_name} size="md" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-medium">
                                            {ambassador.full_name || ambassador.email}
                                        </p>
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {ambassador.email}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <StatusBadge
                                            label={
                                                ambassador.is_active === false
                                                    ? 'Inactive'
                                                    : 'Active'
                                            }
                                            tone={
                                                ambassador.is_active === false
                                                    ? 'neutral'
                                                    : 'success'
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Unassign ${
                                                ambassador.full_name ||
                                                ambassador.email
                                            } from this event`}
                                            title="Unassign from event"
                                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() =>
                                                void handleUnassign(ambassador)
                                            }
                                            disabled={removingId !== null}
                                        >
                                            {removingId === ambassador.id ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <UserMinus className="size-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Assign ambassadors</DialogTitle>
                    <DialogDescription>
                        Choose the people who will handle accreditation at this event.
                        You can add more later.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <label htmlFor="ambassador-search" className="sr-only">
                            Search ambassadors
                        </label>
                        <Input
                            id="ambassador-search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name or email"
                            className="pl-9"
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

                    <div className="max-h-[38vh] overflow-y-auto rounded-lg border border-border">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                                No ambassadors match “{search}”.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {filtered.map((ambassador) => {
                                    const alreadyAssigned = assignedIds.has(ambassador.id);
                                    const checked =
                                        alreadyAssigned ||
                                        selectedIds.includes(ambassador.id);
                                    return (
                                        <li key={ambassador.id}>
                                            <label
                                                className={cn(
                                                    'flex items-center gap-3 px-3 py-2.5 transition-colors duration-150',
                                                    alreadyAssigned
                                                        ? 'cursor-default opacity-70'
                                                        : 'cursor-pointer hover:bg-muted/50'
                                                )}
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    disabled={alreadyAssigned}
                                                    onCheckedChange={() => {
                                                        if (!alreadyAssigned) {
                                                            toggleSelect(ambassador.id);
                                                        }
                                                    }}
                                                />
                                                <Avatar
                                                    name={ambassador.full_name}
                                                    size="sm"
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[13px] font-medium">
                                                        {ambassador.full_name ||
                                                            ambassador.email}
                                                    </span>
                                                    <span className="block truncate text-[11px] text-muted-foreground">
                                                        {ambassador.email}
                                                    </span>
                                                </span>
                                                {alreadyAssigned ? (
                                                    <StatusBadge
                                                        label="Assigned"
                                                        tone="brand"
                                                    />
                                                ) : ambassador.is_active === false ? (
                                                    <StatusBadge
                                                        label="Inactive"
                                                        tone="neutral"
                                                    />
                                                ) : null}
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={toggleAll}
                            disabled={selectable.length === 0}
                            className="rounded-md text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                        >
                            {allSelected ? 'Clear selection' : 'Select all'}
                        </button>
                        <span className="text-[12px] text-muted-foreground tabular-nums">
                            {selectedIds.length} selected
                        </span>
                    </div>

                    {assignError ? (
                        <p
                            role="alert"
                            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive"
                        >
                            {assignError}
                        </p>
                    ) : null}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={assigning}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={selectedIds.length === 0 || assigning}
                    >
                        {assigning ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <UserPlus className="size-4" />
                        )}
                        {selectedIds.length > 0
                            ? `Assign ${selectedIds.length}`
                            : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
