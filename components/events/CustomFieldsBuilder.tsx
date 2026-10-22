'use client';

import { useState } from 'react';
import { ListPlus, Plus, Trash2, X } from 'lucide-react';
import type { CustomField } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
    schema: { fields: CustomField[] } | null;
    onChange: (schema: { fields: CustomField[] }) => void;
}

const FIELD_TYPES = [
    { value: 'text', label: 'Short text' },
    { value: 'textarea', label: 'Long text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'checkbox', label: 'Yes / no' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
];

export function CustomFieldsBuilder({ schema, onChange }: Props) {
    const [fields, setFields] = useState<CustomField[]>(schema?.fields ?? []);

    const commit = (updated: CustomField[]) => {
        setFields(updated);
        onChange({ fields: updated });
    };

    const addField = () => {
        commit([
            ...fields,
            {
                key: `field_${Date.now()}`,
                label: '',
                type: 'text',
                required: false,
            },
        ]);
    };

    const removeField = (index: number) => {
        commit(fields.filter((_, itemIndex) => itemIndex !== index));
    };

    const updateField = (index: number, updates: Partial<CustomField>) => {
        commit(
            fields.map((field, itemIndex) =>
                itemIndex === index ? { ...field, ...updates } : field
            )
        );
    };

    const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
        const options = [...(fields[fieldIndex].options ?? [])];
        options[optionIndex] = value;
        updateField(fieldIndex, { options });
    };

    if (fields.length === 0) {
        return (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ListPlus className="size-4" />
                </div>
                <p className="text-[13px] font-medium">No custom fields</p>
                <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">
                    Add fields for things like company, dietary needs, or job title.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={addField}
                >
                    <Plus className="size-3.5" />
                    Add field
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {fields.map((field, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-border/70 bg-muted/30 p-3"
                >
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                            Field {index + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => removeField(index)}
                            aria-label={`Remove field ${index + 1}`}
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 className="size-3.5" />
                        </button>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">
                                Display label
                            </Label>
                            <Input
                                value={field.label}
                                onChange={(event) =>
                                    updateField(index, { label: event.target.value })
                                }
                                placeholder="e.g. Company name"
                                aria-label={`Display label for field ${index + 1}`}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">
                                Field key
                            </Label>
                            <Input
                                value={field.key}
                                onChange={(event) =>
                                    updateField(index, {
                                        key: event.target.value
                                            .replace(/\s+/g, '_')
                                            .toLowerCase(),
                                    })
                                }
                                placeholder="company_name"
                                aria-label={`Key for field ${index + 1}`}
                                className="font-mono text-[12px]"
                            />
                        </div>
                    </div>

                    <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">
                                Type
                            </Label>
                            <Select
                                value={field.type || 'text'}
                                onValueChange={(value) =>
                                    updateField(index, { type: value || 'text' })
                                }
                            >
                                <SelectTrigger
                                    className="w-full"
                                    aria-label={`Type for field ${index + 1}`}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">
                                Required
                            </Label>
                            <div
                                className={cn(
                                    'flex h-10 items-center gap-2.5 rounded-lg border border-border bg-card px-3'
                                )}
                            >
                                <Switch
                                    checked={field.required}
                                    onCheckedChange={(checked) =>
                                        updateField(index, { required: checked })
                                    }
                                    aria-label={`Field ${index + 1} required`}
                                />
                                <span className="text-[12px] text-muted-foreground">
                                    {field.required ? 'Required' : 'Optional'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {field.type === 'dropdown' ? (
                        <div className="mt-3 space-y-2 border-t border-border/70 pt-3">
                            <Label className="text-[11px] text-muted-foreground">
                                Options
                            </Label>
                            {(field.options ?? []).map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-2">
                                    <Input
                                        value={option}
                                        onChange={(event) =>
                                            updateOption(
                                                index,
                                                optionIndex,
                                                event.target.value
                                            )
                                        }
                                        placeholder={`Option ${optionIndex + 1}`}
                                        aria-label={`Option ${optionIndex + 1}`}
                                        className="h-9"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateField(index, {
                                                options: (field.options ?? []).filter(
                                                    (_, itemIndex) =>
                                                        itemIndex !== optionIndex
                                                ),
                                            })
                                        }
                                        aria-label={`Remove option ${optionIndex + 1}`}
                                        className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full border-dashed"
                                onClick={() =>
                                    updateField(index, {
                                        options: [...(field.options ?? []), ''],
                                    })
                                }
                            >
                                <Plus className="size-3.5" />
                                Add option
                            </Button>
                        </div>
                    ) : null}
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={addField}
            >
                <Plus className="size-3.5" />
                Add another field
            </Button>
        </div>
    );
}
