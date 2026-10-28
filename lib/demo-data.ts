import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';
import type {
    DashboardStats,
    Event,
    EventAnalytics,
    GuestCategory,
    Location,
    OrganizerApiKey,
    OrganizerApiKeyCreateResponse,
    User,
} from '@/types';
import {
    addDemoImportedGuests,
    addDemoSingleGuest,
    buildDemoEventReport,
    buildDemoReports,
    clearDemoReportCache,
} from '@/lib/demo-reports';
import type { DemoGuestInput } from '@/lib/demo-reports';

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const DEMO_USER: User = {
    id: 1,
    email: 'admin@accreditation.app',
    full_name: 'Amara Okonkwo',
    role: 'admin',
    first_login: false,
    is_active: true,
    phone: '+234 802 555 0100',
};

const today = new Date();
const day = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd');

function schedule(startOffset: number, endOffset: number, open = '09:00', close = '18:00') {
    const days = eachDayOfInterval({
        start: parseISO(day(startOffset)),
        end: parseISO(day(endOffset)),
    });
    return days.reduce<Record<string, { start: string; end: string }>>((acc, date) => {
        acc[format(date, 'yyyy-MM-dd')] = { start: open, end: close };
        return acc;
    }, {});
}

function locations(eventId: number, items: [string, string][]): Location[] {
    return items.map(([name, description], index) => ({
        id: eventId * 100 + index + 1,
        name,
        description,
        is_active: true,
        order: index,
    }));
}

function categories(eventId: number, items: [string, string, number][]): GuestCategory[] {
    return items.map(([name, color, priority], index) => ({
        id: eventId * 10 + index + 1,
        name,
        color,
        priority,
        is_active: true,
    }));
}

