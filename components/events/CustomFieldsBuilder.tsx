'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface CustomField {
    key: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
}

interface Props {
    schema: { fields: CustomField[] } | null;
    onChange: (schema: { fields: CustomField[] }) => void;
}

const FIELD_TYPES = [
    { value: 'text', label: 'Text (short)' },
    { value: 'textarea', label: 'Textarea (long)' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'dropdown', label: 'Dropdown (single choice)' },
    { value: 'checkbox', label: 'Checkbox (yes/no)' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
];

export function CustomFieldsBuilder({ schema, onChange }: Props) {
    const [fields, setFields] = useState<CustomField[]>(schema?.fields || []);

    const addField = () => {
        const newField: CustomField = {
            key: `field_${Date.now()}`,
            label: '',
            type: 'text',
            required: false,
        };
        const updated = [...fields, newField];
        setFields(updated);
        onChange({ fields: updated });
    };

    const removeField = (index: number) => {
        const updated = fields.filter((_, i) => i !== index);
        setFields(updated);
        onChange({ fields: updated });
    };

    const updateField = (index: number, updates: Partial<CustomField>) => {
        const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
        setFields(updated);
        onChange({ fields: updated });
    };

    const addOption = (fieldIndex: number) => {
        const field = fields[fieldIndex];
        const options = [...(field.options || []), ''];
        updateField(fieldIndex, { options });
    };

    const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
        const field = fields[fieldIndex];
        const options = [...(field.options || [])];
        options[optionIndex] = value;
        updateField(fieldIndex, { options });
    };

    const removeOption = (fieldIndex: number, optionIndex: number) => {
        const field = fields[fieldIndex];
        const options = (field.options || []).filter((_, i) => i !== optionIndex);
        updateField(fieldIndex, { options });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Custom Guest Fields</CardTitle>
                    <p className="text-sm text-neutral-500 mt-1">
                        Define additional information to collect for each guest
                    </p>
                </div>
                <Button onClick={addField} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Field
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400 text-sm">
                        No custom fields defined. Click "Add Field" to create one.
                    </div>
                ) : (
                    fields.map((field, index) => (
                        <div key={index} className="p-4 bg-neutral-50 rounded-lg space-y-3">
                            <div className="flex items-start gap-3">
                                <GripVertical className="w-5 h-5 text-neutral-400 mt-2 cursor-move" />
                                <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Field Key (no spaces)</Label>
                                            <Input
                                                value={field.key}
                                                onChange={(e) => updateField(index, { key: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                                                placeholder="e.g., company_name"
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Display Label</Label>
                                            <Input
                                                value={field.label}
                                                onChange={(e) => updateField(index, { label: e.target.value })}
                                                placeholder="e.g., Company Name"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Field Type</Label>
                                            <Select
                                                value={field.type || 'text'}
                                                onValueChange={(v) => updateField(index, { type: v || 'text'})}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FIELD_TYPES.map((t) => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Required</Label>
                                            <div className="flex items-center gap-2 h-9">
                                                <Switch
                                                    checked={field.required}
                                                    onCheckedChange={(v) => updateField(index, { required: v })}
                                                />
                                                <span className="text-sm text-neutral-600">
                                                    {field.required ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Options for dropdown */}
                                    {field.type === 'dropdown' && (
                                        <div className="space-y-2 pt-2 border-t border-neutral-200">
                                            <Label className="text-xs">Options</Label>
                                            {(field.options || []).map((opt, optIdx) => (
                                                <div key={optIdx} className="flex gap-2">
                                                    <Input
                                                        value={opt}
                                                        onChange={(e) => updateOption(index, optIdx, e.target.value)}
                                                        placeholder={`Option ${optIdx + 1}`}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeOption(index, optIdx)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addOption(index)}
                                                className="w-full"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Option
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeField(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}