'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
    BarChart3,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Download,
    FileText,
    Loader2,
    MapPin,
    TrendingUp,
    Users,
} from 'lucide-react';
import type { EventReport } from '@/types';
import { useApiQuery } from '@/hooks/useApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/common/Avatar';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { CheckinsChart } from '@/components/dashboard/CheckinsChart';
import { AttendanceDonut } from '@/components/reports/AttendanceDonut';
import { CategoryBreakdown } from '@/components/reports/CategoryBreakdown';
import { DailyAttendanceChart } from '@/components/reports/DailyAttendanceChart';
import {
    DEFAULT_PALETTE,
    extractFlyerColors,
    type FlyerPalette,
} from '@/lib/color-extract';
import {
    buildInfographicHtml,
    downloadHtmlReport,
    fetchImageAsDataUrl,
} from '@/lib/html-report';
import { downloadPdfReport } from '@/lib/pdf-report';
import { GuestTable } from '@/components/reports/GuestTable';
import { PanelTitle, ReportPanel } from '@/components/reports/Panel';
import {
    eventStatusMeta,
    formatDate,
    formatEventDates,
    formatHourLabel,
    formatNumber,
    formatTime,
    getEventStatus,
} from '@/lib/format';
import { cn } from '@/lib/utils';

function Kpi({
    label,
    value,
    hint,
    icon: Icon,
    tone,
    pdfExclude = false,
}: {
    label: string;
    value: string;
    hint: string;
    icon: typeof Users;
    tone: string;
    pdfExclude?: boolean;
}) {
    return (
        <div
            data-pdf-exclude={pdfExclude ? 'true' : undefined}
            className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card ring-1 ring-border lg:flex-col lg:items-start lg:p-4"
        >
            <span
                className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    tone
                )}
            >
                <Icon className="size-4" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                    {label}
                </p>
                <p className="mt-0.5 text-[20px] leading-none font-semibold tracking-[-0.02em] tabular-nums lg:text-[24px]">
                    {value}
                </p>
                <p className="mt-1 hidden text-[11px] text-muted-foreground lg:block">
                    {hint}
                </p>
            </div>
        </div>
    );
}

function EmptyPanel({ children }: { children: string }) {
    return (
        <p className="py-8 text-center text-[12.5px] text-muted-foreground">
            {children}
        </p>
    );
}

