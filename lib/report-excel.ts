import type { Cell, Sheet } from 'write-excel-file/browser';
import type { EventReport, ReportSummary, ReportsResponse } from '@/types';
import { formatDate, getEventStatus, eventStatusMeta } from '@/lib/format';

const HEADER = {
    fontWeight: 'bold' as const,
    backgroundColor: '#F1F5F9',
    textColor: '#0F172A',
    borderColor: '#E2E8F0',
    borderStyle: 'thin' as const,
    align: 'left' as const,
};

const NUMBER_FORMAT = '#,##0';

function header(values: string[]): Cell[] {
    return values.map((value) => ({ ...HEADER, value }));
}

function cells(values: Cell[]): Cell[] {
    return values.map((value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'object' && !(value instanceof Date)) {
            return value;
        }
        return { value: value as string | number | boolean | Date };
    });
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

function eventRange(report: EventReport) {
    return `${formatDate(report.event.start_date)} – ${formatDate(
        report.event.end_date
    )}`;
}

function summarySheet(report: EventReport): Sheet<Blob> {
    const { summary } = report;

    const data: Cell[][] = [
        [
            {
                value: report.event.name,
                fontWeight: 'bold',
                fontSize: 16,
                columnSpan: 3,
                height: 28,
            },
        ],
        [
            {
                value: `${eventRange(report)}${
                    report.event.location_text
                        ? ` · ${report.event.location_text}`
                        : ''
                }`,
                textColor: '#64748B',
                columnSpan: 3,
            },
        ],
        [],
        header(['Metric', 'Value', 'Notes']),
        cells(['Total guests', summary.total_guests, 'On the guest list']),
        cells(['Accredited guests', summary.accredited_guests, 'At least one check-in']),
        cells([
            'Attendance rate',
            { value: summary.attendance_rate, format: '0.0"%"' },
            'Accredited guests ÷ total guests',
        ]),
        cells(['No shows', summary.no_shows, 'Not accredited yet']),
        cells(['Total check-ins', summary.total_checkins, 'Including repeat visits']),
        cells(['Check-ins today', summary.checked_in_today, 'Since midnight']),
        cells([
            'Average check-ins per day',
            summary.avg_checkins_per_day,
            'Across active event days',
        ]),
        cells(['Locations', summary.locations, 'Accreditation points']),
        cells(['Guest categories', summary.categories, 'Segments on the list']),
        cells(['Ambassadors', summary.ambassadors, 'Assigned to this event']),
        cells([
            'First check-in',
            summary.first_checkin_date
                ? formatDate(summary.first_checkin_date)
                : '—',
            '',
        ]),
        cells([
            'Last check-in',
            summary.last_checkin_at
                ? formatDate(summary.last_checkin_at, 'MMM d, yyyy · h:mm a')
                : '—',
            '',
        ]),
        cells([
            'Report generated',
            formatDate(report.generated_at, 'MMM d, yyyy · h:mm a'),
            '',
        ]),
    ];

    return {
        sheet: 'Summary',
        data,
        columns: [{ width: 30 }, { width: 26 }, { width: 38 }],
        showGridLines: false,
    };
}

function dailySheet(report: EventReport): Sheet<Blob> {
    const total = report.summary.total_checkins;

    const data: Cell[][] = [
        header(['Date', 'Check-ins', 'Unique guests', 'Share of check-ins']),
        ...report.daily.map((point) =>
            cells([
                formatDate(point.date, 'EEE, MMM d, yyyy'),
                point.checkins,
                point.guests,
                {
                    value:
                        total > 0
                            ? Math.round((point.checkins / total) * 1000) / 10
                            : 0,
                    format: '0.0"%"',
                },
            ])
        ),
        [],
        cells(['Total', report.summary.total_checkins, '', 100]),
    ];

    return {
        sheet: 'Daily attendance',
        data,
        columns: [{ width: 24 }, { width: 12 }, { width: 14 }, { width: 18 }],
        stickyRowsCount: 1,
    };
}

function categorySheet(report: EventReport): Sheet<Blob> {
    const data: Cell[][] = [
        header([
            'Category',
            'Guests',
            'Checked in',
            'Attendance %',
            'Check-ins',
        ]),
        ...report.by_category.map((row) =>
            cells([
                row.name,
                row.guests,
                row.checked_in,
                { value: row.rate, format: '0.0"%"' },
                row.checkins,
            ])
        ),
    ];

    return {
        sheet: 'Categories',
        data,
        columns: [
            { width: 24 },
            { width: 12 },
            { width: 13 },
            { width: 14 },
            { width: 12 },
        ],
        stickyRowsCount: 1,
    };
}

function locationSheet(report: EventReport): Sheet<Blob> {
    const data: Cell[][] = [
        header(['Location', 'Check-ins', 'Share']),
        ...report.by_location.map((row) =>
            cells([
                row.name,
                row.count,
                { value: row.share, format: '0.0"%"' },
            ])
        ),
    ];

    return {
        sheet: 'Locations',
        data,
        columns: [{ width: 30 }, { width: 12 }, { width: 12 }],
        stickyRowsCount: 1,
    };
}

function ambassadorSheet(report: EventReport): Sheet<Blob> {
    const data: Cell[][] = [
        header(['Ambassador', 'Email', 'Check-ins']),
        ...report.by_ambassador.map((row) =>
            cells([row.name, row.email, row.count])
        ),
    ];

    return {
        sheet: 'Team',
        data,
        columns: [{ width: 28 }, { width: 38 }, { width: 12 }],
        stickyRowsCount: 1,
    };
}

