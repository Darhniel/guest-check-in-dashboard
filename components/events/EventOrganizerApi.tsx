'use client';

import { useState } from 'react';
import {
    AlertCircle,
    ArrowUpRight,
    Check,
    Copy,
    KeyRound,
    Loader2,
    Plus,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import type { OrganizerApiKey, OrganizerApiKeyCreateResponse } from '@/types';
import { api, API_BASE_URL } from '@/lib/api';
import { useApiQuery } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/lib/format';

interface Props {
    eventId: number;
}

function CopyButton({ value, label }: { value: string; label: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(value);
                    setCopied(true);
                    toast.add({
                        type: 'success',
                        title: 'Copied',
                        description: `${label} is on your clipboard.`,
                    });
                    setTimeout(() => setCopied(false), 2000);
                } catch {
                    toast.add({
                        type: 'error',
                        title: 'Could not copy',
                        description: 'Select it and copy manually.',
                    });
                }
            }}
        >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : label}
        </Button>
    );
}

/** Shown once, right after a key is created. Never retrievable again. */
function RevealSection({ created }: { created: OrganizerApiKeyCreateResponse }) {
    return (
        <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-400/30 dark:bg-amber-400/5">
            <p className="text-[11.5px] font-medium text-foreground">
                API key — shown only once
            </p>
            <code className="block rounded-lg border border-amber-500/30 bg-card px-3 py-2.5 font-mono text-[12.5px] break-all text-foreground">
                {created.api_key}
            </code>
            <p className="text-[11.5px] text-muted-foreground">
                The backend stores only a hash of this value. Send it to{' '}
                <span className="font-medium text-foreground">
                    {created.organizer_name}
                </span>{' '}
                over a secure channel (not a public thread), and remind them to
                store it in a secrets manager. You can revoke it any time if it
                leaks.
            </p>
        </div>
    );
}

function requestExample(eventId: number) {
    return `curl -X POST \\
  "${API_BASE_URL}/organizers/events/${eventId}/guests/bulk/" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "guests": [
      {
        "adult_names": "Ada Obi",
        "email": "ada@example.com",
        "phone": "+234 801 234 5678",
        "category_name": "VIP",
        "kids": [{ "name": "Tobi Obi", "age": 6, "gender": "M" }]
      }
    ]
  }'`;
}

