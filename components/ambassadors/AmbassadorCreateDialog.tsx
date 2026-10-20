'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Copy, Check } from 'lucide-react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AmbassadorCreateDialog({ open, onOpenChange, onSuccess }: Props) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
    };

    const handleCreate = async () => {
        if (!fullName || !email || !password) {
            setError('Please fill in all required fields');
            return;
        }
        setLoading(true);
        setError('');

        try {
            await api('/admin/ambassadors/', {
                method: 'POST',
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    phone,
                    password,
                    role: 'ambassador',
                }),
            });
            setCreated({ email, password });
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create ambassador');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!created) return;
        const text = `Login: ${created.email}\nPassword: ${created.password}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        onOpenChange(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setError('');
        setCreated(null);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                {!created ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create Ambassador</DialogTitle>
                            <DialogDescription>
                                Create a new brand ambassador account. Share the credentials securely.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Full Name *</Label>
                                <Input
                                    placeholder="Sarah Johnson"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    placeholder="sarah@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    placeholder="+234 800 000 0000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Temporary Password *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Auto-generated or type manually"
                                        className="font-mono"
                                    />
                                    <Button type="button" variant="outline" onClick={generatePassword}>
                                        Generate
                                    </Button>
                                </div>
                                <p className="text-xs text-neutral-500">
                                    The ambassador will be required to change this on first login.
                                </p>
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" onClick={handleClose} className="flex-1">
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={loading} className="flex-1">
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-green-700">✓ Ambassador Created</DialogTitle>
                            <DialogDescription>
                                Share these credentials with the ambassador securely.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
                                <div>
                                    <div className="text-xs text-neutral-500 mb-1">Email</div>
                                    <div className="font-mono text-sm text-neutral-900">{created.email}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-500 mb-1">Temporary Password</div>
                                    <div className="font-mono text-sm text-neutral-900 bg-white px-3 py-2 rounded border border-neutral-200">
                                        {created.password}
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleCopy} variant="outline" className="w-full">
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2 text-green-600" />
                                        Copied to Clipboard
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Credentials
                                    </>
                                )}
                            </Button>

                            <Button onClick={handleClose} className="w-full">
                                Done
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}