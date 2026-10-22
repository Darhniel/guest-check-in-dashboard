export interface User {
    id: number;
    email: string;
    full_name: string;
    role: 'admin' | 'ambassador';
    first_login: boolean;
    is_active?: boolean;
    phone?: string;
}

export interface Location {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    order: number;
}

export interface GuestCategory {
    id: number;
    name: string;
    color: string;
    priority: number;
    is_active?: boolean;
}

export interface CustomField {
    key: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
}

export interface Event {
    id: number;
    name: string;
    description: string;
    logo: string | null;
    location_text: string;
    start_date: string;
    end_date: string;
    daily_schedule: Record<string, { start: string; end: string }>;
    enforce_hours: boolean;
    is_active: boolean;
    created_by: User;
    locations: Location[];
    categories: GuestCategory[];
    custom_fields_schema?: { fields: CustomField[] };
    /** Some API responses include assignments inline. */
    assigned_user_ids?: number[];
    ambassador_ids?: number[];
    ambassadors?: User[];
    assigned_ambassadors?: User[];
}

export interface DashboardStats {
    active_events: number;
    total_guests: number;
    today_checkins: number;
    total_ambassadors: number;
    hourly_checkins: { hour: string; count: number }[];
}

export interface OrganizerApiKey {
    id: number;
    organizer_name: string;
    key_prefix: string;
    is_active: boolean;
    created_at: string;
    last_used: string | null;
}

export interface OrganizerApiKeyCreateResponse extends OrganizerApiKey {
    /** Returned once, immediately after creation. Never sent again. */
    api_key: string;
}

export interface EventAnalytics {
    event: Event;
    total_guests: number;
    checked_in_today: number;
    by_location: { location__name: string | null; count: number }[];
    by_ambassador: {
        verified_by__full_name: string;
        verified_by__email: string;
        count: number;
    }[];
    by_category: { guest__category__name: string | null; count: number }[];
}

export interface AmbassadorAssignment {
    id: number;
    user: User;
    event: number;
    assigned_at: string;
}

export interface AccreditationLogEntry {
    id: number;
    guest_name: string;
    category_name: string | null;
    verified_by_name: string | null;
    location_name: string | null;
    date: string;
    time: string;
    is_accredited: boolean;
    kids_count: number;
}

export interface ReportDailyPoint {
    date: string;
    checkins: number;
    guests: number;
}

export interface ReportCategoryRow {
    id: number | null;
    name: string;
    color: string;
    guests: number;
    checked_in: number;
    checkins: number;
    rate: number;
}

export interface ReportLocationRow {
    name: string;
    count: number;
    share: number;
}

export interface ReportAmbassadorRow {
    name: string;
    email: string;
    count: number;
}

export interface ReportRecentCheckin {
    guest_name: string;
    category: string | null;
    location: string | null;
    ambassador: string | null;
    date: string;
    time: string | null;
}

export interface ReportGuest {
    id: number;
    ticket_number: string;
    adult_names: string;
    email: string;
    phone: string;
    category: string | null;
    category_color: string | null;
    kids_count: number;
    custom_data: Record<string, unknown>;
    checked_in: boolean;
    checkins: number;
    first_checkin_date: string | null;
    last_checkin_date: string | null;
    last_checkin_time: string | null;
    location: string | null;
}

export interface ReportCustomField {
    key: string;
    label: string;
    type?: string;
    required?: boolean;
    options?: string[];
}

export interface ReportSummary {
    event: Event;
    total_guests: number;
    accredited_guests: number;
    total_checkins: number;
    checked_in_today: number;
    attendance_rate: number;
    no_shows: number;
    locations: number;
    categories: number;
    ambassadors: number;
    first_checkin_date: string | null;
    last_checkin_at: string | null;
    avg_checkins_per_day: number;
    daily: ReportDailyPoint[];
}

export interface ReportsTotals {
    events: number;
    total_guests: number;
    accredited_guests: number;
    total_checkins: number;
    checked_in_today: number;
    attendance_rate: number;
}

export interface ReportsResponse {
    reports: ReportSummary[];
    totals: ReportsTotals;
}

export interface EventReport {
    event: Event;
    generated_at: string;
    summary: Omit<ReportSummary, 'event' | 'daily'>;
    daily: ReportDailyPoint[];
    hourly: { hour: string; count: number }[];
    by_category: ReportCategoryRow[];
    by_location: ReportLocationRow[];
    by_ambassador: ReportAmbassadorRow[];
    recent_checkins: ReportRecentCheckin[];
    guests: ReportGuest[];
    custom_fields: ReportCustomField[];
}
