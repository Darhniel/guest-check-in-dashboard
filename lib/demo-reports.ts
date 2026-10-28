import { eachDayOfInterval, format, parseISO } from 'date-fns';
import type {
    Event,
    EventReport,
    ReportAmbassadorRow,
    ReportCategoryRow,
    ReportDailyPoint,
    ReportGuest,
    ReportLocationRow,
    ReportSummary,
    ReportsResponse,
    ReportsTotals,
    User,
} from '@/types';

type Seed = { total: number; checked: number };
type SeedMap = Record<number, Seed>;
type AssignmentMap = Record<number, number[]>;

const DATE_KEY = 'yyyy-MM-dd';

const FIRST_NAMES = [
    'Adewale', 'Zainab', 'Tobi', 'Chiamaka', 'Daniel', 'Fatima',
    'Kunle', 'Grace', 'Samuel', 'Amara', 'Ifeoma', 'Emeka',
    'Ngozi', 'Yemi', 'Bisi', 'Kelechi', 'Nneka', 'Segun',
    'Halima', 'Chinedu', 'Funke', 'Musa', 'Adaeze', 'Bolaji',
    'Similoluwa', 'Efe', 'Kemi', 'Uche', 'Temi', 'Damilola',
    'Chioma', 'Ibrahim', 'Ronke', 'Nnamdi', 'Ada', 'Jide',
    'Sade', 'Obinna', 'Mariam', 'Femi', 'Yinka', 'Bola',
    'Tunde', 'Ijeoma', 'Sani', 'Yetunde', 'Chukwudi', 'Amina',
];

const LAST_NAMES = [
    'Okonkwo', 'Bello', 'Adeyemi', 'Eze', 'Mensah', 'Yusuf',
    'Adebayo', 'Okafor', 'Boateng', 'Nwosu', 'Balogun', 'Osei',
    'Abubakar', 'Chukwu', 'Adeleke', 'Mohammed', 'Ibe', 'Achebe',
    'Sanusi', 'Obi', 'Lawal', 'Mbah', 'Ojo', 'Salami',
    'Udo', 'Ogunleye', 'Oyelaran', 'Kamara', 'Diallo', 'Sow',
    'Ndiaye', 'Traore', 'Ouedraogo', 'Kone', 'Akin', 'Ekpo',
    'Danjuma', 'Sule', 'Anya', 'Eyo', 'Uzo', 'Oni',
    'Ade', 'Bamidele', 'Nnaji', 'Umeh', 'Jallow', 'Sesay',
];

const COMPANIES = [
    'Northwind', 'Arcadia', 'Lumen Labs', 'Kestrel',
    'Yellow Brick', 'Tandem', 'Meridian', 'Foundry',
];

const ROLES = [
    'Product Designer', 'Engineer', 'Founder', 'Marketing Lead',
    'Researcher', 'Operations', 'Journalist', 'Partner',
];

interface CheckinRecord {
    guestIndex: number;
    date: string;
    time: string;
    location: string | null;
    ambassador: User | null;
}

const reportCache = new Map<string, EventReport>();

/** Guests imported through the demo CSV flow, keyed by event. */
const importedGuests = new Map<number, ReportGuest[]>();

export interface DemoGuestInput {
    names?: string;
    /** @deprecated accepted so older demo payloads keep working. */
    adult_names?: string;
    email?: string;
    phone?: string;
    category_name?: string;
    spouse_name?: string;
    nanny_name?: string;
    nanny_count?: number;
    allergies?: string;
    kids?: { name?: string; age?: number | string; gender?: string }[];
}

/** Shared row builder for the demo import and manual-entry flows. */
function buildDemoGuest(
    event: Event,
    guest: DemoGuestInput,
    index: number
): ReportGuest | null {
    const name = (guest.names ?? guest.adult_names ?? '').trim();
    if (!name) return null;

    const email = (guest.email ?? '').trim();
    const phone = (guest.phone ?? '').trim();
    // Name plus email or phone is the same rule the API enforces.
    if (!email && !phone) return null;

    const requested = (guest.category_name ?? '').trim().toLowerCase();
    const category = requested
        ? event.categories.find((item) => item.name.toLowerCase() === requested)
        : undefined;

    return {
        id: event.id * 10000 + 90000 + index + 1,
        ticket_number: `EVT-${event.id}-IMP${String(index + 1).padStart(4, '0')}`,
        names: name,
        email,
        phone,
        category: category?.name ?? null,
        category_color: category?.color ?? null,
        kids_count: Array.isArray(guest.kids)
            ? guest.kids.filter((kid) => kid?.name && Number(kid?.age) > 0).length
            : 0,
        custom_data: {},
        checked_in: false,
        checkins: 0,
        first_checkin_date: null,
        last_checkin_date: null,
        last_checkin_time: null,
        location: null,
    };
}

