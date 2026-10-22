'use client';

import { useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import type { User } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';

interface Props {
    ambassador: User | null;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

/**
 * Edits an ambassador's name and phone via
 * `PATCH /admin/ambassadors/{id}/`. The email is intentionally not
 * editable — it is the account's login identity.
 */
export function AmbassadorEditDialog({
    ambassador,
    onOpenChange,
    onSuccess,
}: Props) {
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [initializedFor, setInitializedFor] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Seed the fields with the current values when the dialog opens
    // for a given ambassador.
    if (ambassador && initializedFor !== ambassador.id) {
        setFullName(ambassador.full_name || '');
        setPhone(ambassador.phone || '');
        setInitializedFor(ambassador.id);
        setError('');
    }

    const handleClose = (next: boolean) => {
        if (!next) {
            setInitializedFor(null);
            setError('');
        }
        onOpenChange(next);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!ambassador) return;

        const name = fullName.trim();
        if (!name) {
            setError('The name cannot be empty.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api(`/admin/ambassadors/${ambassador.id}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    full_name: name,
                    phone: phone.trim(),
                }),
            });
            toast.add({
                type: 'success',
                title: 'Ambassador updated',
                description: `${name}'s details were saved.`,
            });
            onSuccess();
            handleClose(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'We could not save these details. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={ambassador !== null}
            onOpenChange={handleClose}
        >
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Edit ambassador</DialogTitle>
                        <DialogDescription>
                            Update details for{' '}
                            {ambassador?.full_name || ambassador?.email}. The
                            email is the sign-in identity and cannot be
                            changed here.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Label htmlFor="ambassador-full-name">
                            Full name
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="ambassador-full-name"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="e.g. Samuel Boateng"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="ambassador-phone">Phone</Label>
                        <Input
                            id="ambassador-phone"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="e.g. +233 20 449 1187"
                        />
                    </div>

                    {error ? (
                        <p
                            role="alert"
                            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive"
                        >
                            {error}
                        </p>
                    ) : null}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleClose(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Pencil className="size-4" />
                            )}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
