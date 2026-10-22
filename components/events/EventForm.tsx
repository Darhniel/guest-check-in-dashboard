'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import {
    AlertCircle,
    ArrowRight,
    CalendarDays,
    Check,
    Loader2,
    MapPin,
    Plus,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { CustomField, Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { CustomFieldsBuilder } from './CustomFieldsBuilder';
import { formatEventDates, formatNumber } from '@/lib/format';

const formSchema = z
    .object({
        name: z.string().min(3, 'Give the event a name of at least 3 characters.'),
        description: z.string().optional(),
        location_text: z.string().optional(),
        start_date: z.string().min(1, 'Choose a start date.'),
        end_date: z.string().min(1, 'Choose an end date.'),
        enforce_hours: z.boolean(),
        locations: z
            .array(
                z.object({
                    location_id: z.number().optional(),
                    name: z.string().min(1, 'Name this location.'),
                    description: z.string().optional(),
                    order: z.number(),
                })
            )
            .min(1, 'Add at least one accreditation point.'),
        categories: z.array(
            z.object({
                category_id: z.number().optional(),
                name: z.string().min(1, 'Name this category.'),
                color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a valid hex color.'),
                priority: z.number(),
            })
        ),
    })
    .superRefine((data, context) => {
        if (data.start_date && data.end_date && data.end_date < data.start_date) {
            context.addIssue({
                code: 'custom',
                path: ['end_date'],
                message: 'The end date must be on or after the start date.',
            });
        }
    });

type FormData = z.infer<typeof formSchema>;

const DEFAULT_COLORS = [
    '#7C3AED',
    '#F59E0B',
    '#0EA5E9',
    '#22C55E',
    '#EC4899',
    '#64748B',
];

function Section({
    index,
    title,
    description,
    action,
    children,
}: {
    index: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-border">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground tabular-nums">
                        {index}
                    </span>
                    <div>
                        <h2 className="text-[14px] font-semibold">{title}</h2>
                        {description ? (
                            <p className="mt-0.5 text-[12px] text-muted-foreground">
                                {description}
                            </p>
                        ) : null}
                    </div>
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    );
}

function fieldError(message?: string) {
    return message ? (
        <p role="alert" className="text-[11.5px] text-destructive">
            {message}
        </p>
    ) : null;
}

export function EventForm({ event }: { event?: Event }) {
    const isEditing = Boolean(event);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [customFieldsSchema, setCustomFieldsSchema] = useState<{
        fields: CustomField[];
    }>(() => {
        const schema = event?.custom_fields_schema;
        return Array.isArray(schema?.fields) ? { fields: schema.fields } : { fields: [] };
    });
    const [dailySchedule, setDailySchedule] = useState<
        Record<string, { start: string; end: string }>
    >(() =>
        event?.daily_schedule && typeof event.daily_schedule === 'object'
            ? event.daily_schedule
            : {}
    );

    const {
        register,
        control,
        handleSubmit,
        setValue,
        setFocus,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: event?.name ?? '',
            description: event?.description ?? '',
            location_text: event?.location_text ?? '',
            start_date: event?.start_date ?? '',
            end_date: event?.end_date ?? '',
            enforce_hours: event?.enforce_hours ?? true,
            locations:
                event?.locations?.length
                    ? event.locations.map((location, index) => ({
                          location_id: location.id,
                          name: location.name,
                          description: location.description ?? '',
                          order: location.order ?? index,
                      }))
                    : [{ name: '', description: '', order: 0 }],
            categories:
                event?.categories?.length
                    ? event.categories.map((category) => ({
                          category_id: category.id,
                          name: category.name,
                          color: category.color,
                          priority: category.priority,
                      }))
                    : [
                          { name: 'VVIP', color: '#7C3AED', priority: 3 },
                          { name: 'VIP', color: '#F59E0B', priority: 2 },
                          { name: 'Regular', color: '#64748B', priority: 1 },
                      ],
        },
    });

    const {
        fields: locationFields,
        append: appendLocation,
        remove: removeLocation,
    } = useFieldArray({ control, name: 'locations' });

    const {
        fields: categoryFields,
        append: appendCategory,
        remove: removeCategory,
    } = useFieldArray({ control, name: 'categories' });

    const startDate = useWatch({ control, name: 'start_date' });
    const endDate = useWatch({ control, name: 'end_date' });
    const eventName = useWatch({ control, name: 'name' });
    const locationText = useWatch({ control, name: 'location_text' });
    const enforceHours = useWatch({ control, name: 'enforce_hours' });

    const daysList = useMemo(() => {
        if (!startDate || !endDate || endDate < startDate) return [];
        try {
            return eachDayOfInterval({
                start: parseISO(startDate),
                end: parseISO(endDate),
            });
        } catch {
            return [];
        }
    }, [startDate, endDate]);

    const updateSchedule = (date: string, field: 'start' | 'end', value: string) => {
        setDailySchedule((previous) => ({
            ...previous,
            [date]: {
                start: previous[date]?.start || '09:00',
                end: previous[date]?.end || '18:00',
                [field]: value,
            },
        }));
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError('');

        try {
            const resolvedSchedule = enforceHours
                ? Object.fromEntries(
                      daysList.map((date) => {
                          const key = format(date, 'yyyy-MM-dd');
                          return [
                              key,
                              dailySchedule[key] ?? { start: '09:00', end: '18:00' },
                          ];
                      })
                  )
                : {};

            const { locations, categories, ...eventFields } = data;
            const payload = {
                ...eventFields,
                locations: locations.map(({ location_id, ...location }) => ({
                    ...location,
                    ...(location_id ? { id: location_id } : {}),
                })),
                categories: categories.map(({ category_id, ...category }) => ({
                    ...category,
                    ...(category_id ? { id: category_id } : {}),
                })),
                daily_schedule: resolvedSchedule,
                custom_fields_schema: customFieldsSchema,
            };

            await api(isEditing && event ? `/events/${event.id}/` : '/events/', {
                method: isEditing ? 'PATCH' : 'POST',
                body: JSON.stringify(payload),
            });

            toast.add({
                type: 'success',
                title: isEditing ? 'Event updated' : 'Event created',
                description: isEditing
                    ? `${data.name} has been updated.`
                    : `${data.name} is ready. Assign ambassadors next.`,
            });
            router.push(
                isEditing && event
                    ? `/dashboard/events/${event.id}`
                    : '/dashboard/events'
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : isEditing
                      ? 'We could not update this event. Please try again.'
                      : 'We could not create this event. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * BACK END: `DELETE /events/{id}/` permanently removes the event and
     * everything attached to it — guests, categories, locations, keys.
     */
    const handleDeleteEvent = async () => {
        if (!event) return;
        setDeleting(true);

        try {
            await api(`/events/${event.id}/`, { method: 'DELETE' });
            toast.add({
                type: 'success',
                title: 'Event deleted',
                description: `${event.name} was permanently deleted.`,
            });
            router.push('/dashboard/events');
        } catch (err) {
            toast.add({
                type: 'error',
                title: 'Could not delete event',
                description:
                    err instanceof Error ? err.message : 'Please try again.',
            });
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const previewDates =
        startDate && endDate ? formatEventDates(startDate, endDate) : null;

    return (
        <form
            onSubmit={handleSubmit(onSubmit, (formErrors) => {
                const first = Object.keys(formErrors)[0];
                if (first) setFocus(first as keyof FormData);
            })}
            className="mx-auto max-w-5xl"
        >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
                <div className="space-y-4">
                    <Section
                        index="01"
                        title="The basics"
                        description="What the event is and when it happens."
                    >
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">
                                    Event name
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Tech Conference 2026"
                                    aria-invalid={Boolean(errors.name)}
                                    {...register('name')}
                                />
                                {fieldError(errors.name?.message)}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    placeholder="A short description your team will recognise…"
                                    {...register('description')}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="location_text">Venue</Label>
                                <Input
                                    id="location_text"
                                    placeholder="Eko Convention Centre, Lagos"
                                    {...register('location_text')}
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="start_date">
                                        Start date
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        aria-invalid={Boolean(errors.start_date)}
                                        {...register('start_date')}
                                    />
                                    {fieldError(errors.start_date?.message)}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="end_date">
                                        End date
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        min={startDate || undefined}
                                        aria-invalid={Boolean(errors.end_date)}
                                        {...register('end_date')}
                                    />
                                    {fieldError(errors.end_date?.message)}
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section
                        index="02"
                        title="Daily check-in hours"
                        description="Limit accreditation to an operating window."
                        action={
                            <div className="flex items-center gap-2.5 text-[12px] font-medium text-muted-foreground">
                                <Switch
                                    checked={enforceHours}
                                    onCheckedChange={(checked) =>
                                        setValue('enforce_hours', checked)
                                    }
                                    aria-label="Enforce check-in hours"
                                />
                                {enforceHours ? 'Enforced' : 'Anytime'}
                            </div>
                        }
                    >
                        {!enforceHours ? (
                            <div className="rounded-lg bg-muted/50 px-3.5 py-3 text-[12.5px] text-muted-foreground">
                                Guests can be accredited at any time during the event.
                                Turn this on to set a daily window.
                            </div>
                        ) : daysList.length === 0 ? (
                            <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-3 text-[12.5px] text-muted-foreground">
                                <CalendarDays className="mt-0.5 size-4 shrink-0" />
                                Choose a start and end date to configure each day.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {daysList.map((date) => {
                                    const key = format(date, 'yyyy-MM-dd');
                                    const schedule =
                                        dailySchedule[key] ?? {
                                            start: '09:00',
                                            end: '18:00',
                                        };
                                    return (
                                        <div
                                            key={key}
                                            className="flex flex-col gap-2.5 rounded-lg border border-border/70 bg-muted/30 p-3 sm:flex-row sm:items-center sm:gap-3"
                                        >
                                            <div className="sm:w-36 sm:shrink-0">
                                                <p className="text-[12.5px] font-medium">
                                                    {format(date, 'EEE, MMM d')}
                                                </p>
                                                <p className="text-[10.5px] text-muted-foreground">
                                                    Day {daysList.indexOf(date) + 1}
                                                </p>
                                            </div>
                                            <div className="flex flex-1 items-center gap-2">
                                                <Input
                                                    type="time"
                                                    aria-label={`Start time for ${format(
                                                        date,
                                                        'MMMM d'
                                                    )}`}
                                                    value={schedule.start}
                                                    onChange={(event) =>
                                                        updateSchedule(
                                                            key,
                                                            'start',
                                                            event.target.value
                                                        )
                                                    }
                                                    className="h-9 flex-1 tabular-nums"
                                                />
                                                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                                                <Input
                                                    type="time"
                                                    aria-label={`End time for ${format(
                                                        date,
                                                        'MMMM d'
                                                    )}`}
                                                    value={schedule.end}
                                                    onChange={(event) =>
                                                        updateSchedule(
                                                            key,
                                                            'end',
                                                            event.target.value
                                                        )
                                                    }
                                                    className="h-9 flex-1 tabular-nums"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Section>

                    <Section
                        index="03"
                        title="Accreditation points"
                        description="Where ambassadors will scan guests in."
                        action={
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    appendLocation({
                                        name: '',
                                        description: '',
                                        order: locationFields.length,
                                    })
                                }
                            >
                                <Plus className="size-3.5" />
                                Add
                            </Button>
                        }
                    >
                        <div className="space-y-2.5">
                            {locationFields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="rounded-lg border border-border/70 bg-muted/30 p-3"
                                >
                                    {typeof field.location_id === 'number' ? (
                                        <input
                                            type="hidden"
                                            {...register(
                                                `locations.${index}.location_id`,
                                                { valueAsNumber: true }
                                            )}
                                        />
                                    ) : null}
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                                            <MapPin className="size-3" />
                                            Location {index + 1}
                                        </span>
                                        {locationFields.length > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => removeLocation(index)}
                                                aria-label={`Remove location ${
                                                    index + 1
                                                }`}
                                                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <Input
                                            placeholder="e.g. Main entrance"
                                            aria-label={`Location ${index + 1} name`}
                                            aria-invalid={Boolean(
                                                errors.locations?.[index]?.name
                                            )}
                                            {...register(`locations.${index}.name`)}
                                        />
                                        <Input
                                            placeholder="Description (optional)"
                                            aria-label={`Location ${
                                                index + 1
                                            } description`}
                                            {...register(
                                                `locations.${index}.description`
                                            )}
                                        />
                                    </div>
                                    {fieldError(errors.locations?.[index]?.name?.message)}
                                </div>
                            ))}
                            {fieldError(errors.locations?.root?.message)}
                        </div>
                    </Section>

                    <Section
                        index="04"
                        title="Guest categories"
                        description="Tiers used on badges and access rules."
                        action={
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    appendCategory({
                                        name: '',
                                        color: DEFAULT_COLORS[
                                            categoryFields.length % DEFAULT_COLORS.length
                                        ],
                                        priority: 0,
                                    })
                                }
                            >
                                <Plus className="size-3.5" />
                                Add
                            </Button>
                        }
                    >
                        <div className="space-y-2.5">
                            {categoryFields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/30 p-2.5 sm:p-3"
                                >
                                    {typeof field.category_id === 'number' ? (
                                        <input
                                            type="hidden"
                                            {...register(
                                                `categories.${index}.category_id`,
                                                { valueAsNumber: true }
                                            )}
                                        />
                                    ) : null}
                                    <Controller
                                        control={control}
                                        name={`categories.${index}.color`}
                                        render={({ field: colorField }) => (
                                            <label
                                                className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/10 ring-inset transition-transform duration-150 active:scale-95 dark:ring-white/15"
                                                title="Choose category color"
                                                style={{
                                                    backgroundColor:
                                                        colorField.value ||
                                                        '#64748B',
                                                }}
                                            >
                                                <input
                                                    type="color"
                                                    aria-label={`Color for category ${
                                                        index + 1
                                                    }`}
                                                    className="absolute inset-0 size-full cursor-pointer border-0 p-0 opacity-0"
                                                    value={
                                                        colorField.value ||
                                                        '#64748B'
                                                    }
                                                    onChange={(event) =>
                                                        colorField.onChange(
                                                            event.target.value
                                                        )
                                                    }
                                                    onBlur={colorField.onBlur}
                                                    name={colorField.name}
                                                    ref={colorField.ref}
                                                />
                                            </label>
                                        )}
                                    />

                                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_88px]">
                                        <div className="min-w-0">
                                            <Input
                                                placeholder="Category name"
                                                aria-label={`Category ${
                                                    index + 1
                                                } name`}
                                                aria-invalid={Boolean(
                                                    errors.categories?.[index]
                                                        ?.name
                                                )}
                                                {...register(
                                                    `categories.${index}.name`
                                                )}
                                            />
                                            {fieldError(
                                                errors.categories?.[index]?.name
                                                    ?.message
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-muted-foreground sm:hidden">
                                                Priority
                                            </span>
                                            <div className="w-[72px] sm:w-full">
                                                <Input
                                                    type="number"
                                                    inputMode="numeric"
                                                    placeholder="Priority"
                                                    aria-label={`Priority for category ${
                                                        index + 1
                                                    }`}
                                                    className="tabular-nums"
                                                    {...register(
                                                        `categories.${index}.priority`,
                                                        { valueAsNumber: true }
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {categoryFields.length > 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => removeCategory(index)}
                                            aria-label={`Remove category ${index + 1}`}
                                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section
                        index="05"
                        title="Custom guest fields"
                        description="Extra information to capture during accreditation."
                    >
                        <CustomFieldsBuilder
                            schema={customFieldsSchema}
                            onChange={setCustomFieldsSchema}
                        />
                    </Section>

                    {error ? (
                        <div
                            role="alert"
                            className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3.5 text-[12.5px] text-destructive"
                        >
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            {error}
                        </div>
                    ) : null}
                </div>

                <aside className="space-y-4 xl:sticky xl:top-6">
                    <div className="rounded-xl bg-card p-4 shadow-card ring-1 ring-border sm:p-5">
                        <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                            <Sparkles className="size-3" />
                            Event summary
                        </div>

                        <p className="mt-3 truncate text-[15px] font-semibold">
                            {eventName?.trim() || 'Untitled event'}
                        </p>
                        <p className="mt-1 text-[11.5px] text-muted-foreground">
                            {locationText?.trim() || 'No venue yet'}
                        </p>

                        <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-[12px]">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Dates</span>
                                <span className="text-right font-medium">
                                    {previewDates ?? 'Not set'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Days</span>
                                <span className="font-medium tabular-nums">
                                    {formatNumber(daysList.length)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Locations</span>
                                <span className="font-medium tabular-nums">
                                    {locationFields.length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Categories</span>
                                <span className="font-medium tabular-nums">
                                    {categoryFields.length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">
                                    Custom fields
                                </span>
                                <span className="font-medium tabular-nums">
                                    {customFieldsSchema.fields.length}
                                </span>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-5 w-full"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Check className="size-4" />
                            )}
                            {loading
                                ? isEditing
                                    ? 'Saving…'
                                    : 'Creating…'
                                : isEditing
                                  ? 'Save changes'
                                  : 'Create event'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="mt-1.5 w-full"
                            onClick={() =>
                                router.push(
                                    isEditing && event
                                        ? `/dashboard/events/${event.id}`
                                        : '/dashboard/events'
                                )
                            }
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        {isEditing ? (
                            <Button
                                type="button"
                                variant="ghost"
                                className="mt-1.5 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setConfirmDelete(true)}
                                disabled={loading || deleting}
                            >
                                <Trash2 className="size-4" />
                                Delete event
                            </Button>
                        ) : null}
                    </div>

                    <div className="rounded-xl border border-dashed border-border p-4 text-[11.5px] leading-relaxed text-muted-foreground">
                        <p className="mb-1.5 font-medium text-foreground">
                            {isEditing ? 'Editing this event' : 'What happens next'}
                        </p>
                        {isEditing
                            ? 'Changes apply immediately. Removing an accreditation point or category hides it for future check-ins while keeping past records intact.'
                            : 'After creating the event, assign ambassadors and share the guest list. Check-ins will appear live on your overview.'}
                    </div>
                </aside>
            </div>

            <AlertDialog
                open={confirmDelete}
                onOpenChange={(next) => {
                    if (!next && !deleting) setConfirmDelete(false);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete this event permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {event
                                ? `"${event.name}", its guests, accreditation points, categories, and organizer API keys will be permanently deleted. This cannot be undone.`
                                : 'This event will be permanently deleted. This cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deleting}
                            onClick={(e) => {
                                e.preventDefault();
                                void handleDeleteEvent();
                            }}
                        >
                            {deleting ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            Delete event
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </form>
    );
}
