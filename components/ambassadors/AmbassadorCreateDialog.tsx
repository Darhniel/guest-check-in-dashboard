'use client';

import { useState } from 'react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Copy,
    Eye,
    EyeOff,
    Loader2,
    Wand2,
} from 'lucide-react';
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
    onSuccess: () => void;
}

function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i += 1) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Lives inside `DialogContent`, so it is thrown away every time the dialog
 * closes. That gives us a clean form on open without a reset effect.
 */
function CreateAmbassadorForm({
    onDone,
    onSuccess,
}: {
    onDone: () => void;
    onSuccess: () => void;
}) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState(generatePassword);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState<{ email: string; password: string } | null>(
        null
    );
    const [copied, setCopied] = useState(false);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (!fullName.trim() || !email.trim() || !password) {
            setError('Name, email, and a temporary password are required.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Enter a valid email address.');
            return;
        }

        setLoading(true);

        try {
            await api('/admin/ambassadors/', {
                method: 'POST',
                body: JSON.stringify({
                    full_name: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    password,
                    role: 'ambassador',
                }),
            });
            setCreated({ email: email.trim(), password });
            onSuccess();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to create ambassador.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!created) return;
        try {
            await navigator.clipboard.writeText(
                `Email: ${created.email}\nPassword: ${created.password}`
            );
            setCopied(true);
            toast.add({
                type: 'success',
                title: 'Credentials copied',
                description: 'Share them with the ambassador over a secure channel.',
            });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.add({
                type: 'error',
                title: 'Could not copy',
                description: 'Select the credentials and copy them manually.',
            });
        }
    };

    if (created) {
        return (
            <>
                <DialogHeader>
                    <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-success-subtle text-success">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <DialogTitle>Ambassador created</DialogTitle>
                    <DialogDescription>
                        Share these credentials securely. The password won&apos;t be
                        shown again.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                    <div>
                        <p className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                            Email
                        </p>
                        <p className="mt-1 font-mono text-[13px] break-all">
                            {created.email}
                        </p>
                    </div>
                    <div className="border-t border-border pt-3">
                        <p className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                            Temporary password
                        </p>
                        <p className="mt-1 rounded-lg border border-border bg-card px-3 py-2 font-mono text-[13px] tracking-wide">
                            {created.password}
                        </p>
                    </div>
                </div>

                <p className="text-[12px] text-muted-foreground">
                    They&apos;ll be asked to choose a new password on first sign-in.
                </p>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCopy}>
                        {copied ? (
                            <Check className="size-4 text-success" />
                        ) : (
                            <Copy className="size-4" />
                        )}
                        {copied ? 'Copied' : 'Copy credentials'}
                    </Button>
                    <Button onClick={onDone}>Done</Button>
                </DialogFooter>
            </>
        );
    }

    return (
        <form onSubmit={handleCreate} className="space-y-5">
            <DialogHeader>
                <DialogTitle>Create ambassador</DialogTitle>
                <DialogDescription>
                    Give someone access to scan and accredit guests at assigned
                    events.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="ambassador-name">
                        Full name
                        <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="ambassador-name"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Sarah Johnson"
                        autoComplete="name"
                        autoFocus
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="ambassador-email">
                        Email
                        <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="ambassador-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="sarah@company.com"
                        autoComplete="email"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="ambassador-phone">
                        Phone
                        <span className="text-[11px] font-normal text-muted-foreground">
                            Optional
                        </span>
                    </Label>
                    <Input
                        id="ambassador-phone"
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+234 800 000 0000"
                        autoComplete="tel"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="ambassador-password">
                        Temporary password
                        <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                            <Input
                                id="ambassador-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="pr-9 font-mono text-[13px]"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={
                                    showPassword ? 'Hide password' : 'Show password'
                                }
                                className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                {showPassword ? (
                                    <EyeOff className="size-3.5" />
                                ) : (
                                    <Eye className="size-3.5" />
                                )}
                            </button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setPassword(generatePassword());
                                setShowPassword(true);
                            }}
                            aria-label="Generate a new password"
                        >
                            <Wand2 className="size-4" />
                            <span className="max-sm:sr-only">Generate</span>
                        </Button>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground">
                        They&apos;ll be prompted to change this on first sign-in.
                    </p>
                </div>

                {error ? (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive"
                    >
                        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                        {error}
                    </div>
                ) : null}
            </div>

            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onDone}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Create ambassador
                </Button>
            </DialogFooter>
        </form>
    );
}

export function AmbassadorCreateDialog({ open, onOpenChange, onSuccess }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <CreateAmbassadorForm
                    onDone={() => onOpenChange(false)}
                    onSuccess={onSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}