export function EventOrganizerApi({ eventId }: Props) {
    const { data, loading, error, refetch } = useApiQuery<OrganizerApiKey[]>(
        `/admin/events/${eventId}/api-keys/`
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [revoking, setRevoking] = useState<OrganizerApiKey | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    const endpoint = `${API_BASE_URL}/organizers/events/${eventId}/guests/bulk/`;
    const keys = data ?? [];
    const activeCount = keys.filter((key) => key.is_active).length;

    const handleRevoke = async (key: OrganizerApiKey) => {
        setBusyId(key.id);
        try {
            await api(`/admin/events/${eventId}/api-keys/${key.id}/`, {
                method: 'DELETE',
            });
            await refetch();
            toast.add({
                type: 'success',
                title: 'API key revoked',
                description: 'Requests signed with this key are rejected immediately.',
            });
        } catch (err) {
            toast.add({
                type: 'error',
                title: 'Could not revoke key',
                description: err instanceof Error ? err.message : 'Please try again.',
            });
        } finally {
            setBusyId(null);
            setRevoking(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-[180px] rounded-xl" />
                <Skeleton className="h-[240px] rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <section className="animate-enter rounded-xl bg-card shadow-card ring-1 ring-border">
                <div className="border-b border-border px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-2.5">
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                        <h2 className="text-[15px] font-semibold">
                            Connect the guest list
                        </h2>
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                        Share the endpoint with the event organizer, then send
                        them an API key below. The key only works for{' '}
                        <span className="text-foreground">this event</span> and
                        only for guests endpoints.
                    </p>
                </div>

                <div className="space-y-4 px-4 py-4 sm:px-5">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                                Endpoint
                            </p>
                            <CopyButton value={endpoint} label="Copy endpoint" />
                        </div>
                        <code className="block overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2.5 font-mono text-[12.5px] text-foreground">
                            POST {endpoint}
                        </code>
                    </div>

                    <details className="group rounded-lg border border-border bg-muted/30">
                        <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-[12.5px] font-medium text-muted-foreground select-none hover:text-foreground">
                            Example request (curl)
                            <span className="text-[11px] transition-transform group-open:rotate-180">
                                ▾
                            </span>
                        </summary>
                        <pre className="overflow-x-auto border-t border-border px-3 py-3 font-mono text-[11.5px] leading-relaxed text-foreground">
                            {requestExample(eventId)}
                        </pre>
                    </details>

                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-[11.5px] text-muted-foreground">
                        <ShieldCheck className="size-4 shrink-0 text-success" />
                        <span>
                            New keys are shown once and stored hashed. Guests
                            without emails are matched by name, so every
                            attendee is captured.
                        </span>
                    </div>
                </div>
            </section>

            <section className="animate-enter overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-border">
                <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex items-center gap-2.5">
                        <KeyRound className="size-4 text-muted-foreground" />
                        <h2 className="text-[15px] font-semibold">API keys</h2>
                        {keys.length > 0 ? (
                            <StatusBadge
                                label={`${activeCount} active`}
                                tone={activeCount > 0 ? 'success' : 'neutral'}
                            />
                        ) : null}
                    </div>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4" />
                        Generate key
                    </Button>
                </div>

                <div className="px-4 py-4 sm:px-5">
                    {error ? (
                        <ErrorState
                            description={error}
                            onRetry={() => void refetch()}
                        />
                    ) : keys.length === 0 ? (
                        <EmptyState
                            compact
                            icon={<KeyRound />}
                            title="No API keys yet"
                            description="Generate a key so the organizer can push their guest list straight into this event."
                            action={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCreateOpen(true)}
                                >
                                    <Plus className="size-3.5" />
                                    Generate key
                                </Button>
                            }
                        />
                    ) : (
                        <div className="space-y-2">
                            {keys.map((key) => (
                                <div
                                    key={key.id}
                                    className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors duration-150 hover:bg-muted/40 sm:flex-row sm:items-center"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-[13px] font-medium">
                                                {key.organizer_name}
                                            </p>
                                            <StatusBadge
                                                label={key.is_active ? 'Active' : 'Revoked'}
                                                tone={key.is_active ? 'success' : 'neutral'}
                                            />
                                        </div>
                                        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                                            {key.key_prefix}
                                            {'•'.repeat(12)}
                                        </p>
                                    </div>

                                    <dl className="flex shrink-0 items-center gap-4 text-[11.5px] text-muted-foreground">
                                        <div>
                                            <dt className="sr-only">Created</dt>
                                            <dd>
                                                Created{' '}
                                                {formatDate(key.created_at, 'MMM d')}
                                            </dd>
                                        </div>
                                        <div className="min-w-[88px]">
                                            <dt className="sr-only">Last used</dt>
                                            <dd>
                                                {key.last_used
                                                    ? `Used ${formatDate(key.last_used, 'MMM d p')}`
                                                    : 'Never used'}
                                            </dd>
                                        </div>
                                    </dl>

                                    {key.is_active ? (
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Revoke key for ${key.organizer_name}`}
                                            title="Revoke key"
                                            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setRevoking(key)}
                                            disabled={busyId !== null}
                                        >
                                            {busyId === key.id ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="size-4" />
                                            )}
                                        </Button>
                                    ) : (
                                        <span className="flex size-7 shrink-0" aria-hidden />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <GenerateKeyDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                eventId={eventId}
                onSuccess={() => void refetch()}
            />

            <AlertDialog
                open={revoking !== null}
                onOpenChange={(next) => {
                    if (!next) setRevoking(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {revoking?.organizer_name} will immediately lose
                            access to push guests for this event. They will
                            need a brand new key to reconnect.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busyId !== null}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={busyId !== null}
                            onClick={(event) => {
                                event.preventDefault();
                                if (revoking) void handleRevoke(revoking);
                            }}
                        >
                            {busyId !== null ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            Revoke key
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

/**
 * Owns the create flow. Lives inside `DialogContent`, so closing the dialog
 * discards the one-time key view along with it.
 */
function GenerateKeyDialog({
    open,
    onOpenChange,
    eventId,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: number;
    onSuccess: () => void;
}) {
    const [organizerName, setOrganizerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState<OrganizerApiKeyCreateResponse | null>(
        null
    );

    const endpoint = `${API_BASE_URL}/organizers/events/${eventId}/guests/bulk/`;

    const handleCreate = async (formEvent: React.FormEvent) => {
        formEvent.preventDefault();
        const name = organizerName.trim();
        if (!name) {
            setError('Give the organizer a recognisable name.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const createdKey = await api<OrganizerApiKeyCreateResponse>(
                `/admin/events/${eventId}/api-keys/`,
                {
                    method: 'POST',
                    body: JSON.stringify({ organizer_name: name }),
                }
            );
            setCreated(createdKey);
            onSuccess();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'We could not create an API key. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = (next: boolean) => {
        if (!next) {
            setOrganizerName('');
            setError('');
            setCreated(null);
        }
        onOpenChange(next);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                {created ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <KeyRound className="size-4" />
                                API key created
                            </DialogTitle>
                            <DialogDescription>
                                Copy both values now — the key will never be
                                shown or retrievable again.
                            </DialogDescription>
                        </DialogHeader>

                        <RevealSection created={created} />

                        <div className="space-y-2">
                            <p className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                                Endpoint
                            </p>
                            <code className="block overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2.5 font-mono text-[12.5px] break-all">
                                POST {endpoint}
                            </code>
                        </div>

                        <DialogFooter>
                            <CopyButton
                                value={`${API_BASE_URL}/organizers/events/${eventId}/guests/bulk/`}
                                label="Copy endpoint"
                            />
                            <CopyButton
                                value={created.api_key}
                                label="Copy API key"
                            />
                            <Button variant="ghost" onClick={() => handleClose(false)}>
                                Done
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <form onSubmit={handleCreate} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>Generate API key</DialogTitle>
                            <DialogDescription>
                                The key lets this organizer push their guest
                                list for{' '}
                                <span className="text-foreground">
                                    this event only
                                </span>
                                . Nothing else.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-1.5">
                            <Label htmlFor="organizer-name">
                                Organizer name
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="organizer-name"
                                value={organizerName}
                                onChange={(event) =>
                                    setOrganizerName(event.target.value)
                                }
                                placeholder="e.g. wristbands plus · Wristbandsng"
                                autoFocus
                            />
                            <p className="text-[11.5px] text-muted-foreground">
                                Shown next to the key so you know who it
                                belongs to.
                            </p>
                        </div>

                        <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5 text-[11.5px] text-muted-foreground">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            <p>
                                The full key is displayed once, right after
                                you create it. If it leaks, revoke it here and
                                generate a new one.
                            </p>
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
                                Generate key
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
