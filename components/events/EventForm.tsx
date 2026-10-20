'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { format, eachDayOfInterval, parseISO, addDays } from 'date-fns';
import { CustomFieldsBuilder } from './CustomFieldsBuilder';

const formSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().optional(),
    location_text: z.string().optional(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    // enforce_hours: z.boolean().default(true),
    enforce_hours: z.boolean(),
    locations: z.array(
        z.object({
            name: z.string().min(1, 'Location name required'),
            description: z.string().optional(),
            // order: z.number().default(0),
            order: z.number(),
        })
    ).min(1, 'At least one location is required'),
    categories: z.array(
        z.object({
            name: z.string().min(1, 'Category name required'),
            color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
            // priority: z.number().default(0),
            priority: z.number(),
        })
    ),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

export function EventForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [customFieldsSchema, setCustomFieldsSchema] = useState<{ fields: any[] } | null>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            enforce_hours: true,
            locations: [{ name: '', description: '', order: 0 }],
            categories: [{ name: 'VVIP', color: '#F59E0B', priority: 3 }, { name: 'VIP', color: '#3B82F6', priority: 2 }, { name: 'Regular', color: '#6B7280', priority: 1 }],
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

    const startDate = watch('start_date');
    const endDate = watch('end_date');
    const enforceHours = watch('enforce_hours');

    // Generate list of days between start and end dates
    const daysList = startDate && endDate && endDate >= startDate
        ? eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
        : [];

    // Per-day schedule state: { 'YYYY-MM-DD': { start: 'HH:MM', end: 'HH:MM' } }
    const [dailySchedule, setDailySchedule] = useState<Record<string, { start: string; end: string }>>({});

    const updateSchedule = (date: string, field: 'start' | 'end', value: string) => {
        setDailySchedule((prev) => ({
            ...prev,
            [date]: {
                start: prev[date]?.start || '09:00',
                end: prev[date]?.end || '18:00',
                [field]: value,
            },
        }));
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...data,
                daily_schedule: enforceHours ? dailySchedule : {},
                custom_fields_schema: customFieldsSchema || {fields: []}
            };

            await api('/events/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            router.push('/dashboard/events');
        } catch (err: any) {
            setError(err.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Event Name *</Label>
                        <Input placeholder="Tech Conference 2026" {...register('name')} />
                        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Brief description of the event..." {...register('description')} />
                    </div>

                    <div className="space-y-2">
                        <Label>General Location</Label>
                        <Input placeholder="Lagos, Nigeria" {...register('location_text')} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date *</Label>
                            <Input type="date" {...register('start_date')} />
                            {errors.start_date && <p className="text-sm text-red-600">{errors.start_date.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>End Date *</Label>
                            <Input type="date" {...register('end_date')} />
                            {errors.end_date && <p className="text-sm text-red-600">{errors.end_date.message}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Per-Day Schedule */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Daily Schedule</CardTitle>
                        <p className="text-sm text-neutral-500 mt-1">Set check-in hours for each day</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch checked={enforceHours} onCheckedChange={(v) => setValue('enforce_hours', v)} />
                        <Label className="text-sm">Enforce hours</Label>
                    </div>
                </CardHeader>
                <CardContent>
                    {!enforceHours ? (
                        <p className="text-sm text-neutral-500 italic">Hour enforcement is disabled. Check-ins allowed anytime.</p>
                    ) : daysList.length === 0 ? (
                        <p className="text-sm text-neutral-500 italic">Select start and end dates above to configure daily schedule.</p>
                    ) : (
                        <div className="space-y-3">
                            {daysList.map((day) => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const schedule = dailySchedule[dateKey] || { start: '09:00', end: '18:00' };
                                return (
                                    <div key={dateKey} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                                        <div className="w-32 text-sm font-medium text-neutral-700">
                                            {format(day, 'EEE, MMM d')}
                                        </div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <Input
                                                type="time"
                                                value={schedule.start}
                                                onChange={(e) => updateSchedule(dateKey, 'start', e.target.value)}
                                                className="flex-1"
                                            />
                                            <span className="text-neutral-400 text-sm">to</span>
                                            <Input
                                                type="time"
                                                value={schedule.end}
                                                onChange={(e) => updateSchedule(dateKey, 'end', e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Locations */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Accreditation Locations</CardTitle>
                        <p className="text-sm text-neutral-500 mt-1">Where ambassadors will check in guests</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendLocation({ name: '', description: '', order: locationFields.length })}
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {locationFields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <Input placeholder="Location name (e.g., Lagos)" {...register(`locations.${index}.name`)} />
                                <Input placeholder="Description (optional)" {...register(`locations.${index}.description`)} />
                            </div>
                            {locationFields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLocation(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {errors.locations?.root && (
                        <p className="text-sm text-red-600">{errors.locations.root.message}</p>
                    )}
                </CardContent>
            </Card>

            {/* Categories */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Guest Categories</CardTitle>
                        <p className="text-sm text-neutral-500 mt-1">VIP tiers with custom colors</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            appendCategory({
                                name: '',
                                color: DEFAULT_COLORS[categoryFields.length % DEFAULT_COLORS.length],
                                priority: 0,
                            })
                        }
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {categoryFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                            <Input
                                type="color"
                                {...register(`categories.${index}.color`)}
                                className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                                placeholder="Category name (e.g., VIP)"
                                className="flex-1"
                                {...register(`categories.${index}.name`)}
                            />
                            <Input
                                type="number"
                                placeholder="Priority"
                                className="w-24"
                                {...register(`categories.${index}.priority`, { valueAsNumber: true })}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCategory(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CustomFieldsBuilder
                    schema={customFieldsSchema}
                    onChange={setCustomFieldsSchema}
                />
            </Card>

            {/* Error + Submit */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Event
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}