function isDemoDuplicate(existing: ReportGuest[], guest: DemoGuestInput) {
    const name = (guest.names ?? guest.adult_names ?? '').trim();
    const email = (guest.email ?? '').trim();
    return existing.some((item) =>
        email
            ? item.email.toLowerCase() === email.toLowerCase()
            : item.names.toLowerCase() === name.toLowerCase()
    );
}

/**
 * Demo equivalent of POST /admin/events/<id>/guests/bulk/ — mirrors the
 * backend's dedupe and name-plus-contact rules so the preview behaves like
 * production.
 */
export function addDemoImportedGuests(
    event: Event,
    guests: DemoGuestInput[]
): number {
    const existing = importedGuests.get(event.id) ?? [];
    let added = 0;

    for (const guest of guests) {
        const row = buildDemoGuest(event, guest, existing.length);
        if (!row || isDemoDuplicate(existing, guest)) continue;
        existing.push(row);
        added += 1;
    }

    importedGuests.set(event.id, existing);
    return added;
}

/**
 * Demo equivalent of POST /admin/events/<id>/guests/ — adds one manually
 * entered guest and returns the shape the real endpoint responds with.
 */
export function addDemoSingleGuest(event: Event, guest: DemoGuestInput) {
    const existing = importedGuests.get(event.id) ?? [];
    const name = (guest.names ?? guest.adult_names ?? '').trim();
    const email = (guest.email ?? '').trim();
    const phone = (guest.phone ?? '').trim();

    if (!name) {
        throw new Error('Names: At least one guest name is required.');
    }
    if (!email && !phone) {
        throw new Error('Email: Provide an email address or a phone number.');
    }
    if (isDemoDuplicate(existing, guest)) {
        throw new Error(
            email
                ? 'A guest with this email address is already on this event.'
                : 'A guest with this name (and no email) is already on this event.'
        );
    }

    const row = buildDemoGuest(event, guest, existing.length);
    if (!row) throw new Error('We could not add that guest.');

    existing.push(row);
    importedGuests.set(event.id, existing);

    return {
        message: 'Guest added.',
        id: row.id,
        names: row.names,
        adult_names: row.names,
        spouse_name: (guest.spouse_name ?? '').trim(),
        email: row.email,
        phone: row.phone,
        nanny_name: (guest.nanny_name ?? '').trim(),
        nanny_count: Math.max(0, Number(guest.nanny_count) || 0),
        allergies: (guest.allergies ?? '').trim(),
        category_name: row.category,
        kids: (guest.kids ?? [])
            .filter((kid) => kid?.name && Number(kid?.age) >= 0)
            .map((kid, index) => ({
                id: index + 1,
                name: String(kid.name).trim(),
                age: Number(kid.age),
                gender: kid.gender ?? '',
            })),
        ticket_number: row.ticket_number,
        custom_data: {},
        is_checked_in_today: false,
    };
}

export function clearDemoReportCache() {
    reportCache.clear();
}

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function noise(seed: number) {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
}

function todayKey() {
    return format(new Date(), DATE_KEY);
}

function eventDays(event: Event): string[] {
    const start = parseISO(event.start_date);
    const end = parseISO(event.end_date);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start > end
    ) {
        return [];
    }

    return eachDayOfInterval({ start, end })
        .slice(0, 62)
        .map((date) => format(date, DATE_KEY));
}

function hourWindow(event: Event) {
    const starts: number[] = [];
    const ends: number[] = [];

    for (const window of Object.values(event.daily_schedule ?? {})) {
        const start = Number(window?.start?.split(':')[0]);
        const end = Number(window?.end?.split(':')[0]);
        if (Number.isFinite(start)) starts.push(start);
        if (Number.isFinite(end)) ends.push(end);
    }

    const from = starts.length ? Math.min(...starts) : 8;
    const closing = ends.length ? Math.max(...ends) - 1 : 19;
    const to = Math.max(from, closing);

    return { from, to };
}