let demoEvents: Event[] = [
    {
        id: 1,
        name: 'Design Systems Summit',
        description:
            'Two days of talks, workshops, and hallway conversations for people building design systems at scale. Expect 2,000+ guests across four stages.',
        logo: null,
        location_text: 'Eko Convention Centre · Lagos',
        start_date: day(-1),
        end_date: day(1),
        daily_schedule: schedule(-1, 1, '08:30', '20:00'),
        enforce_hours: true,
        is_active: true,
        created_by: DEMO_USER,
        locations: locations(1, [
            ['Main Entrance', 'Badge collection and welcome desk'],
            ['Grand Hall', 'Keynotes and main-stage sessions'],
            ['VIP Lounge', 'Speakers, partners, and press'],
            ['Exhibition Floor', 'Partner booths and demos'],
            ['Media Centre', 'Press accreditation and interviews'],
            ['Green Room', 'Speaker preparation area'],
        ]),
        categories: categories(1, [
            ['VVIP', '#7C3AED', 4],
            ['VIP', '#F59E0B', 3],
            ['Press', '#0EA5E9', 2],
            ['Guest', '#64748B', 1],
        ]),
        custom_fields_schema: {
            fields: [
                { key: 'company', label: 'Company', type: 'text', required: true },
                { key: 'role', label: 'Job title', type: 'text', required: false },
            ],
        },
    },
    {
        id: 2,
        name: 'Founders Table',
        description:
            'An intimate evening for founders and operators. Dinner, a candid fireside chat, and room for the conversations that matter.',
        logo: null,
        location_text: 'The Wheatbaker · Ikoyi',
        start_date: day(0),
        end_date: day(0),
        daily_schedule: schedule(0, 0, '17:00', '22:30'),
        enforce_hours: true,
        is_active: true,
        created_by: DEMO_USER,
        locations: locations(2, [
            ['Reception', 'Arrival and welcome drinks'],
            ['Dining Room', 'Seated dinner and fireside chat'],
            ['Terrace', 'After-dinner conversations'],
        ]),
        categories: categories(2, [
            ['Patron', '#F59E0B', 3],
            ['Member', '#7C3AED', 2],
            ['Guest', '#64748B', 1],
        ]),
        custom_fields_schema: { fields: [] },
    },
    {
        id: 3,
        name: 'Future of Work Career Fair',
        description:
            'Connecting 1,000 early-career builders with teams hiring right now. Portfolio reviews, mock interviews, and open roles.',
        logo: null,
        location_text: 'Landmark Centre · Victoria Island',
        start_date: day(12),
        end_date: day(13),
        daily_schedule: schedule(12, 13, '09:00', '17:00'),
        enforce_hours: false,
        is_active: true,
        created_by: DEMO_USER,
        locations: locations(3, [
            ['Registration', 'Check-in and lanyard pickup'],
            ['Recruiter Hall', 'Company booths'],
            ['Studio A', 'Portfolio reviews'],
            ['Studio B', 'Mock interviews'],
        ]),
        categories: categories(3, [
            ['Recruiter', '#0EA5E9', 3],
            ['Candidate', '#22C55E', 2],
            ['Volunteer', '#F59E0B', 1],
        ]),
        custom_fields_schema: { fields: [] },
    },
    {
        id: 4,
        name: 'Product Leaders Retreat',
        description:
            'A working retreat for senior product leaders. Small group sessions, long walks, and no slide decks.',
        logo: null,
        location_text: 'La Campagne Tropicana · Ibeju-Lekki',
        start_date: day(34),
        end_date: day(36),
        daily_schedule: schedule(34, 36, '08:00', '21:00'),
        enforce_hours: true,
        is_active: true,
        created_by: DEMO_USER,
        locations: locations(4, [
            ['Arrivals', 'Welcome and room allocation'],
            ['Main Pavilion', 'Sessions and meals'],
            ['Beach Deck', 'Evening programming'],
        ]),
        categories: categories(4, [
            ['Fellow', '#7C3AED', 3],
            ['Speaker', '#F59E0B', 2],
            ['Guest', '#64748B', 1],
        ]),
        custom_fields_schema: { fields: [] },
    },
    {
        id: 5,
        name: 'Annual Gala 2025',
        description:
            'A celebration of the year behind us — awards, dinner, and dancing. Archived for reference.',
        logo: null,
        location_text: 'Oriental Hotel · Victoria Island',
        start_date: day(-27),
        end_date: day(-26),
        daily_schedule: schedule(-27, -26, '18:00', '23:30'),
        enforce_hours: false,
        is_active: false,
        created_by: DEMO_USER,
        locations: locations(5, [
            ['Grand Ballroom', 'Reception and dinner'],
            ['Stage', 'Awards ceremony'],
        ]),
        categories: categories(5, [
            ['Laureate', '#F59E0B', 3],
            ['Guest', '#64748B', 2],
            ['Staff', '#0EA5E9', 1],
        ]),
        custom_fields_schema: { fields: [] },
    },
];

let demoAmbassadors: User[] = [
    {
        id: 101,
        email: 'zainab.bello@accreditation.app',
        full_name: 'Zainab Bello',
        role: 'ambassador',
        first_login: false,
        is_active: true,
        phone: '+234 803 111 2044',
    },
    {
        id: 102,
        email: 'tobi.adeyemi@accreditation.app',
        full_name: 'Tobi Adeyemi',
        role: 'ambassador',
        first_login: false,
        is_active: true,
        phone: '+234 805 442 1180',
    },
    {
        id: 103,
        email: 'chiamaka.eze@accreditation.app',
        full_name: 'Chiamaka Eze',
        role: 'ambassador',
        first_login: false,
        is_active: false,
        phone: '+234 807 220 9931',
    },
    {
        id: 104,
        email: 'daniel.mensah@accreditation.app',
        full_name: 'Daniel Mensah',
        role: 'ambassador',
        first_login: false,
        is_active: true,
        phone: '+233 24 551 8820',
    },
    {
        id: 105,
        email: 'fatima.yusuf@accreditation.app',
        full_name: 'Fatima Yusuf',
        role: 'ambassador',
        first_login: false,
        is_active: true,
        phone: '+234 809 330 7712',
    },
    {
        id: 106,
        email: 'kunle.adebayo@accreditation.app',
        full_name: 'Kunle Adebayo',
        role: 'ambassador',
        first_login: false,
        is_active: true,
        phone: '+234 802 880 4471',
    },
    {
        id: 107,
        email: 'grace.okafor@accreditation.app',
        full_name: 'Grace Okafor',
        role: 'ambassador',
        first_login: false,
        is_active: false,
        phone: '+234 806 774 1209',
    },
    {
        id: 108,
        email: 'samuel.boateng@accreditation.app',
        full_name: 'Samuel Boateng',
        role: 'ambassador',
        first_login: false,
        is_active: true,
        phone: '+233 20 449 1187',
    },
];