export default function EventReportPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { data: report, loading, error, refetch } = useApiQuery<EventReport>(
        id ? `/admin/events/${id}/report/` : null
    );

    const [resolvedFlyer, setResolvedFlyer] = useState<{
        source: string | null;
        dataUrl: string | null;
    }>({ source: null, dataUrl: null });
    const [resolvedPalette, setResolvedPalette] = useState<{
        source: string | null;
        palette: FlyerPalette;
    }>({ source: null, palette: DEFAULT_PALETTE });
    const [downloadingHtml, setDownloadingHtml] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [showGuestList, setShowGuestList] = useState(true);
    const reportRef = useRef<HTMLDivElement>(null);

    const flyerSource = report?.flyer_data ?? report?.event.flyer ?? null;

    // State is keyed by the flyer it was derived from, so a report without a
    // flyer (or a newly selected event) never shows a stale palette while the
    // async extraction is still running.
    const palette =
        flyerSource && resolvedPalette.source === flyerSource
            ? resolvedPalette.palette
            : DEFAULT_PALETTE;
    const extractingPalette =
        Boolean(flyerSource) && resolvedPalette.source !== flyerSource;
    const embeddedFlyer =
        flyerSource && resolvedFlyer.source === flyerSource
            ? resolvedFlyer.dataUrl
            : flyerSource?.startsWith('data:')
              ? flyerSource
              : null;

    useEffect(() => {
        if (!flyerSource) return;

        let cancelled = false;
        void (async () => {
            // The API normally returns `flyer_data`, but older payloads only
            // have the media URL. Resolve it to Base64 so canvas extraction
            // and the exported HTML both stay same-origin and offline-safe.
            const dataUrl = await fetchImageAsDataUrl(flyerSource);
            if (cancelled) return;
            if (dataUrl) {
                setResolvedFlyer({ source: flyerSource, dataUrl });
            }

            const extracted = await extractFlyerColors(dataUrl);
            if (cancelled) return;
            setResolvedPalette({
                source: flyerSource,
                palette: extracted ?? DEFAULT_PALETTE,
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [flyerSource]);

    if (loading) {
        return (
            <div className="space-y-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-80 max-w-full" />
                <Skeleton className="h-4 w-96 max-w-full" />
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-[68px] rounded-xl lg:h-[124px]" />
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Skeleton className="h-[340px] rounded-xl" />
                    <Skeleton className="h-[340px] rounded-xl lg:col-span-2" />
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Skeleton className="h-[300px] rounded-xl" />
                    <Skeleton className="h-[300px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-5">
                <PageHeader
                    backHref="/dashboard/reports"
                    backLabel="All reports"
                    title="Event report"
                    description="We couldn't load this report."
                />
                <ErrorState description={error} onRetry={() => void refetch()} />
            </div>
        );
    }

    if (!report) return null;

    const { event, summary } = report;
    const status = eventStatusMeta[getEventStatus(event)];
    const repeatCheckins = Math.max(
        0,
        summary.total_checkins - summary.accredited_guests
    );
    const eventDates = formatEventDates(event.start_date, event.end_date);
    const heroSrc = embeddedFlyer ?? event.flyer ?? null;
    const safeName = `${String(event.name)
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase()}-report`;

    const paletteVars = {
        '--brand': palette.primary,
        '--brand-subtle': palette.subtle,
        '--brand-foreground': palette.onPrimary,
        '--ring': palette.primary,
        '--chart-1': palette.primary,
        '--chart-2': palette.secondary,
    } as CSSProperties;

    async function handleDownloadHtml() {
        if (!report) return;
        setDownloadingHtml(true);
        try {
            let flyerDataUrl = report.flyer_data ?? embeddedFlyer;
            if (!flyerDataUrl && event.flyer) {
                flyerDataUrl = await fetchImageAsDataUrl(event.flyer);
            }

            const html = buildInfographicHtml(report, palette, flyerDataUrl, {
                includeGuestList: showGuestList,
            });
            downloadHtmlReport(html, safeName);
            toast.add({
                type: 'success',
                title: 'HTML report downloaded',
                description:
                    'One self-contained file with styles, charts, animations, and the flyer embedded.',
            });
        } catch (err) {
            toast.add({
                type: 'error',
                title: 'Could not build the HTML report',
                description:
                    err instanceof Error ? err.message : 'Please try again.',
            });
        } finally {
            setDownloadingHtml(false);
        }
    }

    async function handleDownloadPdf() {
        if (!reportRef.current) return;
        setDownloadingPdf(true);
        try {
            await downloadPdfReport({
                container: reportRef.current,
                filename: safeName,
                backgroundColor: palette.background,
            });
            toast.add({
                type: 'success',
                title: 'PDF report downloaded',
                description: 'The report is ready to print or share.',
            });
        } catch (err) {
            toast.add({
                type: 'error',
                title: 'Could not build the PDF',
                description:
                    err instanceof Error ? err.message : 'Please try again.',
            });
        } finally {
            setDownloadingPdf(false);
        }
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    backHref="/dashboard/reports"
                    backLabel="All reports"
                    eyebrow="Event report"
                    title={event.name}
                    description={
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <StatusBadge
                                label={status.label}
                                tone={status.tone}
                                pulse={status.label === 'Live'}
                            />
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-3.5 text-muted-foreground" />
                                {formatEventDates(event.start_date, event.end_date)}
                            </span>
                            {event.location_text ? (
                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                    <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate">
                                        {event.location_text}
                                    </span>
                                </span>
                            ) : null}
                        </div>
                    }
                    actions={
                        <>
                            <Button
                                variant="outline"
                                render={
                                    <Link
                                        href={`/dashboard/events/${event.id}`}
                                    />
                                }
                                className="max-sm:hidden"
                            >
                                View event
                            </Button>
                            <Button
                                onClick={handleDownloadHtml}
                                disabled={
                                    downloadingHtml ||
                                    (extractingPalette &&
                                        Boolean(flyerSource))
                                }
                            >
                                {downloadingHtml || extractingPalette ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <FileText className="size-4" />
                                )}
                                {extractingPalette
                                    ? 'Preparing…'
                                    : 'Download HTML'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDownloadPdf}
                                disabled={downloadingPdf}
                            >
                                {downloadingPdf ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Download className="size-4" />
                                )}
                                Download PDF
                            </Button>
                        </>
                    }
                />
            </div>

            <div
                ref={reportRef}
                className="report-infographic space-y-5 sm:space-y-6"
                style={paletteVars}
            >
                <section className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
                    {heroSrc ? (
                        <img
                            src={heroSrc}
                            alt={`${event.name} flyer`}
                            className="block max-h-[420px] w-full object-cover"
                        />
                    ) : (
                        <div className="relative flex min-h-[240px] items-end overflow-hidden bg-gradient-to-br from-brand via-brand to-chart-2 p-6 sm:min-h-[300px] sm:p-8">
                            <span className="absolute -top-10 right-2 text-[140px] leading-none font-black tracking-tighter text-white/15 select-none sm:text-[190px]">
                                {event.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="relative max-w-[26ch]">
                                <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-white uppercase backdrop-blur">
                                    Accreditation report
                                </span>
                                <h1 className="mt-3 text-3xl leading-tight font-extrabold text-white drop-shadow sm:text-4xl">
                                    {event.name}
                                </h1>
                            </div>
                        </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 text-white sm:p-7">
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.16em] uppercase opacity-80">
                                Event flyer
                            </span>
                            <h2 className="mt-1 max-w-[20ch] text-2xl leading-tight font-extrabold drop-shadow sm:text-3xl">
                                {event.name}
                            </h2>
                            <p className="mt-1.5 text-[12.5px] font-medium opacity-90">
                                {eventDates}
                            </p>
                        </div>
                        <div className="rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-right backdrop-blur">
                            <p className="text-2xl leading-none font-extrabold tabular-nums">
                                {summary.attendance_rate}%
                            </p>
                            <p className="text-[9.5px] font-semibold tracking-[0.12em] uppercase opacity-85">
                                attendance
                            </p>
                        </div>
                    </div>
                </section>
                <div className="report-kpi-grid grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                <Kpi
                    label="Total guests"
                    value={formatNumber(summary.total_guests)}
                    hint="On the guest list"
                    icon={Users}
                    tone="bg-brand-subtle text-brand"
                />
                <Kpi
                    label="Accredited"
                    value={formatNumber(summary.accredited_guests)}
                    hint={`${formatNumber(summary.no_shows)} not yet`}
                    icon={CheckCircle2}
                    tone="bg-success-subtle text-success"
                />
                <Kpi
                    label="Attendance"
                    value={`${summary.attendance_rate}%`}
                    hint="Accredited ÷ total guests"
                    icon={BarChart3}
                    tone="bg-warning-subtle text-warning"
                />
                <Kpi
                    label="Check-ins today"
                    value={formatNumber(summary.checked_in_today)}
                    hint={`${formatNumber(
                        summary.total_checkins
                    )} in total`}
                    icon={TrendingUp}
                    tone="bg-info-subtle text-info"
                    pdfExclude
                />
            </div>

            <div className="report-pair-grid grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ReportPanel className="animate-enter">
                    <PanelTitle
                        icon={CheckCircle2}
                        title="Attendance"
                        description="Guests who have been accredited"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <AttendanceDonut
                            accredited={summary.accredited_guests}
                            total={summary.total_guests}
                            animate={false}
                        />
                        <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="text-[11px] text-muted-foreground">
                                Average per day
                            </span>
                            <span className="text-[12px] font-semibold tabular-nums">
                                {formatNumber(summary.avg_checkins_per_day)}
                            </span>
                        </div>
                    </div>
                </ReportPanel>

                <ReportPanel className="animate-enter">
                    <PanelTitle
                        icon={CalendarDays}
                        title="Daily attendance"
                        description="Check-ins and unique guests per event day"
                        action={
                            <div className="hidden items-center gap-3 text-[10px] text-muted-foreground sm:flex">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-brand" />
                                    Check-ins
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-chart-2/60" />
                                    Unique
                                </span>
                            </div>
                        }
                    />
                    <div className="px-2 pb-4 sm:px-4 sm:pb-5">
                        {summary.total_checkins === 0 ? (
                            <EmptyPanel>
                                No check-ins have been recorded yet.
                            </EmptyPanel>
                        ) : (
                            <DailyAttendanceChart
                                data={report.daily}
                                animate={false}
                            />
                        )}
                    </div>
                </ReportPanel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ReportPanel>
                    <PanelTitle
                        icon={Clock3}
                        title="Arrivals by hour"
                        description="When guests collect their accreditation"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {summary.total_checkins === 0 ? (
                            <EmptyPanel>
                                No check-ins have been recorded yet.
                            </EmptyPanel>
                        ) : (
                            <CheckinsChart
                                data={report.hourly.map((point) => ({
                                    time: formatHourLabel(point.hour),
                                    count: point.count,
                                }))}
                                animate={false}
                            />
                        )}
                    </div>
                </ReportPanel>

                <ReportPanel>
                    <PanelTitle
                        icon={BarChart3}
                        title="Guest mix"
                        description="Attendance by guest category"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <CategoryBreakdown data={report.by_category} />
                    </div>
                </ReportPanel>
            </div>

            <div className="report-locations-grid grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ReportPanel>
                    <PanelTitle
                        icon={MapPin}
                        title="Accreditation points"
                        description="Where badges were collected"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {report.by_location.length === 0 ? (
                            <EmptyPanel>No location data yet.</EmptyPanel>
                        ) : (
                            <ul className="space-y-4">
                                {report.by_location.map((location) => (
                                    <li key={location.name}>
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="min-w-0 truncate text-[12.5px]">
                                                {location.name}
                                            </span>
                                            <span className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums">
                                                {formatNumber(location.count)} ·{' '}
                                                {location.share}%
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out-soft"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        location.share
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </ReportPanel>

                <ReportPanel pdfExclude>
                    <PanelTitle
                        icon={Users}
                        title="Team performance"
                        description="Check-ins verified by each ambassador"
                    />
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        {report.by_ambassador.length === 0 ? (
                            <EmptyPanel>
                                Once the team starts scanning, performance will
                                appear here.
                            </EmptyPanel>
                        ) : (
                            <ul className="divide-y divide-border">
                                {report.by_ambassador.map(
                                    (ambassador, index) => (
                                        <li
                                            key={
                                                ambassador.email ||
                                                ambassador.name
                                            }
                                            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <span
                                                className={cn(
                                                    'flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold tabular-nums',
                                                    index === 0
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground'
                                                )}
                                            >
                                                {index + 1}
                                            </span>
                                            <Avatar
                                                name={ambassador.name}
                                                seed={ambassador.email}
                                                size="sm"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[12.5px] font-medium">
                                                    {ambassador.name}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {ambassador.email ||
                                                        'No email'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[12px] font-semibold tabular-nums">
                                                {formatNumber(ambassador.count)}
                                            </span>
                                        </li>
                                    )
                                )}
                            </ul>
                        )}
                    </div>
                </ReportPanel>
            </div>

            <ReportPanel>
                <PanelTitle
                    icon={Clock3}
                    title="Recent check-ins"
                    description="The latest guests through accreditation"
                />
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    {report.recent_checkins.length === 0 ? (
                        <EmptyPanel>No check-ins yet.</EmptyPanel>
                    ) : (
                        <ul className="divide-y divide-border">
                            {report.recent_checkins.map((item, index) => (
                                <li
                                    key={`${item.guest_name}-${item.date}-${index}`}
                                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                                >
                                    <Avatar
                                        name={item.guest_name}
                                        seed={`${item.guest_name}-${index}`}
                                        size="sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12.5px] font-medium">
                                            {item.guest_name}
                                        </p>
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {item.category ?? 'Uncategorized'}
                                            {' · '}
                                            {item.location ?? 'No location'}
                                            {' · '}
                                            {item.ambassador ?? 'Unassigned'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                                        {formatDate(item.date, 'MMM d')}
                                        {item.time
                                            ? ` · ${formatTime(item.time)}`
                                            : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </ReportPanel>

            <div
                data-pdf-exclude={
                    report.guests.length > 150 ? 'true' : undefined
                }
            >
                <ReportPanel>
                    <PanelTitle
                        icon={Users}
                        title="Guest list"
                        description={`${formatNumber(
                            report.guests.length
                        )} guests · ${formatNumber(
                            summary.accredited_guests
                        )} accredited${repeatCheckins > 0 ? ` · ${formatNumber(
                            repeatCheckins
                        )} repeat check-ins` : ''}`}
                        action={
                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                <Switch
                                    checked={showGuestList}
                                    onCheckedChange={setShowGuestList}
                                    aria-label="Show guest list in the report"
                                />
                                {showGuestList ? 'Shown' : 'Hidden'}
                            </div>
                        }
                    />
                    <div hidden={!showGuestList} data-pdf-unhide="true">
                        <GuestTable guests={report.guests} />
                    </div>
                    {!showGuestList ? (
                        <p
                            data-pdf-exclude="true"
                            className="px-4 pb-4 text-[12px] text-muted-foreground sm:px-5 sm:pb-5"
                        >
                            The guest list is hidden on this page and in the
                            downloaded HTML report. Turn the switch on to show
                            it again.
                        </p>
                    ) : null}
                </ReportPanel>
            </div>

            <p className="pb-2 text-center text-[11px] text-muted-foreground">
                Report generated{' '}
                {formatDate(report.generated_at, 'MMM d, yyyy · h:mm a')} ·{' '}
                {formatNumber(report.guests.length)} guests in the report
            </p>
            </div>
        </div>
    );
}