function weightedIndex(seedValue: number, length: number, weights?: number[]) {
    if (length <= 0) return 0;
    if (!weights || weights.length < length) {
        return Math.min(length - 1, Math.floor(noise(seedValue) * length));
    }

    const usable = weights.slice(0, length);
    const total = usable.reduce((sum, weight) => sum + weight, 0);
    let point = noise(seedValue) * total;

    for (let index = 0; index < usable.length; index += 1) {
        point -= usable[index];
        if (point <= 0) return index;
    }

    return length - 1;
}

const LOCATION_WEIGHTS = [0.34, 0.24, 0.16, 0.12, 0.08, 0.06];
const AMBASSADOR_WEIGHTS = [0.26, 0.22, 0.19, 0.14, 0.11, 0.08];

function attendanceOrder(event: Event, seed: Seed, accredited: number) {
    return Array.from({ length: seed.total }, (_, index) => {
        const category = categoryFor(index, event);
        const weight = category ? 1 + category.priority * 0.3 : 1;
        return { index, key: noise(index * 1.618 + 0.5) / weight };
    })
        .sort((a, b) => a.key - b.key)
        .slice(0, accredited)
        .map((entry) => entry.index);
}

function totalCheckins(seed: Seed, event: Event) {
    const checked = Math.max(0, Math.min(seed.checked, seed.total));
    const extra = eventDays(event).length > 1 ? Math.round(checked * 0.12) : 0;
    return checked + extra;
}

function guestName(index: number) {
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const last =
        LAST_NAMES[
            Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length
        ];

    return { first, last, full: `${first} ${last}` };
}

function categoryFor(index: number, event: Event) {
    const categories = event.categories;
    if (categories.length === 0) return null;

    const weights =
        categories.length >= 4
            ? [0.36, 0.27, 0.21, 0.16]
            : categories.length === 3
              ? [0.44, 0.33, 0.23]
              : [0.62, 0.38];

    const point = (index % 100) / 100;
    let cumulative = 0;

    for (let i = 0; i < categories.length; i += 1) {
        cumulative += weights[i] ?? 1 / categories.length;
        if (point < cumulative) return categories[i];
    }

    return categories[categories.length - 1];
}

function activeAmbassadors(eventId: number, ambassadors: User[], assignments: AssignmentMap) {
    return (assignments[eventId] ?? [])
        .map((id) => ambassadors.find((item) => item.id === id))
        .filter(
            (item): item is User => Boolean(item && item.is_active !== false)
        );
}

function buildRecords(
    event: Event,
    seed: Seed,
    ambassadors: User[],
    assignments: AssignmentMap
): CheckinRecord[] {
    const today = todayKey();
    const days = eventDays(event).filter((date) => date <= today);
    const accredited = Math.max(0, Math.min(seed.checked, seed.total));
    const total = totalCheckins(seed, event);

    if (days.length === 0 || total === 0) return [];

    const { from, to } = hourWindow(event);
    const span = to - from + 1;
    const assigned = activeAmbassadors(event.id, ambassadors, assignments);
    const order = attendanceOrder(event, seed, accredited);
    const records: CheckinRecord[] = [];

    for (let index = 0; index < total; index += 1) {
        const guestIndex =
            index < accredited ? order[index] : order[index - accredited];
        const dayIndex = Math.min(
            days.length - 1,
            Math.floor((index / total) * days.length)
        );
        const hour = Math.min(
            to,
            from + Math.floor(noise(index * 7.3 + 2) * span)
        );
        const minute = Math.floor(noise(index * 3.1 + 5) * 60);

        records.push({
            guestIndex,
            date: days[dayIndex],
            time: `${pad(hour)}:${pad(minute)}`,
            location:
                event.locations.length > 0
                    ? event.locations[
                          weightedIndex(
                              guestIndex * 2.7 + 1,
                              event.locations.length,
                              LOCATION_WEIGHTS
                          )
                      ].name
                    : null,
            ambassador:
                assigned.length > 0
                    ? assigned[
                          weightedIndex(
                              guestIndex * 4.3 + 2,
                              assigned.length,
                              AMBASSADOR_WEIGHTS
                          )
                      ]
                    : null,
        });
    }

    return records;
}