const assignments: Record<number, number[]> = {
    1: [101, 102, 103, 104, 105, 106],
    2: [101, 105, 108],
    3: [],
    4: [],
    5: [102, 106],
};

function generateDemoApiKey(): string {
    const bytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    let value = '';
    for (const byte of bytes) value += byte.toString(36).padStart(2, '0');
    return `orgsk_${value.slice(0, 43)}`;
}

/** Demo-only store; the real backend filters keys per event. */
let demoApiKeys: (OrganizerApiKey & { eventId: number })[] = [];

const analyticsSeed: Record<number, { total: number; checked: number }> = {
    1: { total: 2200, checked: 892 },
    2: { total: 420, checked: 302 },
    3: { total: 1150, checked: 0 },
    4: { total: 180, checked: 0 },
    5: { total: 980, checked: 954 },
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildAnalytics(event: Event): EventAnalytics {
    const seed = analyticsSeed[event.id] ?? { total: 0, checked: 0 };
    const locationWeights = [0.34, 0.26, 0.15, 0.12, 0.08, 0.05];
    const categoryWeights = [0.16, 0.29, 0.18, 0.37];

    const assigned = (assignments[event.id] ?? [])
        .map((id) => demoAmbassadors.find((ambassador) => ambassador.id === id))
        .filter((ambassador): ambassador is User => Boolean(ambassador && ambassador.is_active));

    const counts = [214, 186, 152, 121, 98, 76, 54, 41];

    return {
        event,
        total_guests: seed.total,
        checked_in_today: seed.checked,
        by_location: event.locations.map((location, index) => ({
            location__name: location.name,
            count: Math.round(seed.checked * (locationWeights[index] ?? 0.05)),
        })),
        by_category: event.categories.map((category, index) => ({
            guest__category__name: category.name,
            count: Math.round(seed.total * (categoryWeights[index] ?? 0.1)),
        })),
        by_ambassador: assigned.map((ambassador, index) => ({
            verified_by__full_name: ambassador.full_name,
            verified_by__email: ambassador.email,
            count: counts[index] ?? 30,
        })),
    };
}

function stats(): DashboardStats {
    const now = new Date();
    const liveEvents = demoEvents.filter((event) => {
        const start = parseISO(event.start_date);
        const end = addDays(parseISO(event.end_date), 1);
        return now >= start && now < end;
    });

    return {
        active_events: liveEvents.length,
        total_guests: 3420,
        today_checkins: 1194,
        total_ambassadors: demoAmbassadors.length,
        hourly_checkins: [
            { hour: '08:00', count: 42 },
            { hour: '09:00', count: 96 },
            { hour: '10:00', count: 154 },
            { hour: '11:00', count: 121 },
            { hour: '12:00', count: 88 },
            { hour: '13:00', count: 143 },
            { hour: '14:00', count: 176 },
            { hour: '15:00', count: 132 },
            { hour: '16:00', count: 98 },
            { hour: '17:00', count: 74 },
            { hour: '18:00', count: 45 },
            { hour: '19:00', count: 19 },
            { hour: '20:00', count: 6 },
        ],
    };
}

function jsonBody<T>(options: RequestInit): T {
    try {
        return JSON.parse(String(options.body ?? '{}')) as T;
    } catch {
        return {} as T;
    }
}

export async function demoRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const method = (options.method ?? 'GET').toUpperCase();
    const path = endpoint.split('?')[0];
    await wait(220 + Math.round(Math.random() * 180));

    if (method === 'POST' && /^\/auth\/login\/?$/.test(path)) {
        return { access: 'demo-token', user: DEMO_USER } as T;
    }

    if (method === 'GET' && /^\/admin\/dashboard\/stats\/?$/.test(path)) {
        return stats() as T;
    }

    if (method === 'GET' && /^\/admin\/reports\/?$/.test(path)) {
        return buildDemoReports(
            demoEvents,
            demoAmbassadors,
            assignments,
            analyticsSeed
        ) as T;
    }

    const reportMatch = path.match(/^\/admin\/events\/(\d+)\/report\/?$/);
    if (method === 'GET' && reportMatch) {
        const event = demoEvents.find(
            (item) => item.id === Number(reportMatch[1])
        );
        if (!event) throw new Error('Event not found');
        return buildDemoEventReport(
            event,
            demoAmbassadors,
            assignments,
            analyticsSeed
        ) as T;
    }

    if (method === 'GET' && /^\/admin\/ambassadors\/list\/?$/.test(path)) {
        return [...demoAmbassadors] as T;
    }

    if (method === 'GET' && /^\/events\/?$/.test(path)) {
        return [...demoEvents].sort((a, b) => a.start_date.localeCompare(b.start_date)) as T;
    }

    if (method === 'POST' && /^\/events\/?$/.test(path)) {
        const body = jsonBody<Partial<Event>>(options);
        const id = Math.max(...demoEvents.map((event) => event.id)) + 1;
        const created: Event = {
            id,
            name: body.name ?? 'Untitled event',
            description: body.description ?? '',
            logo: null,
            location_text: body.location_text ?? '',
            start_date: body.start_date ?? day(0),
            end_date: body.end_date ?? day(0),
            daily_schedule: body.daily_schedule ?? {},
            enforce_hours: Boolean(body.enforce_hours),
            is_active: true,
            created_by: DEMO_USER,
            locations: (body.locations ?? []).map((location, index) => ({
                id: id * 100 + index + 1,
                name: location.name,
                description: location.description ?? '',
                is_active: true,
                order: index,
            })),
            categories: (body.categories ?? []).map((category, index) => ({
                id: id * 10 + index + 1,
                name: category.name,
                color: category.color,
                priority: category.priority,
            })),
            custom_fields_schema: body.custom_fields_schema ?? { fields: [] },
        };
        demoEvents = [...demoEvents, created];
        clearDemoReportCache();
        return created as T;
    }

    const eventMatch = path.match(/^\/events\/(\d+)\/?$/);
    if (method === 'DELETE' && eventMatch) {
        const eventId = Number(eventMatch[1]);
        demoEvents = demoEvents.filter((item) => item.id !== eventId);
        delete assignments[eventId];
        clearDemoReportCache();
        return {} as T;
    }

    if (method === 'GET' && eventMatch) {
        const event = demoEvents.find((item) => item.id === Number(eventMatch[1]));
        if (!event) throw new Error('Event not found');
        return {
            ...event,
            assigned_user_ids: assignments[event.id] ?? [],
        } as T;
    }

    if (method === 'PATCH' && eventMatch) {
        const eventId = Number(eventMatch[1]);
        const event = demoEvents.find((item) => item.id === eventId);
        if (!event) throw new Error('Event not found');

        const body = jsonBody<Partial<Event>>(options);
        const updated: Event = {
            ...event,
            ...body,
            id: event.id,
            created_by: event.created_by,
            locations: body.locations
                ? body.locations.map((location, index) => ({
                      id: location.id ?? eventId * 100 + index + 1,
                      name: location.name,
                      description: location.description ?? '',
                      is_active: true,
                      order: location.order ?? index,
                  }))
                : event.locations,
            categories: body.categories
                ? body.categories.map((category, index) => ({
                      id: category.id ?? eventId * 10 + index + 1,
                      name: category.name,
                      color: category.color,
                      priority: category.priority,
                      is_active: true,
                  }))
                : event.categories,
        };

        demoEvents = demoEvents.map((item) =>
            item.id === eventId ? updated : item
        );
        clearDemoReportCache();
        return updated as T;
    }

    const createGuestMatch = path.match(/^\/admin\/events\/(\d+)\/guests\/?$/);
    if (method === 'POST' && createGuestMatch) {
        const event = demoEvents.find(
            (item) => item.id === Number(createGuestMatch[1])
        );
        if (!event) throw new Error('Event not found');

        const body = jsonBody<DemoGuestInput>(options);
        const guest = addDemoSingleGuest(event, body);
        clearDemoReportCache();
        return guest as T;
    }

    const bulkGuestsMatch = path.match(/^\/admin\/events\/(\d+)\/guests\/bulk\/?$/);
    if (method === 'POST' && bulkGuestsMatch) {
        const event = demoEvents.find(
            (item) => item.id === Number(bulkGuestsMatch[1])
        );
        if (!event) throw new Error('Event not found');

        const body = jsonBody<{ guests?: DemoGuestInput[] }>(options);
        const guests = body.guests ?? [];
        if (guests.length === 0) {
            throw new Error('Provide a non-empty list of guests.');
        }

        const created = addDemoImportedGuests(event, guests);
        clearDemoReportCache();
        return {
            message: `Processed ${guests.length} guests. Created ${created} new records.`,
            created_count: created,
            skipped_count: guests.length - created,
            created_categories: [],
            errors: null,
        } as T;
    }

    const analyticsMatch = path.match(/^\/admin\/events\/(\d+)\/analytics\/?$/);
    if (method === 'GET' && analyticsMatch) {
        const event = demoEvents.find((item) => item.id === Number(analyticsMatch[1]));
        if (!event) throw new Error('Event not found');
        return buildAnalytics(event) as T;
    }

    const assignMatch = path.match(/^\/admin\/events\/(\d+)\/assign-bulk\/?$/);
    if (method === 'POST' && assignMatch) {
        const eventId = Number(assignMatch[1]);
        const body = jsonBody<{ user_ids?: number[] }>(options);
        assignments[eventId] = Array.from(
            new Set([...(assignments[eventId] ?? []), ...(body.user_ids ?? [])])
        );
        clearDemoReportCache();
        return {} as T;
    }

    if (method === 'DELETE' && assignMatch) {
        const eventId = Number(assignMatch[1]);
        const body = jsonBody<{ user_ids?: number[] }>(options);
        const remove = new Set(body.user_ids ?? []);
        assignments[eventId] = (assignments[eventId] ?? []).filter(
            (id) => !remove.has(id)
        );
        clearDemoReportCache();
        return { removed_count: remove.size } as T;
    }

    const ambassadorMatch = path.match(/^\/admin\/ambassadors\/(\d+)\/?$/);
    if (method === 'PATCH' && ambassadorMatch) {
        const ambassadorId = Number(ambassadorMatch[1]);
        const body = jsonBody<{ full_name?: string; phone?: string }>(options);
        let updated: User | undefined;
        demoAmbassadors = demoAmbassadors.map((item) => {
            if (item.id !== ambassadorId) return item;
            updated = {
                ...item,
                full_name: body.full_name?.trim() || item.full_name,
                phone: body.phone ?? item.phone,
            };
            return updated;
        });
        if (!updated) throw new Error('Ambassador not found');
        clearDemoReportCache();
        return updated as T;
    }

    if (method === 'DELETE' && ambassadorMatch) {
        const ambassadorId = Number(ambassadorMatch[1]);
        demoAmbassadors = demoAmbassadors.filter(
            (item) => item.id !== ambassadorId
        );
        for (const [eventId, userIds] of Object.entries(assignments)) {
            assignments[Number(eventId)] = userIds.filter(
                (id) => id !== ambassadorId
            );
        }
        clearDemoReportCache();
        return { message: 'Ambassador deleted.' } as T;
    }

    const apiKeysMatch = path.match(/^\/admin\/events\/(\d+)\/api-keys\/?$/);
    if (method === 'GET' && apiKeysMatch) {
        const eventId = Number(apiKeysMatch[1]);
        return demoApiKeys
            .filter((key) => key.eventId === eventId)
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .map((key) => ({
                id: key.id,
                organizer_name: key.organizer_name,
                key_prefix: key.key_prefix,
                is_active: key.is_active,
                created_at: key.created_at,
                last_used: key.last_used,
            })) as T;
    }

    if (method === 'POST' && apiKeysMatch) {
        const eventId = Number(apiKeysMatch[1]);
        const event = demoEvents.find((item) => item.id === eventId);
        if (!event) throw new Error('Event not found');
        const body = jsonBody<{ organizer_name?: string }>(options);
        const rawKey = generateDemoApiKey();
        const created: OrganizerApiKey = {
            id: demoApiKeys.length + 1,
            organizer_name: body.organizer_name?.trim() || 'Unnamed organizer',
            key_prefix: rawKey.slice(0, 8),
            is_active: true,
            created_at: new Date().toISOString(),
            last_used: null,
        };
        demoApiKeys = [...demoApiKeys, { ...created, eventId }];
        const result: OrganizerApiKeyCreateResponse = { ...created, api_key: rawKey };
        return result as T;
    }

    const apiKeyDetailMatch = path.match(/^\/admin\/events\/(\d+)\/api-keys\/(\d+)\/?$/);
    if (method === 'DELETE' && apiKeyDetailMatch) {
        const keyId = Number(apiKeyDetailMatch[2]);
        demoApiKeys = demoApiKeys.map((key) =>
            key.id === keyId ? { ...key, is_active: false } : key
        );
        return { message: 'API key revoked.' } as T;
    }

    const toggleMatch = path.match(/^\/admin\/ambassadors\/(\d+)\/toggle\/?$/);
    if (method === 'PATCH' && toggleMatch) {
        const ambassador = demoAmbassadors.find(
            (item) => item.id === Number(toggleMatch[1])
        );
        if (ambassador) {
            ambassador.is_active = !ambassador.is_active;
            clearDemoReportCache();
        }
        return { ...ambassador } as T;
    }

    if (method === 'POST' && /^\/admin\/ambassadors\/?$/.test(path)) {
        const body = jsonBody<Partial<User>>(options);
        const created: User = {
            id: Math.max(...demoAmbassadors.map((item) => item.id)) + 1,
            email: body.email ?? '',
            full_name: body.full_name ?? '',
            role: 'ambassador',
            first_login: true,
            is_active: true,
            phone: body.phone ?? '',
        };
        demoAmbassadors = [...demoAmbassadors, created];
        clearDemoReportCache();
        return created as T;
    }

    if (method === 'PATCH' && /^\/auth\/change-password\/?$/.test(path)) {
        await wait(400);
        return { message: 'Password updated successfully.' } as T;
    }

    const activityMatch = path.match(/^\/events\/(\d+)\/activity-log\/?$/);
    if (method === 'GET' && activityMatch) {
        const event = demoEvents.find(
            (item) => item.id === Number(activityMatch[1])
        );
        if (!event) throw new Error('Event not found');
        const report = buildDemoEventReport(
            event,
            demoAmbassadors,
            assignments,
            analyticsSeed
        );

        return report.recent_checkins.map((entry, index) => ({
            id: index + 1,
            guest_name: entry.guest_name,
            category_name: entry.category,
            verified_by_name: entry.ambassador,
            location_name: entry.location,
            date: entry.date,
            time: entry.time,
            is_accredited: true,
            kids_count: 0,
        })) as T;
    }

    throw new Error('This endpoint is not available in demo mode.');
}
