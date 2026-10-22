import {
  differenceInCalendarDays,
  endOfDay,
  format,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';
import type { Event } from '@/types';

export type EventStatus = 'live' | 'upcoming' | 'ended' | 'unknown';

export function getEventStatus(event: Pick<Event, 'start_date' | 'end_date'>): EventStatus {
  const start = parseISO(event.start_date);
  const end = endOfDay(parseISO(event.end_date));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'unknown';
  }

  const now = new Date();
  if (isBefore(now, start)) return 'upcoming';
  if (isAfter(now, end)) return 'ended';
  return 'live';
}

export const eventStatusMeta: Record<
  EventStatus,
  { label: string; tone: 'success' | 'info' | 'neutral' }
> = {
  live: { label: 'Live', tone: 'success' },
  upcoming: { label: 'Upcoming', tone: 'info' },
  ended: { label: 'Ended', tone: 'neutral' },
  unknown: { label: 'Unknown', tone: 'neutral' },
};

export function formatEventDates(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Dates unavailable';
  }

  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return format(start, 'EEE, MMM d, yyyy');
  }

  if (format(start, 'yyyy-MM') === format(end, 'yyyy-MM')) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }

  if (format(start, 'yyyy') === format(end, 'yyyy')) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }

  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

export function formatDay(date: string) {
  const parsed = parseISO(date);
  return Number.isNaN(parsed.getTime()) ? date : format(parsed, 'EEE, MMM d');
}

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, pattern);
}

export function formatTime(time: string) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours)) return time;
  const date = new Date();
  date.setHours(hours, minutes || 0, 0, 0);
  return format(date, 'h:mm a');
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

export function formatCompact(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

export function formatHourLabel(hour: string) {
  if (!hour) return '';
  if (/^\d{1,2}:\d{2}/.test(hour)) {
    const [h, m] = hour.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m || 0, 0, 0);
    return format(date, 'ha').toLowerCase().replace(':00', '');
  }

  const parsed = parseISO(hour);
  if (!Number.isNaN(parsed.getTime())) {
    return format(parsed, 'ha').toLowerCase().replace(':00', '');
  }

  return hour;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(name?: string | null, fallback = '?') {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function daysUntil(date: string) {
  const parsed = parseISO(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return differenceInCalendarDays(parsed, new Date());
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

const avatarTones = [
  'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-300',
];

export function avatarTone(seed: string | number) {
  const text = String(seed);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 9973;
  }
  return avatarTones[hash % avatarTones.length];
}
