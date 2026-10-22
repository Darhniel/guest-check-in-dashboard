'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
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
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Updates the signed-in user's own password via
 * `POST /auth/change-password/`.
 */
export function ChangePasswordDialog({ open, onOpenChange }: Props) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClose = (next: boolean) => {
        if (!next) {
            setOldPassword('');
            setNewPassword('');
            setConfirm('');
            setError('');
            setShowNew(false);
        }
        onOpenChange(next);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!oldPassword || !newPassword) {
            setError('Fill in both fields.');
            return;
        }
        if (newPassword.length < 8) {
            setError('The new password needs at least 8 characters.');
            return;
        }
        if (newPassword !== confirm) {
            setError('The two new passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api('/auth/change-password/', {
                method: 'PATCH',
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                }),
            });
            toast.add({
                type: 'success',
                title: 'Password updated',
                description: 'Use the new password the next time you sign in.',
            });
            handleClose(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'We could not update your password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Change password</DialogTitle>
                        <DialogDescription>
                            Confirm your current password, then choose a new
                            one.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Label htmlFor="current-password">
                            Current password
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="current-password"
                            type="password"
                            value={oldPassword}
                            onChange={(event) =>
                                setOldPassword(event.target.value)
                            }
                            autoComplete="current-password"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="new-password">
                            New password
                            <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(event.target.value)
                                }
                                autoComplete="new-password"
                                className="pr-9"
                            />
                            <button
                                type="button"
                                aria-label={
                                    showNew ? 'Hide password' : 'Show password'
                                }
                                onClick={() => setShowNew((value) => !value)}
                                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {showNew ? (
                                    <EyeOff className="size-3.5" />
                                ) : (
                                    <Eye className="size-3.5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="confirm-password">
                            Confirm new password
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="confirm-password"
                            type={showNew ? 'text' : 'password'}
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                            autoComplete="new-password"
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
                                <KeyRound className="size-4" />
                            )}
                            Update password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
