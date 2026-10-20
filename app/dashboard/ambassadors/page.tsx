'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { UserPlus, Loader2, MoreVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AmbassadorCreateDialog } from '@/components/ambassadors/AmbassadorCreateDialog';

export default function AmbassadorsPage() {
    const [ambassadors, setAmbassadors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const [confirmToggle, setConfirmToggle] = useState<User | null>(null);


    useEffect(() => {
        loadAmbassadors();
    }, []);


    const loadAmbassadors = async () => {
        try {
            const data = await api<User[]>('/admin/ambassadors/list/');
            setAmbassadors(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: number) => {
        setTogglingId(id);
        setAmbassadors((prev) =>
            prev.map((amb) =>
                amb.id === id ? { ...amb, is_active: !amb.is_active } : amb
            )
        );

        try {
            await api(`/admin/ambassadors/${id}/toggle/`, { method: 'PATCH' });
            await loadAmbassadors();
        } catch (e) {
            console.error("Failed to toggle ambassador: ", e);

            setAmbassadors((prev) =>
                prev.map((amb) =>
                    amb.id === id ? { ...amb, is_active: !amb.is_active } : amb
                )
            );
            alert("Failed to update ambassador status. Please try again.");
        } finally {
            setTogglingId(null);
            setConfirmToggle(null);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    const activeCount = ambassadors.filter((a) => a.is_active).length;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Ambassadors</h1>
                    <p className="text-neutral-500 mt-1">
                        {ambassadors.length} total • {activeCount} active
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Ambassador
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Ambassadors</CardTitle>
                </CardHeader>
                <CardContent>
                    {ambassadors.length === 0 ? (
                        <div className="text-center py-12">
                            <UserPlus className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-500 mb-1">No ambassadors yet</p>
                            <p className="text-sm text-neutral-400">
                                Create your first ambassador to get started
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ambassadors.map((amb) => (
                                    <TableRow key={amb.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-neutral-700">
                                                        {amb.full_name?.charAt(0).toUpperCase() || 'A'}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-neutral-900">
                                                    {amb.full_name || '—'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-neutral-600">{amb.email}</TableCell>
                                        <TableCell className="text-neutral-600">{amb.phone || '—'}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    amb.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-neutral-100 text-neutral-600'
                                                }
                                            >
                                                {amb.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger render={<Button variant={"ghost"} size={"icon"} />}>
                                                    {togglingId === amb.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <MoreVertical className="w-4 h-4" />
                                                    )}
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmToggle(amb);
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        {amb.is_active ? (
                                                            <>
                                                                <ToggleLeft className="w-4 h-4 mr-2" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ToggleRight className="w-4 h-4 mr-2" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog
                open={confirmToggle !== null}
                onOpenChange={(open) => {
                    if (!open) setConfirmToggle(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmToggle?.is_active ? 'Deactivate' : 'Activate'} Ambassador?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmToggle?.is_active
                                ? 'They will no longer be able to log in or check in guests.'
                                : 'They will be able to log in and access their assigned events.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (confirmToggle) {
                                    await handleToggle(confirmToggle.id);
                                }
                                setConfirmToggle(null);
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AmbassadorCreateDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={loadAmbassadors}
            />
        </div>
    );
}