function buildReport(
    event: Event,
    ambassadors: User[],
    assignments: AssignmentMap,
    seed: Seed
): EventReport {
    const key = `${event.id}|${event.start_date}|${event.end_date}|${
        event.categories.length
    }|${(assignments[event.id] ?? []).join(',')}|${
        (importedGuests.get(event.id) ?? []).length
    }`;
    const cached = reportCache.get(key);
    if (cached) return cached;

    const today = todayKey();
    const days = eventDays(event);
    const records = buildRecords(event, seed, ambassadors, assignments);

    const byGuest = new Map<number, CheckinRecord[]>();
    for (const record of records) {
        const list = byGuest.get(record.guestIndex);
        if (list) list.push(record);
        else byGuest.set(record.guestIndex, [record]);
    }

    const guests: ReportGuest[] = [];
    for (let index = 0; index < seed.total; index += 1) {
        const name = guestName(index);
        const category = categoryFor(index, event);
        const checkins = (byGuest.get(index) ?? []).sort((a, b) =>
            `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
        );
        const first = checkins[0];
        const last = checkins[checkins.length - 1];

        guests.push({
            id: event.id * 10000 + index + 1,
            ticket_number: `EVT-${event.id}-${String(index + 1).padStart(5, '0')}`,
            names: name.full,
            email: `${name.first}.${name.last}${index + 1}@example.com`.toLowerCase(),
            phone: `+234 80${String((index * 37) % 10)} ${String(
                100 + ((index * 13) % 900)
            )} ${String(1000 + ((index * 29) % 9000))}`,
            category: category?.name ?? null,
            category_color: category?.color ?? null,
            kids_count: index % 17 === 0 ? 1 + (index % 3) : 0,
            custom_data:
                event.custom_fields_schema?.fields?.length && index < 400
                    ? {
                          company: COMPANIES[index % COMPANIES.length],
                          role: ROLES[(index * 3) % ROLES.length],
                      }
                    : {},
            checked_in: checkins.length > 0,
            checkins: checkins.length,
            first_checkin_date: first?.date ?? null,
            last_checkin_date: last?.date ?? null,
            last_checkin_time: last?.time ?? null,
            location: last?.location ?? null,
        });
    }

    // Guests uploaded through the demo CSV importer sit alongside the
    // generated ones, so the register and totals stay consistent.
    const imported = importedGuests.get(event.id) ?? [];
    if (imported.length > 0) guests.push(...imported);

    const categoryStats = new Map<
        string,
        { guests: number; checked: number; checkins: number }
    >();

    for (const guest of guests) {
        const name = guest.category ?? 'Uncategorized';
        const entry = categoryStats.get(name) ?? {
            guests: 0,
            checked: 0,
            checkins: 0,
        };
        entry.guests += 1;
        if (guest.checked_in) entry.checked += 1;
        entry.checkins += guest.checkins;
        categoryStats.set(name, entry);
    }

    const by_category: ReportCategoryRow[] = event.categories.map((category) => {
        const stats = categoryStats.get(category.name) ?? {
            guests: 0,
            checked: 0,
            checkins: 0,
        };

        return {
            id: category.id,
            name: category.name,
            color: category.color,
            guests: stats.guests,
            checked_in: stats.checked,
            checkins: stats.checkins,
            rate:
                stats.guests > 0
                    ? Math.round((stats.checked / stats.guests) * 1000) / 10
                    : 0,
        };
    });

    const uncategorized = categoryStats.get('Uncategorized');
    if (uncategorized && uncategorized.guests > 0) {
        by_category.push({
            id: null,
            name: 'Uncategorized',
            color: '#94A3B8',
            guests: uncategorized.guests,
            checked_in: uncategorized.checked,
            checkins: uncategorized.checkins,
            rate:
                Math.round((uncategorized.checked / uncategorized.guests) * 1000) /
                10,
        });
    }

    const locationCounts = new Map<string, number>();
    for (const record of records) {
        const name = record.location ?? 'No location';
        locationCounts.set(name, (locationCounts.get(name) ?? 0) + 1);
    }

    const by_location: ReportLocationRow[] = [...locationCounts.entries()]
        .map(([name, count]) => ({
            name,
            count,
            share:
                records.length > 0
                    ? Math.round((count / records.length) * 1000) / 10
                    : 0,
        }))
        .sort((a, b) => b.count - a.count);

    const ambassadorCounts = new Map<
        string,
        { name: string; email: string; count: number }
    >();
    for (const record of records) {
        if (!record.ambassador) continue;
        const email = record.ambassador.email;
        const entry = ambassadorCounts.get(email) ?? {
            name: record.ambassador.full_name || email,
            email,
            count: 0,
        };
        entry.count += 1;
        ambassadorCounts.set(email, entry);
    }

    const by_ambassador: ReportAmbassadorRow[] = [...ambassadorCounts.values()].sort(
        (a, b) => b.count - a.count
    );

    const daily: ReportDailyPoint[] = days.map((date) => {
        const dayRecords = records.filter((record) => record.date === date);
        return {
            date,
            checkins: dayRecords.length,
            guests: new Set(dayRecords.map((record) => record.guestIndex)).size,
        };
    });

    const { from, to } = hourWindow(event);
    const hourly = Array.from({ length: to - from + 1 }, (_, offset) => {
        const hour = from + offset;
        return {
            hour: `${pad(hour)}:00`,
            count: records.filter(
                (record) => Number(record.time.slice(0, 2)) === hour
            ).length,
        };
    });

    const recent_checkins = [...records]
        .sort((a, b) =>
            `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)
        )
        .slice(0, 12)
        .map((record) => {
            const guest = guests[record.guestIndex];
            return {
                guest_name: guest?.names ?? 'Guest',
                category: guest?.category ?? null,
                location: record.location,
                ambassador: record.ambassador?.full_name ?? null,
                date: record.date,
                time: record.time,
            };
        });

    const accredited_guests = guests.filter((guest) => guest.checked_in).length;
    const total_guests = guests.length;
    const daysWithCheckins = daily.filter((point) => point.checkins > 0).length;
    const firstRecord = [...records].sort((a, b) =>
        `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    )[0];
    const lastRecord = [...records].sort((a, b) =>
        `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)
    )[0];

    const report: EventReport = {
        event,
        generated_at: new Date().toISOString(),
        summary: {
            total_guests,
            accredited_guests,
            total_checkins: records.length,
            checked_in_today: records.filter((record) => record.date === today)
                .length,
            attendance_rate:
                total_guests > 0
                    ? Math.round((accredited_guests / total_guests) * 1000) / 10
                    : 0,
            no_shows: Math.max(0, total_guests - accredited_guests),
            locations: event.locations.length,
            categories: event.categories.length,
            ambassadors: activeAmbassadors(event.id, ambassadors, assignments).length,
            first_checkin_date: firstRecord?.date ?? null,
            last_checkin_at: lastRecord
                ? `${lastRecord.date}T${lastRecord.time}:00`
                : null,
            avg_checkins_per_day:
                daysWithCheckins > 0
                    ? Math.round((records.length / daysWithCheckins) * 10) / 10
                    : 0,
        },
        daily,
        hourly,
        by_category,
        by_location,
        by_ambassador,
        recent_checkins,
        guests,
        custom_fields: event.custom_fields_schema?.fields ?? [],
    };

    reportCache.set(key, report);
    return report;
}

