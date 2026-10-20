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
}

export interface DashboardStats {
    active_events: number;
    total_guests: number;
    today_checkins: number;
    total_ambassadors: number;
    hourly_checkins: { hour: string; count: number }[];
}

export interface EventAnalytics {
    event: Event;
    total_guests: number;
    checked_in_today: number;
    by_location: { location__name: string | null; count: number }[];
    by_ambassador: { verified_by__full_name: string; verified_by__email: string; count: number }[];
    by_category: { guest__category__name: string | null; count: number }[];
}

// Add to existing file:

export interface AmbassadorAssignment {
  id: number;
  user: User;
  event: number;
  assigned_at: string;
}

export interface EventAnalytics {
  event: Event;
  total_guests: number;
  checked_in_today: number;
  by_location: { location__name: string | null; count: number }[];
  by_ambassador: { verified_by__full_name: string; verified_by__email: string; count: number }[];
  by_category: { guest__category__name: string | null; count: number }[];
}