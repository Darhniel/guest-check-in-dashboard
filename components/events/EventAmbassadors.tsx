'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Loader2, Users as UsersIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
    eventId: number;
}

export function EventAmbassadors({ eventId }: Props) {
    const [assigned, setAssigned] = useState<User[]>([]);
    const [allAmbassadors, setAllAmbassadors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadData();
    }, [eventId]);

    // const loadData = async () => {
    //     setLoading(true);
    //     try {
    //         // Fetch all ambassadors
    //         const ambassadors = await api<User[]>('/admin/ambassadors/list/');
    //         setAllAmbassadors(ambassadors);

    //         // Fetch event details to get assigned users via user_access
    //         const event = await api<any>(`/events/${eventId}/`);
    //         // For now, we'll use a simple approach: fetch all ambassadors and check which are assigned
    //         // In a real app, you'd have a dedicated endpoint for this
    //         setAssigned([]); // Will be populated below
    //     } catch (e) {
    //         console.error(e);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all ambassadors
            const ambassadors = await api<User[]>('/admin/ambassadors/list/');
            setAllAmbassadors(ambassadors);

            // 2. Fetch event details to get assigned users
            const event = await api<any>(`/events/${eventId}/`);

            // ✅ FIX: Actually populate the assigned ambassadors based on your backend's response shape

            // Pattern A: Backend returns full user objects (e.g., event.ambassadors or event.assigned_ambassadors)
            if (event.ambassadors && Array.isArray(event.ambassadors)) {
                setAssigned(event.ambassadors);
            }
            else if (event.assigned_ambassadors && Array.isArray(event.assigned_ambassadors)) {
                setAssigned(event.assigned_ambassadors);
            }
            // Pattern B: Backend returns an array of assigned user IDs (e.g., event.ambassador_ids)
            else if (event.ambassador_ids && Array.isArray(event.ambassador_ids)) {
                const assignedList = ambassadors.filter((amb) =>
                    event.ambassador_ids.includes(amb.id)
                );
                setAssigned(assignedList);
            }
            else if (event.assigned_user_ids && Array.isArray(event.assigned_user_ids)) {
                const assignedList = ambassadors.filter((amb) =>
                    event.assigned_user_ids.includes(amb.id)
                );
                setAssigned(assignedList);
            }
            else {
                console.warn('⚠️ Could not find assigned ambassadors in event payload. Check backend response:', event);
                setAssigned([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (selectedIds.length === 0) return;
        setAssigning(true);
        try {
            await api(`/admin/events/${eventId}/assign-bulk/`, {
                method: 'POST',
                body: JSON.stringify({ user_ids: selectedIds }),
            });
            setDialogOpen(false);
            setSelectedIds([]);
            loadData();
        } catch (e: any) {
            console.error(e);
        } finally {
            setAssigning(false);
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4" />
                        Assigned Ambassadors
                    </CardTitle>
                    <p className="text-sm text-neutral-500 mt-1">
                        Manage who can check in guests at this event
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger render={<Button />}>
                        <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Ambassadors
                        </>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Assign Ambassadors</DialogTitle>
                            <DialogDescription>
                                Select ambassadors to grant access to this event
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2 py-4">
                            {allAmbassadors.length === 0 ? (
                                <p className="text-sm text-neutral-500 text-center py-8">
                                    No ambassadors found. Create some first.
                                </p>
                            ) : (
                                allAmbassadors.map((amb) => (
                                    <label
                                        key={amb.id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 cursor-pointer border border-neutral-200"
                                    >
                                        <Checkbox
                                            checked={selectedIds.includes(amb.id)}
                                            onCheckedChange={() => toggleSelect(amb.id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-neutral-900 truncate">
                                                {amb.full_name || amb.email}
                                            </div>
                                            <div className="text-sm text-neutral-500 truncate">{amb.email}</div>
                                        </div>
                                        {!amb.is_active && (
                                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                        )}
                                    </label>
                                ))
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                            <div className="text-sm text-neutral-500">
                                {selectedIds.length} selected
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAssign} disabled={selectedIds.length === 0 || assigning}>
                                    {assigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Assign {selectedIds.length > 0 && `(${selectedIds.length})`}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {assigned.length === 0 ? (
                    <div className="text-center py-12">
                        <UsersIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500 mb-1">No ambassadors assigned yet</p>
                        <p className="text-sm text-neutral-400">
                            Click "Assign Ambassadors" to grant access
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {assigned.map((amb) => (
                            <div
                                key={amb.id}
                                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg"
                            >
                                <div className="w-9 h-9 bg-neutral-200 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-semibold text-neutral-700">
                                        {amb.full_name?.charAt(0).toUpperCase() || 'A'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-neutral-900">
                                        {amb.full_name || amb.email}
                                    </div>
                                    <div className="text-sm text-neutral-500">{amb.email}</div>
                                </div>
                                <Badge variant={amb.is_active ? 'default' : 'secondary'}>
                                    {amb.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}