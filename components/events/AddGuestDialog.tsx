'use client';

import { useRef, useState } from 'react';
import { Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import type {
    GuestCreateResponse,
    GuestCategory,
    ReportCustomField,
} from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: number;
    categories: GuestCategory[];
    customFields: ReportCustomField[];
    onCreated: (guest: GuestCreateResponse) => void;
}

interface KidRow {
    key: number;
    name: string;
    age: string;
    gender: string;
}

const EMPTY_FORM = {
    names: '',
    email: '',
    phone: '',
    category: '',
    spouse: '',
    nanny: '',
    nannyCount: '',
    allergies: '',
};

function customInputType(type?: string) {
    switch (type) {
        case 'number':
            return 'number';
        case 'date':
            return 'date';
        case 'email':
            return 'email';
        case 'phone':
            return 'tel';
        default:
            return 'text';
    }
}

export function AddGuestDialog({
    open,
    onOpenChange,
    eventId,
    categories,
    customFields,
    onCreated,
}: Props) {
    const nextKidKey = useRef(1);
    const [form, setForm] = useState(EMPTY_FORM);
    const [kids, setKids] = useState<KidRow[]>([]);
    const [custom, setCustom] = useState<Record<string, string | boolean>>({});
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const update = (field: keyof typeof EMPTY_FORM, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setError('');
    };

    const addKid = () => {
        setKids((current) => [
            ...current,
            { key: nextKidKey.current++, name: '', age: '', gender: '' },
        ]);
        setError('');
    };

    const updateKid = (key: number, field: keyof KidRow, value: string) => {
        setKids((current) =>
            current.map((kid) =>
                kid.key === key ? { ...kid, [field]: value } : kid
            )
        );
        setError('');
    };

    const updateCustom = (key: string, value: string | boolean) => {
        setCustom((current) => ({ ...current, [key]: value }));
        setError('');
    };

    const removeKid = (key: number) => {
        setKids((current) => current.filter((kid) => kid.key !== key));
        setError('');
    };

    const reset = () => {
        setForm(EMPTY_FORM);
        setKids([]);
        setCustom({});
        setError('');
        setSaving(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            if (saving) return;
            reset();
        }
        onOpenChange(next);
    };

    /** Client-side mirror of the API rule: name plus email or phone. */
    const validate = (): string => {
        if (!form.names.trim()) {
            return 'Enter the guest\u2019s name.';
        }
        const email = form.email.trim();
        const phone = form.phone.trim();
        if (!email && !phone) {
            return 'Add an email address or a phone number so the guest can be reached.';
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'That email address does not look right.';
        }
        if (phone && phone.length > 20) {
            return 'Phone numbers can be at most 20 characters.';
        }
        if (form.nannyCount.trim()) {
            const count = Number(form.nannyCount);
            if (!Number.isInteger(count) || count < 0) {
                return 'Nanny count must be a whole number (0 or more).';
            }
        }

        for (const field of customFields) {
            const value = custom[field.key];
            if (field.required && (value === undefined || value === '')) {
                return `${field.label} is required.`;
            }
        }

        for (const [index, kid] of filledKids().entries()) {
            if (!kid.name) {
                return `Child ${index + 1}: enter a name.`;
            }
            if (!kid.age) {
                return `Child ${index + 1}: enter an age.`;
            }
            const age = Number(kid.age);
            if (!Number.isInteger(age) || age < 0 || age > 120) {
                return `Child ${index + 1}: enter an age between 0 and 120.`;
            }
        }
        return '';
    };

    /** Rows the user started filling in; untouched rows are ignored. */
    const filledKids = () =>
        kids
            .map((kid) => ({
                ...kid,
                name: kid.name.trim(),
                age: kid.age.trim(),
            }))
            .filter((kid) => kid.name || kid.age || kid.gender);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const problem = validate();
        if (problem) {
            setError(problem);
            return;
        }

        setError('');
        setSaving(true);

        const customData: Record<string, unknown> = {};
        for (const field of customFields) {
            const value = custom[field.key];
            if (field.type === 'checkbox') {
                customData[field.key] = value === true;
            } else if (typeof value === 'string' && value.trim()) {
                customData[field.key] = value.trim();
            }
        }

        try {
            const guest = await api<GuestCreateResponse>(
                `/admin/events/${eventId}/guests/`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        names: form.names.trim(),
                        email: form.email.trim(),
                        phone: form.phone.trim(),
                        category_name: form.category.trim(),
                        spouse_name: form.spouse.trim(),
                        nanny_name: form.nanny.trim(),
                        nanny_count: form.nannyCount.trim()
                            ? Number(form.nannyCount)
                            : 0,
                        allergies: form.allergies.trim(),
                        custom_data: customData,
                        kids: filledKids().map((kid) => ({
                            name: kid.name,
                            age: Number(kid.age),
                            gender: kid.gender.trim(),
                        })),
                    }),
                }
            );

            toast.add({
                type: 'success',
                title: 'Guest added',
                description: `${guest.names} is now on the guest register.`,
            });
            onCreated(guest);
            reset();
            onOpenChange(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Could not add this guest. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="size-4" />
                        Add guest
                    </DialogTitle>
                    <DialogDescription>
                        Enter the guest&apos;s details and we&apos;ll add them
                        to this event. A name plus an email address or a phone
                        number is required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="guest-names">
                                Guest name{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="guest-names"
                                value={form.names}
                                onChange={(event) =>
                                    update('names', event.target.value)
                                }
                                placeholder="e.g. Ada Obi and Chidi Obi"
                                autoFocus
                                disabled={saving}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="guest-email">Email</Label>
                            <Input
                                id="guest-email"
                                type="email"
                                value={form.email}
                                onChange={(event) =>
                                    update('email', event.target.value)
                                }
                                placeholder="guest@example.com"
                                autoComplete="off"
                                disabled={saving}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="guest-phone">Phone</Label>
                            <Input
                                id="guest-phone"
                                type="tel"
                                value={form.phone}
                                onChange={(event) =>
                                    update('phone', event.target.value)
                                }
                                placeholder="+234 802 555 0100"
                                maxLength={20}
                                autoComplete="off"
                                disabled={saving}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Email or phone — at least one is needed.
                            </p>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="guest-category">Category</Label>
                            <Input
                                id="guest-category"
                                list="guest-category-options"
                                value={form.category}
                                onChange={(event) =>
                                    update('category', event.target.value)
                                }
                                placeholder="e.g. Platinum"
                                autoComplete="off"
                                disabled={saving}
                            />
                            <datalist id="guest-category-options">
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.name}
                                    />
                                ))}
                            </datalist>
                            <p className="text-[11px] text-muted-foreground">
                                Pick an existing category or type a new one —
                                new categories are created for this event.
                            </p>
                        </div>
                    </div>

                    {customFields.length > 0 ? (
                        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                            <div>
                                <p className="text-[12.5px] font-medium">
                                    Event details
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Extra information this event collects for
                                    every guest.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {customFields.map((field) => {
                                    const value = custom[field.key];

                                    if (field.type === 'checkbox') {
                                        return (
                                            <label
                                                key={field.key}
                                                className="flex items-center gap-2 self-end text-[12.5px] font-medium"
                                            >
                                                <Checkbox
                                                    checked={value === true}
                                                    onCheckedChange={(checked) =>
                                                        updateCustom(
                                                            field.key,
                                                            checked === true
                                                        )
                                                    }
                                                    disabled={saving}
                                                />
                                                {field.label}
                                                {field.required ? (
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                ) : null}
                                            </label>
                                        );
                                    }

                                    const listId = `guest-custom-options-${field.key}`;

                                    return (
                                        <div
                                            key={field.key}
                                            className={
                                                field.type === 'textarea'
                                                    ? 'space-y-1.5 sm:col-span-2'
                                                    : 'space-y-1.5'
                                            }
                                        >
                                            <Label
                                                htmlFor={`guest-custom-${field.key}`}
                                            >
                                                {field.label}
                                                {field.required ? (
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                ) : null}
                                            </Label>
                                            {field.type === 'textarea' ? (
                                                <Textarea
                                                    id={`guest-custom-${field.key}`}
                                                    value={
                                                        typeof value === 'string'
                                                            ? value
                                                            : ''
                                                    }
                                                    onChange={(event) =>
                                                        updateCustom(
                                                            field.key,
                                                            event.target.value
                                                        )
                                                    }
                                                    rows={2}
                                                    disabled={saving}
                                                />
                                            ) : (
                                                <Input
                                                    id={`guest-custom-${field.key}`}
                                                    type={customInputType(
                                                        field.type
                                                    )}
                                                    list={
                                                        field.type === 'dropdown'
                                                            ? listId
                                                            : undefined
                                                    }
                                                    value={
                                                        typeof value === 'string'
                                                            ? value
                                                            : ''
                                                    }
                                                    onChange={(event) =>
                                                        updateCustom(
                                                            field.key,
                                                            event.target.value
                                                        )
                                                    }
                                                    autoComplete="off"
                                                    disabled={saving}
                                                />
                                            )}
                                            {field.type === 'dropdown' &&
                                            field.options?.length ? (
                                                <datalist id={listId}>
                                                    {field.options.map(
                                                        (option) => (
                                                            <option
                                                                key={option}
                                                                value={option}
                                                            />
                                                        )
                                                    )}
                                                </datalist>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-[12.5px] font-medium">
                                    Children
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Optional — add each child on their own row.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addKid}
                                disabled={saving}
                            >
                                <Plus className="size-3.5" />
                                Add child
                            </Button>
                        </div>

                        {kids.length > 0 ? (
                            <div className="space-y-2">
                                {kids.map((kid, index) => (
                                    <div
                                        key={kid.key}
                                        className="grid grid-cols-[1fr_5.5rem_auto] items-center gap-2 sm:grid-cols-[1fr_5.5rem_7rem_auto]"
                                    >
                                        <Input
                                            value={kid.name}
                                            onChange={(event) =>
                                                updateKid(
                                                    kid.key,
                                                    'name',
                                                    event.target.value
                                                )
                                            }
                                            placeholder={`Child ${index + 1} name`}
                                            aria-label={`Child ${index + 1} name`}
                                            disabled={saving}
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            value={kid.age}
                                            onChange={(event) =>
                                                updateKid(
                                                    kid.key,
                                                    'age',
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Age"
                                            aria-label={`Child ${index + 1} age`}
                                            disabled={saving}
                                        />
                                        <Input
                                            className="hidden sm:block"
                                            value={kid.gender}
                                            onChange={(event) =>
                                                updateKid(
                                                    kid.key,
                                                    'gender',
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Gender"
                                            aria-label={`Child ${index + 1} gender`}
                                            disabled={saving}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => removeKid(kid.key)}
                                            aria-label={`Remove child ${index + 1}`}
                                            disabled={saving}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="guest-spouse">
                                Spouse / partner
                            </Label>
                            <Input
                                id="guest-spouse"
                                value={form.spouse}
                                onChange={(event) =>
                                    update('spouse', event.target.value)
                                }
                                placeholder="Optional"
                                disabled={saving}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="guest-nanny">Nanny</Label>
                            <Input
                                id="guest-nanny"
                                value={form.nanny}
                                onChange={(event) =>
                                    update('nanny', event.target.value)
                                }
                                placeholder="Optional"
                                disabled={saving}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="guest-nanny-count">Nanny count</Label>
                            <Input
                                id="guest-nanny-count"
                                type="number"
                                min={0}
                                value={form.nannyCount}
                                onChange={(event) =>
                                    update('nannyCount', event.target.value)
                                }
                                placeholder="0"
                                disabled={saving}
                            />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="guest-allergies">Allergies</Label>
                            <Textarea
                                id="guest-allergies"
                                value={form.allergies}
                                onChange={(event) =>
                                    update('allergies', event.target.value)
                                }
                                placeholder="Anything the team should know — optional"
                                rows={2}
                                disabled={saving}
                            />
                        </div>
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
                            variant="ghost"
                            onClick={() => handleOpenChange(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Adding…
                                </>
                            ) : (
                                <>
                                    <UserPlus className="size-4" />
                                    Add guest
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