function guestSheet(report: EventReport): Sheet<Blob> {
    const customFields = report.custom_fields ?? [];

    const data: Cell[][] = [
        header([
            'Ticket',
            'Guest',
            'Category',
            'Email',
            'Phone',
            'Checked in',
            'Check-ins',
            'First check-in',
            'Last check-in',
            'Last location',
            ...customFields.map((field) => field.label),
        ]),
        ...report.guests.map((guest) =>
            cells([
                guest.ticket_number,
                guest.adult_names,
                guest.category ?? 'Uncategorized',
                guest.email,
                guest.phone,
                guest.checked_in ? 'Yes' : 'No',
                guest.checkins,
                guest.first_checkin_date
                    ? formatDate(guest.first_checkin_date)
                    : '',
                guest.last_checkin_date
                    ? `${formatDate(guest.last_checkin_date)}${
                          guest.last_checkin_time
                              ? ` · ${guest.last_checkin_time.slice(0, 5)}`
                              : ''
                      }`
                    : '',
                guest.location ?? '',
                ...customFields.map((field) => {
                    const value = guest.custom_data?.[field.key];
                    return value === undefined || value === null
                        ? ''
                        : String(value);
                }),
            ])
        ),
    ];

    return {
        sheet: 'Guests',
        data,
        columns: [
            { width: 18 },
            { width: 26 },
            { width: 16 },
            { width: 32 },
            { width: 18 },
            { width: 11 },
            { width: 11 },
            { width: 16 },
            { width: 24 },
            { width: 20 },
            ...customFields.map(() => ({ width: 20 })),
        ],
        stickyRowsCount: 1,
    };
}

function baseName(report: EventReport) {
    return `${slugify(report.event.name)}-report`;
}

export async function downloadEventReport(report: EventReport) {
    const { default: writeXlsxFile } = await import('write-excel-file/browser');

    await writeXlsxFile(
        [
            summarySheet(report),
            dailySheet(report),
            categorySheet(report),
            locationSheet(report),
            ambassadorSheet(report),
            guestSheet(report),
        ],
        { fontFamily: 'Inter' }
    ).toFile(`${baseName(report)}.xlsx`);
}

export async function downloadReportsOverview(response: ReportsResponse) {
    const { default: writeXlsxFile } = await import('write-excel-file/browser');

    const data: Cell[][] = [
        [
            {
                value: 'Accreditation reports',
                fontWeight: 'bold',
                fontSize: 16,
                columnSpan: 10,
                height: 28,
            },
        ],
        [
            {
                value: `${response.totals.events} events · ${formatDate(
                    new Date()
                )}`,
                textColor: '#64748B',
                columnSpan: 10,
            },
        ],
        [],
        header([
            'Event',
            'Dates',
            'Location',
            'Status',
            'Guests',
            'Accredited',
            'Attendance %',
            'Check-ins',
            'Check-ins today',
            'Team',
        ]),
        ...response.reports.map((report: ReportSummary) => {
            const status = eventStatusMeta[getEventStatus(report.event)];

            return cells([
                report.event.name,
                `${formatDate(report.event.start_date)} – ${formatDate(
                    report.event.end_date
                )}`,
                report.event.location_text || '',
                status.label,
                report.total_guests,
                report.accredited_guests,
                { value: report.attendance_rate, format: '0.0"%"' },
                report.total_checkins,
                report.checked_in_today,
                report.ambassadors,
            ]);
        }),
        [],
        [
            {
                value: 'All events',
                fontWeight: 'bold',
                borderColor: '#E2E8F0',
                borderStyle: 'thin',
            },
            null,
            null,
            null,
            {
                value: response.totals.total_guests,
                fontWeight: 'bold',
                format: NUMBER_FORMAT,
                borderColor: '#E2E8F0',
                borderStyle: 'thin',
            },
            {
                value: response.totals.accredited_guests,
                fontWeight: 'bold',
                format: NUMBER_FORMAT,
                borderColor: '#E2E8F0',
                borderStyle: 'thin',
            },
            {
                value: response.totals.attendance_rate,
                fontWeight: 'bold',
                format: '0.0"%"',
                borderColor: '#E2E8F0',
                borderStyle: 'thin',
            },
            {
                value: response.totals.total_checkins,
                fontWeight: 'bold',
                format: NUMBER_FORMAT,
                borderColor: '#E2E8F0',
                borderStyle: 'thin',
            },
            {
                value: response.totals.checked_in_today,
                fontWeight: 'bold',
                format: NUMBER_FORMAT,
                borderColor: '#E2E8F0',
                borderStyle: 'thin',
            },
            null,
        ],
    ];

    await writeXlsxFile(
        [
            {
                sheet: 'Reports',
                data,
                columns: [
                    { width: 32 },
                    { width: 30 },
                    { width: 28 },
                    { width: 12 },
                    { width: 10 },
                    { width: 12 },
                    { width: 14 },
                    { width: 12 },
                    { width: 16 },
                    { width: 8 },
                ],
                stickyRowsCount: 1,
                showGridLines: false,
            },
        ],
        { fontFamily: 'Inter' }
    ).toFile(`accreditation-reports-${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