function summaryOf(report: EventReport): ReportSummary {
    return {
        event: report.event,
        ...report.summary,
        daily: report.daily,
    };
}

export function buildDemoReports(
    events: Event[],
    ambassadors: User[],
    assignments: AssignmentMap,
    seeds: SeedMap
): ReportsResponse {
    const reports = events.map((event) =>
        summaryOf(
            buildReport(
                event,
                ambassadors,
                assignments,
                seeds[event.id] ?? { total: 0, checked: 0 }
            )
        )
    );

    const totals: ReportsTotals = {
        events: reports.length,
        total_guests: 0,
        accredited_guests: 0,
        total_checkins: 0,
        checked_in_today: 0,
        attendance_rate: 0,
    };

    for (const report of reports) {
        totals.total_guests += report.total_guests;
        totals.accredited_guests += report.accredited_guests;
        totals.total_checkins += report.total_checkins;
        totals.checked_in_today += report.checked_in_today;
    }

    totals.attendance_rate =
        totals.total_guests > 0
            ? Math.round(
                  (totals.accredited_guests / totals.total_guests) * 1000
              ) / 10
            : 0;

    return { reports, totals };
}

export function buildDemoEventReport(
    event: Event,
    ambassadors: User[],
    assignments: AssignmentMap,
    seeds: SeedMap
): EventReport {
    return buildReport(
        event,
        ambassadors,
        assignments,
        seeds[event.id] ?? { total: 0, checked: 0 }
    );
}
