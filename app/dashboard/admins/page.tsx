'use client';

import { useMemo, useState } from 'react';
import { Search, ShieldCheck, ShieldPlus, ShieldAlert, X } from 'lucide-react';
import type { User } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { useUser } from '@/components/layout/UserProvider';
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
import { AdminCreateDialog } from '@/components/admins/AdminCreateDialog';
import { formatDate } from '@/lib/format';
import { isFullAdmin, roleLabel } from '@/lib/roles';

export default function AdminsPage() {
    const user = useUser();
    const canManage = isFullAdmin(user);
    const { data, loading, error, refetch } = useApiQuery<User[]>(
        canManage ? '/admin/admins/' : null
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [search, setSearch] = useState('');

    const admins = useMemo(() => data ?? [], [data]);
    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return admins;
        return admins.filter(
            (admin) =>
                admin.full_name?.toLowerCase().includes(query) ||
                admin.email.toLowerCase().includes(query) ||
                roleLabel(admin.role).toLowerCase().includes(query)
        );
    }, [admins, search]);

    if (!canManage) {
        return (
            <div className="space-y-5 sm:space-y-6">
                <PageHeader
                    eyebrow="Access"
                    title="Admins"
                    description="Manage who can access the console."
                />
                <EmptyState
                    icon={<ShieldAlert />}
                    title="View-only access"
                    description="Supervisors can review the console but cannot add or change admin users."
                />
            </div>
        );
    }

    const activeCount = admins.filter((admin) => admin.is_active !== false).length;

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    eyebrow="Access"
                    title="Admins"
                    description={
                        <>
                            {admins.length} console{' '}
                            {admins.length === 1 ? 'user' : 'users'} ·{' '}
                            {activeCount} active
                        </>
                    }
                    actions={
                        <Button onClick={() => setCreateOpen(true)}>
                            <ShieldPlus className="size-4" />
                            Add admin
                        </Button>
                    }
                />
            </div>

            <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <label htmlFor="admin-search" className="sr-only">
                    Search admins
                </label>
                <Input
                    id="admin-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, email, or access"
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

            {error ? (
                <ErrorState description={error} onRetry={() => void refetch()} />
            ) : loading ? (
                <div className="space-y-3">
                    <Skeleton className="h-[52px] rounded-xl" />
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-[64px] rounded-xl" />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={<ShieldCheck />}
                    title={admins.length === 0 ? 'No admin users yet' : 'No one matches'}
                    description={
                        admins.length === 0
                            ? 'Add a full admin or a view-only supervisor to give someone console access.'
                            : 'Try a different name, email, or access level.'
                    }
                    action={
                        admins.length === 0 ? (
                            <Button onClick={() => setCreateOpen(true)}>
                                <ShieldPlus className="size-4" />
                                Add admin
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => setSearch('')}>
                                Clear search
                            </Button>
                        )
                    }
                />
            ) : (
                <div className="overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-border">
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-muted-foreground" />
                            <h2 className="text-[13px] font-semibold">
                                Console access
                            </h2>
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                            {visible.length} shown
                        </span>
                    </div>

                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="h-9 px-4 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase sm:px-5">
                                        Person
                                    </TableHead>
                                    <TableHead className="h-9 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                                        Access
                                    </TableHead>
                                    <TableHead className="h-9 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                                        Status
                                    </TableHead>
                                    <TableHead className="h-9 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                                        Added
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visible.map((admin) => (
                                    <TableRow
                                        key={admin.id}
                                        className="border-border/70 transition-colors duration-150 hover:bg-muted/40"
                                    >
                                        <TableCell className="px-4 py-3 sm:px-5">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={admin.full_name}
                                                    size="md"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-medium">
                                                        {admin.full_name ||
                                                            'Unnamed admin'}
                                                        {admin.id === user?.id ? (
                                                            <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                                                                You
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                    <p className="truncate text-[11.5px] text-muted-foreground">
                                                        {admin.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                label={roleLabel(admin.role)}
                                                tone={
                                                    admin.role === 'admin'
                                                        ? 'brand'
                                                        : 'info'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                label={
                                                    admin.is_active === false
                                                        ? 'Inactive'
                                                        : 'Active'
                                                }
                                                tone={
                                                    admin.is_active === false
                                                        ? 'neutral'
                                                        : 'success'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="text-[12.5px] text-muted-foreground">
                                            {admin.date_joined
                                                ? formatDate(admin.date_joined)
                                                : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <ul className="divide-y divide-border md:hidden">
                        {visible.map((admin) => (
                            <li
                                key={admin.id}
                                className="flex items-start gap-3 px-4 py-3.5"
                            >
                                <Avatar name={admin.full_name} size="md" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-medium">
                                        {admin.full_name || 'Unnamed admin'}
                                    </p>
                                    <p className="truncate text-[11.5px] text-muted-foreground">
                                        {admin.email}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <StatusBadge
                                            label={roleLabel(admin.role)}
                                            tone={
                                                admin.role === 'admin'
                                                    ? 'brand'
                                                    : 'info'
                                            }
                                        />
                                        <StatusBadge
                                            label={
                                                admin.is_active === false
                                                    ? 'Inactive'
                                                    : 'Active'
                                            }
                                            tone={
                                                admin.is_active === false
                                                    ? 'neutral'
                                                    : 'success'
                                            }
                                        />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <AdminCreateDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={() => {
                    void refetch();
                }}
            />
        </div>
    );
}
