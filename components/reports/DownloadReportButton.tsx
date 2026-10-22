'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { EventReport } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { downloadEventReport } from '@/lib/report-excel';

interface DownloadReportButtonProps {
    report: EventReport;
    variant?: 'default' | 'outline' | 'secondary';
    className?: string;
}

export function DownloadReportButton({
    report,
    variant = 'default',
    className,
}: DownloadReportButtonProps) {
    const [busy, setBusy] = useState(false);

    async function handleDownload() {
        setBusy(true);
        try {
            await downloadEventReport(report);
            toast.add({
                type: 'success',
                title: 'Spreadsheet downloaded',
                description: `${report.guests.length.toLocaleString()} guests across 6 sheets, ready for Excel.`,
            });
        } catch (error) {
            toast.add({
                type: 'error',
                title: 'Could not build the spreadsheet',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Please try again in a moment.',
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <Button
            variant={variant}
            onClick={handleDownload}
            disabled={busy}
            className={className}
        >
            {busy ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <Download className="size-4" />
            )}
            {busy ? 'Preparing…' : 'Download Excel'}
        </Button>
    );
}
