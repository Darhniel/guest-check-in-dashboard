'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import {
    Ellipsis,
    Loader2,
    Pencil,
    Search,
    ToggleLeft,
    ToggleRight,
    Trash2,
    UserPlus,
    UserRoundX,
    Users,
    X,
} from 'lucide-react';
import type { User } from '@/types';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AmbassadorCreateDialog } from '@/components/ambassadors/AmbassadorCreateDialog';
import { AmbassadorEditDialog } from '@/components/ambassadors/AmbassadorEditDialog';
import { toast } from '@/components/ui/toast';
import { pluralize } from '@/lib/format';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'active' | 'inactive';

const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

function RowMenu({
    ambassador,
    busy,
    onEdit,
    onToggle,
    onDelete,
}: {
    ambassador: User;
    busy: boolean;
    onEdit: () => void;
    onToggle: () => void;
    onDelete: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${ambassador.full_name || ambassador.email}`}
                        className="text-muted-foreground"
                    />
                }
            >
                {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <Ellipsis className="size-4" />
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onClick={onEdit}
                    className="cursor-pointer py-2"
                    disabled={busy}
                >
                    <Pencil />
                    Edit details
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={onToggle}
                    className="cursor-pointer py-2"
                    disabled={busy}
                >
                    {ambassador.is_active ? (
                        <>
                            <ToggleLeft />
                            Deactivate
                        </>
                    ) : (
                        <>
                            <ToggleRight />
                            Activate
                        </>
                    )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    onClick={onDelete}
                    className="cursor-pointer py-2"
                    disabled={busy}
                >
                    <Trash2 />
                    Delete ambassador
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    disabled
                    className="py-2 text-muted-foreground"
                >
                    {ambassador.phone || 'No phone number'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function AmbassadorsPage() {
    const { data, loading, error, refetch, setData } = useApiQuery<User[]>(
        '/admin/ambassadors/list/'
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [filter, setFilter] = useState<Filter>('all');
    const [confirmToggle, setConfirmToggle] = useState<User | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editing, setEditing] = useState<User | null>(null);

    const ambassadors = useMemo(() => data ?? [], [data]);

    const counts = useMemo(() => {
        const active = ambassadors.filter((ambassador) => ambassador.is_active).length;
        return {
            all: ambassadors.length,
            active,
            inactive: ambassadors.length - active,
        };
    }, [ambassadors]);

    const visible = useMemo(() => {
        const query = deferredSearch.trim().toLowerCase();
        return ambassadors
            .filter((ambassador) => {
                if (filter === 'active' && !ambassador.is_active) return false;
                if (filter === 'inactive' && ambassador.is_active) return false;
                if (!query) return true;
                return (
                    ambassador.full_name?.toLowerCase().includes(query) ||
                    ambassador.email.toLowerCase().includes(query) ||
                    ambassador.phone?.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                const statusDiff = Number(b.is_active) - Number(a.is_active);
                if (statusDiff !== 0) return statusDiff;
                return (a.full_name || a.email).localeCompare(b.full_name || b.email);
            });
    }, [ambassadors, filter, deferredSearch]);

    const handleToggle = async (ambassador: User) => {
        setTogglingId(ambassador.id);
        const nextActive = !ambassador.is_active;
        setData((previous) =>
            (previous ?? []).map((item) =>
                item.id === ambassador.id ? { ...item, is_active: nextActive } : item
            )
        );

        try {
            await api(`/admin/ambassadors/${ambassador.id}/toggle/`, {
                method: 'PATCH',
            });
            await refetch();
            toast.add({
                type: 'success',
                title: nextActive ? 'Ambassador activated' : 'Ambassador deactivated',
                description: nextActive
                    ? `${ambassador.full_name || ambassador.email} can sign in and scan guests again.`
                    : `${ambassador.full_name || ambassador.email} can no longer sign in.`,
            });
        } catch (err) {
            setData((previous) =>
                (previous ?? []).map((item) =>
                    item.id === ambassador.id
                        ? { ...item, is_active: ambassador.is_active }
                        : item
                )
            );
            toast.add({
                type: 'error',
                title: 'Could not update ambassador',
                description:
                    err instanceof Error ? err.message : 'Please try again.',
            });
        } finally {
            setTogglingId(null);
            setConfirmToggle(null);
        }
    };

    const handleDelete = async (ambassador: User) => {
        setDeletingId(ambassador.id);

        try {
            await api(`/admin/ambassadors/${ambassador.id}/`, {
                method: 'DELETE',
            });
            setData((previous) =>
                (previous ?? []).filter((item) => item.id !== ambassador.id)
            );
            await refetch();
            toast.add({
                type: 'success',
                title: 'Ambassador deleted',
                description: `${
                    ambassador.full_name || ambassador.email
                } has been removed from the team.`,
            });
        } catch (err) {
            toast.add({
                type: 'error',
                title: 'Could not delete ambassador',
                description:
                    err instanceof Error ? err.message : 'Please try again.',
            });
        } finally {
            setDeletingId(null);
            setConfirmDelete(null);
        }
    };

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    eyebrow="Team"
                    title="Ambassadors"
                    description={
                        <>
                            {pluralize(counts.all, 'person', 'people')} on the team ·{' '}
                            {counts.active} active
                        </>
                    }
                    actions={
                        <Button onClick={() => setCreateOpen(true)}>
                            <UserPlus className="size-4" />
                            Invite ambassador
                        </Button>
                    }
                />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <label htmlFor="team-search" className="sr-only">
                        Search ambassadors
                    </label>
                    <Input
                        id="team-search"
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, email, or phone"
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
                    aria-label="Filter ambassadors by status"
                    className="flex w-full items-center gap-0.5 rounded-lg bg-muted p-1 sm:w-auto"
                >
                    {filters.map((item) => {
                        const active = filter === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setFilter(item.value)}
                                className={cn(
                                    'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:flex-none',
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
                                    {counts[item.value]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {error ? (
                <ErrorState description={error} onRetry={() => void refetch()} />
            ) : loading ? (
                <div className="space-y-3">
                    <Skeleton className="h-[52px] rounded-xl" />
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-[64px] rounded-xl" />
                    ))}
                </div>
            ) : ambassadors.length === 0 ? (
                <EmptyState
                    icon={<UserPlus />}
                    title="No ambassadors yet"
                    description="Invite your first ambassador to start accrediting guests at events."
                    action={
                        <Button onClick={() => setCreateOpen(true)}>
                            <UserPlus className="size-4" />
                            Invite ambassador
                        </Button>
                    }
                />
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={<Search />}
                    title="No one matches those filters"
                    description="Try a different name, email, or status."
                    action={
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                setFilter('all');
                            }}
                        >
                            Clear filters
                        </Button>
                    }
                />
            ) : (
                <div className="overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-border">
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2">
                            <Users className="size-4 text-muted-foreground" />
                            <h2 className="text-[13px] font-semibold">Team directory</h2>
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                            {visible.length} shown
                        </span>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="h-9 px-4 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase sm:px-5">
                                        Ambassador
                                    </TableHead>
                                    <TableHead className="h-9 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                                        Phone
                                    </TableHead>
                                    <TableHead className="h-9 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                                        Status
                                    </TableHead>
                                    <TableHead className="h-9 w-12 px-4 sm:px-5">
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visible.map((ambassador) => (
                                    <TableRow
                                        key={ambassador.id}
                                        className="border-border/70 transition-colors duration-150 hover:bg-muted/40"
                                    >
                                        <TableCell className="px-4 py-3 sm:px-5">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={ambassador.full_name}
                                                    size="md"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-medium">
                                                        {ambassador.full_name ||
                                                            'Unnamed ambassador'}
                                                    </p>
                                                    <p className="truncate text-[11.5px] text-muted-foreground">
                                                        {ambassador.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[12.5px] text-muted-foreground">
                                            {ambassador.phone || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                label={
                                                    ambassador.is_active
                                                        ? 'Active'
                                                        : 'Inactive'
                                                }
                                                tone={
                                                    ambassador.is_active
                                                        ? 'success'
                                                        : 'neutral'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="px-4 text-right sm:px-5">
                                            <RowMenu
                                                ambassador={ambassador}
                                                busy={
                                                    togglingId === ambassador.id ||
                                                    deletingId === ambassador.id
                                                }
                                                onEdit={() =>
                                                    setEditing(ambassador)
                                                }
                                                onToggle={() =>
                                                    setConfirmToggle(ambassador)
                                                }
                                                onDelete={() =>
                                                    setConfirmDelete(ambassador)
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile list */}
                    <ul className="divide-y divide-border md:hidden">
                        {visible.map((ambassador) => (
                            <li
                                key={ambassador.id}
                                className="flex items-start gap-3 px-4 py-3.5"
                            >
                                <Avatar name={ambassador.full_name} size="md" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-medium">
                                        {ambassador.full_name || 'Unnamed ambassador'}
                                    </p>
                                    <p className="truncate text-[11.5px] text-muted-foreground">
                                        {ambassador.email}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <StatusBadge
                                            label={
                                                ambassador.is_active
                                                    ? 'Active'
                                                    : 'Inactive'
                                            }
                                            tone={
                                                ambassador.is_active
                                                    ? 'success'
                                                    : 'neutral'
                                            }
                                        />
                                        {ambassador.phone ? (
                                            <span className="truncate text-[11px] text-muted-foreground">
                                                {ambassador.phone}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <RowMenu
                                    ambassador={ambassador}
                                    busy={
                                        togglingId === ambassador.id ||
                                        deletingId === ambassador.id
                                    }
                                    onEdit={() => setEditing(ambassador)}
                                    onToggle={() => setConfirmToggle(ambassador)}
                                    onDelete={() => setConfirmDelete(ambassador)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <AmbassadorCreateDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={() => {
                    void refetch();
                }}
            />

            <AmbassadorEditDialog
                ambassador={editing}
                onOpenChange={(next) => {
                    if (!next) setEditing(null);
                }}
                onSuccess={() => {
                    void refetch();
                }}
            />

            <AlertDialog
                open={confirmToggle !== null}
                onOpenChange={(next) => {
                    if (!next) setConfirmToggle(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmToggle?.is_active
                                ? 'Deactivate ambassador?'
                                : 'Activate ambassador?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmToggle?.is_active
                                ? `${
                                      confirmToggle?.full_name ||
                                      confirmToggle?.email ||
                                      'This ambassador'
                                  } will be signed out and can no longer accredit guests or access assigned events.`
                                : `${
                                      confirmToggle?.full_name ||
                                      confirmToggle?.email ||
                                      'This ambassador'
                                  } will be able to sign in and accredit guests at their assigned events again.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={togglingId !== null}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={
                                confirmToggle?.is_active ? 'destructive' : 'default'
                            }
                            disabled={togglingId !== null}
                            onClick={(event) => {
                                event.preventDefault();
                                if (confirmToggle) {
                                    void handleToggle(confirmToggle);
                                }
                            }}
                        >
                            {togglingId !== null ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : confirmToggle?.is_active ? (
                                <UserRoundX className="size-4" />
                            ) : (
                                <UserPlus className="size-4" />
                            )}
                            {confirmToggle?.is_active ? 'Deactivate' : 'Activate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={confirmDelete !== null}
                onOpenChange={(next) => {
                    if (!next) setConfirmDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete ambassador?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDelete?.full_name ||
                                confirmDelete?.email ||
                                'This ambassador'}{' '}
                            will be permanently removed from the team and lose
                            access to every assigned event. Past check-ins stay
                            in reports, but will no longer be attributed to
                            them.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingId !== null}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deletingId !== null}
                            onClick={(event) => {
                                event.preventDefault();
                                if (confirmDelete) {
                                    void handleDelete(confirmDelete);
                                }
                            }}
                        >
                            {deletingId !== null ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            Delete ambassador
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
