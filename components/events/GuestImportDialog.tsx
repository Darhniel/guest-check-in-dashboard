'use client';

import { useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    Loader2,
    Upload,
    Users,
} from 'lucide-react';
import type { GuestImportResponse } from '@/types';
import { api } from '@/lib/api';
import {
    GUEST_CSV_TEMPLATE,
    GUEST_FIELD_LABELS,
    chunkRows,
    parseGuestCsv,
} from '@/lib/csv';
import type { GuestField, ParsedGuestCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { formatNumber, pluralize } from '@/lib/format';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: number;
    onImported: () => void;
}

const BATCH_SIZE = 500;
const MAX_BYTES = 5 * 1024 * 1024;

interface ImportResult {
    created: number;
    skipped: number;
    categories: string[];
    errors: { rowNumber: number; message: string }[];
}

function downloadTemplate() {
    const blob = new Blob([`\ufeff${GUEST_CSV_TEMPLATE}`], {
        type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'guest-list-template.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function Stat({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: 'success' | 'muted';
}) {
    return (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                {label}
            </p>
            <p
                className={`mt-0.5 text-[15px] font-semibold tabular-nums ${
                    tone === 'success'
                        ? 'text-success'
                        : tone === 'muted'
                          ? 'text-muted-foreground'
                          : ''
                }`}
            >
                {value}
            </p>
        </div>
    );
}

export function GuestImportDialog({
    open,
    onOpenChange,
    eventId,
    onImported,
}: Props) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [parsed, setParsed] = useState<ParsedGuestCsv | null>(null);
    const [fileName, setFileName] = useState('');
    const [reading, setReading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState('');
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [result, setResult] = useState<ImportResult | null>(null);

    const reset = () => {
        setParsed(null);
        setFileName('');
        setError('');
        setResult(null);
        setReading(false);
        setDragging(false);
        setImporting(false);
        setProgress({ done: 0, total: 0 });
        if (fileInput.current) fileInput.current.value = '';
    };

    /** Clears the input first so picking the same file again still fires. */
    const openPicker = () => {
        if (!fileInput.current) return;
        fileInput.current.value = '';
        fileInput.current.click();
    };

    const handleClose = (next: boolean) => {
        if (!next) {
            if (importing) return;
            reset();
        }
        onOpenChange(next);
    };

    const loadFile = async (file: File) => {
        setError('');
        if (!/\.csv$/i.test(file.name)) {
            setError('Choose a .csv file. Excel files must be saved as CSV first.');
            return;
        }
        if (file.size > MAX_BYTES) {
            setError('That file is larger than 5 MB. Split the list into smaller files.');
            return;
        }

        setReading(true);
        try {
            const buffer = await file.arrayBuffer();
            const next = parseGuestCsv(buffer);
            setFileName(file.name);
            setParsed(next);

            if (next.plan.mapped.names === undefined) {
                setError(
                    `No guest-name column found. Headers we saw: ${
                        next.headers.join(', ') || '(none)'
                    }. Rename one to "names" or "name".`
                );
            } else if (next.plan.rows.length === 0) {
                setError('That file has no guest rows.');
            }
        } catch {
            setError('We could not read that file. Try re-exporting it as CSV.');
        } finally {
            setReading(false);
        }
    };

    const handleImport = async () => {
        if (!parsed || parsed.plan.rows.length === 0) return;

        const rows = parsed.plan.rows;
        const batches = chunkRows(rows, BATCH_SIZE);
        const aggregate: ImportResult = {
            created: 0,
            skipped: 0,
            categories: [],
            errors: parsed.plan.skipped.map((row) => ({
                rowNumber: row.rowNumber,
                message: row.reason,
            })),
        };

        setImporting(true);
        setProgress({ done: 0, total: rows.length });

        try {
            let offset = 0;
            for (const batch of batches) {
                const response = await api<GuestImportResponse>(
                    `/admin/events/${eventId}/guests/bulk/`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            guests: batch.map((row) => row.payload),
                        }),
                    }
                );

                aggregate.created += response.created_count ?? 0;
                aggregate.skipped += response.skipped_count ?? 0;
                for (const category of response.created_categories ?? []) {
                    if (!aggregate.categories.includes(category)) {
                        aggregate.categories.push(category);
                    }
                }
                for (const issue of response.errors ?? []) {
                    const row = batch[issue.index] ?? rows[offset + issue.index];
                    aggregate.errors.push({
                        rowNumber: row?.rowNumber ?? offset + issue.index + 2,
                        message: issue.error,
                    });
                }

                offset += batch.length;
                setProgress({ done: offset, total: rows.length });
            }

            setResult(aggregate);
            onImported();
            toast.add({
                type: aggregate.created > 0 ? 'success' : 'info',
                title:
                    aggregate.created > 0
                        ? `${pluralize(aggregate.created, 'guest')} imported`
                        : 'No new guests added',
                description:
                    aggregate.skipped > 0
                        ? `${pluralize(aggregate.skipped, 'guest')} already existed or was skipped.`
                        : 'The guest register is up to date.',
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'The import failed. Please try again.'
            );
        } finally {
            setImporting(false);
        }
    };

    const plan = parsed?.plan;
    const rowWarnings = plan
        ? plan.rows.flatMap((row) => row.warnings)
        : [];
    const detected = plan
        ? (Object.keys(plan.mapped) as GuestField[]).filter(
              (field) => plan.mapped[field] !== undefined
          )
        : [];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                {result ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-success" />
                                Import finished
                            </DialogTitle>
                            <DialogDescription>
                                {fileName} — {pluralize(result.created, 'new guest')}{' '}
                                added to this event.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <Stat
                                label="Created"
                                value={formatNumber(result.created)}
                                tone="success"
                            />
                            <Stat
                                label="Already there"
                                value={formatNumber(result.skipped)}
                                tone="muted"
                            />
                            <Stat
                                label="Skipped rows"
                                value={formatNumber(result.errors.length)}
                                tone={
                                    result.errors.length > 0 ? 'muted' : undefined
                                }
                            />
                        </div>

                        {result.categories.length > 0 ? (
                            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-[12px]">
                                <p className="font-medium">
                                    Categories created for this event
                                </p>
                                <p className="mt-0.5 text-muted-foreground">
                                    {result.categories.join(', ')}
                                </p>
                            </div>
                        ) : null}

                        {result.errors.length > 0 ? (
                            <div className="space-y-1.5">
                                <p className="text-[11.5px] font-medium">
                                    Rows that need attention
                                </p>
                                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border bg-background/60 p-2">
                                    {result.errors.slice(0, 50).map((issue, index) => (
                                        <p
                                            key={`${issue.rowNumber}-${index}`}
                                            className="text-[11.5px] text-muted-foreground"
                                        >
                                            <span className="font-mono text-foreground">
                                                Row {issue.rowNumber}
                                            </span>{' '}
                                            — {issue.message}
                                        </p>
                                    ))}
                                    {result.errors.length > 50 ? (
                                        <p className="text-[11.5px] text-muted-foreground">
                                            …and {result.errors.length - 50} more.
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    reset();
                                    openPicker();
                                }}
                            >
                                <Upload className="size-4" />
                                Import another file
                            </Button>
                            <Button onClick={() => handleClose(false)}>Done</Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="size-4" />
                                Import guest list
                            </DialogTitle>
                            <DialogDescription>
                                Upload the organizer&apos;s CSV and we&apos;ll add
                                every guest to this event. Each row needs a name
                                plus an email or a phone number. Rows are matched
                                by email, or by name when there is no email.
                            </DialogDescription>
                        </DialogHeader>

                        <input
                            ref={fileInput}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void loadFile(file);
                            }}
                        />

                        {!parsed || error ? (
                            <div className="space-y-3">
                                <div
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        setDragging(true);
                                    }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        setDragging(false);
                                        const file = event.dataTransfer.files?.[0];
                                        if (file) void loadFile(file);
                                    }}
                                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-9 text-center transition-colors ${
                                        dragging
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-muted/20'
                                    }`}
                                >
                                    {reading ? (
                                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                    ) : (
                                        <Upload className="size-6 text-muted-foreground" />
                                    )}
                                    <div>
                                        <p className="text-[13px] font-medium">
                                            {reading
                                                ? 'Reading file…'
                                                : 'Drop the CSV here'}
                                        </p>
                                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                                            or choose a file — up to 5 MB
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={openPicker}
                                        disabled={reading}
                                    >
                                        <FileSpreadsheet className="size-3.5" />
                                        Choose file
                                    </Button>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
                                    <p className="text-[11.5px] text-muted-foreground">
                                        Need a starting point? Use the template
                                        with the expected columns.
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={downloadTemplate}
                                    >
                                        <Download className="size-3.5" />
                                        Download template
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {error ? (
                            <p
                                role="alert"
                                className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive"
                            >
                                {error}
                            </p>
                        ) : null}

                        {parsed && !error ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <Stat
                                        label="Rows"
                                        value={formatNumber(plan?.totalRows ?? 0)}
                                    />
                                    <Stat
                                        label="Ready"
                                        value={formatNumber(plan?.rows.length ?? 0)}
                                        tone="success"
                                    />
                                    <Stat
                                        label="Skipped"
                                        value={formatNumber(
                                            plan?.skipped.length ?? 0
                                        )}
                                        tone="muted"
                                    />
                                    <Stat
                                        label="Kids"
                                        value={formatNumber(
                                            plan?.rows.reduce(
                                                (total, row) =>
                                                    total + row.payload.kids.length,
                                                0
                                            ) ?? 0
                                        )}
                                        tone="muted"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-[11.5px] font-medium">
                                        Columns detected
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {detected.map((field) => (
                                            <span
                                                key={field}
                                                className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground"
                                            >
                                                {GUEST_FIELD_LABELS[field]}{' '}
                                                <span className="font-mono text-foreground">
                                                    {parsed.headers[plan!.mapped[field]!]}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                    {plan && plan.unknownHeaders.length > 0 ? (
                                        <p className="text-[11px] text-muted-foreground">
                                            Ignored:{' '}
                                            {plan.unknownHeaders.join(', ')}
                                        </p>
                                    ) : null}
                                </div>

                                {rowWarnings.length > 0 ||
                                (plan?.skipped.length ?? 0) > 0 ? (
                                    <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                                        <p className="flex items-center gap-1.5 text-[11.5px] font-medium">
                                            <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
                                            Review before importing
                                        </p>
                                        <div className="max-h-28 space-y-0.5 overflow-y-auto">
                                            {plan?.skipped
                                                .slice(0, 10)
                                                .map((row) => (
                                                    <p
                                                        key={`skip-${row.rowNumber}`}
                                                        className="text-[11.5px] text-muted-foreground"
                                                    >
                                                        Row {row.rowNumber} —{' '}
                                                        {row.reason.toLowerCase()}
                                                    </p>
                                                ))}
                                            {rowWarnings
                                                .slice(0, 10)
                                                .map((warning, index) => (
                                                    <p
                                                        key={`warn-${index}`}
                                                        className="text-[11.5px] text-muted-foreground"
                                                    >
                                                        {warning}
                                                    </p>
                                                ))}
                                            {rowWarnings.length +
                                                (plan?.skipped.length ?? 0) >
                                            20 ? (
                                                <p className="text-[11.5px] text-muted-foreground">
                                                    …and more. The import result
                                                    lists everything.
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="overflow-hidden rounded-lg border border-border">
                                    <table className="w-full text-left text-[11.5px]">
                                        <thead className="bg-muted/40 text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2 font-medium">
                                                    Guest
                                                </th>
                                                <th className="px-3 py-2 font-medium">
                                                    Email
                                                </th>
                                                <th className="hidden px-3 py-2 font-medium sm:table-cell">
                                                    Category
                                                </th>
                                                <th className="px-3 py-2 font-medium">
                                                    Kids
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {plan?.rows
                                                .slice(0, 5)
                                                .map((row) => (
                                                    <tr
                                                        key={row.rowNumber}
                                                        className="border-t border-border"
                                                    >
                                                        <td className="max-w-[180px] truncate px-3 py-1.5">
                                                            {row.payload.names}
                                                        </td>
                                                        <td className="max-w-[180px] truncate px-3 py-1.5 text-muted-foreground">
                                                            {row.payload.email || '—'}
                                                        </td>
                                                        <td className="hidden px-3 py-1.5 text-muted-foreground sm:table-cell">
                                                            {row.payload.category_name || '—'}
                                                        </td>
                                                        <td className="px-3 py-1.5 text-muted-foreground tabular-nums">
                                                            {row.payload.kids.length || '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                    {(plan?.rows.length ?? 0) > 5 ? (
                                        <p className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
                                            Showing 5 of{' '}
                                            {formatNumber(plan?.rows.length ?? 0)} rows
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        <DialogFooter>
                            {parsed && !error ? (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        reset();
                                        openPicker();
                                    }}
                                    disabled={importing}
                                >
                                    Choose another file
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    onClick={() => handleClose(false)}
                                    disabled={reading}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                onClick={() => void handleImport()}
                                disabled={
                                    importing ||
                                    !parsed ||
                                    !!error ||
                                    (plan?.rows.length ?? 0) === 0
                                }
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Importing {formatNumber(progress.done)} of{' '}
                                        {formatNumber(progress.total)}
                                    </>
                                ) : (
                                    <>
                                        <Users className="size-4" />
                                        Import{' '}
                                        {formatNumber(plan?.rows.length ?? 0)} guests
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
