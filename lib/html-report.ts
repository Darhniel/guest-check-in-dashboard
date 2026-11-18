/**
 * Builds a single, self-contained HTML infographic report for an event.
 *
 * The output is one HTML document with:
 *  - All CSS inlined in a <style> block (themed from the flyer palette)
 *  - All images embedded as Base64 data URLs in src attributes
 *  - Small inline animations and JavaScript (scroll reveal, counters, search)
 *  - No external network requests - the file opens fully offline
 */

import type { EventReport, ReportCategoryRow, ReportGuest } from '@/types';
import type { FlyerPalette } from './color-extract';

const SYSTEM_FONT =
    "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function esc(text: string | null | undefined): string {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDateStr(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return String(iso);
    }
}

function formatDay(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return iso;
    }
}

function formatNumber(value: number): string {
    return Number(value || 0).toLocaleString();
}

function share(part: number, total: number): number {
    if (!total) return 0;
    return Math.max(0, Math.min(100, (part / total) * 100));
}

function formatHour(hour: string): string {
    const [raw] = String(hour).split(':');
    const value = Number(raw);
    if (Number.isNaN(value)) return hour;
    const suffix = value >= 12 ? 'PM' : 'AM';
    const display = value % 12 === 0 ? 12 : value % 12;
    return `${display}${suffix}`;
}

function heroSection(
    report: EventReport,
    flyerDataUrl: string | null
): string {
    const { event, summary } = report;
    const initials = String(event.name || 'Event')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    return `
  <section class="hero${flyerDataUrl ? '' : ' hero--plain'}">
    ${
        flyerDataUrl
            ? `<img class="hero-img" src="${esc(
                  flyerDataUrl
              )}" alt="${esc(event.name)} flyer" />`
            : `<div class="hero-orb hero-orb--one"></div>
               <div class="hero-orb hero-orb--two"></div>
               <div class="hero-monogram" aria-hidden="true">${esc(
                   initials
               )}</div>`
    }
    <div class="hero-shade"></div>
    <div class="hero-content">
      <span class="kicker">Accreditation report</span>
      <h1>${esc(event.name)}</h1>
      <div class="hero-meta">
        <span>${esc(formatDateStr(event.start_date))} – ${esc(
        formatDateStr(event.end_date)
    )}</span>
        ${
            event.location_text
                ? `<span class="dot" aria-hidden="true">·</span><span>${esc(
                      event.location_text
                  )}</span>`
                : ''
        }
      </div>
      <div class="hero-pill">
        <strong>${summary.attendance_rate}%</strong>
        <span>attendance</span>
      </div>
    </div>
  </section>`;
}

function kpiSection(report: EventReport): string {
    const { summary } = report;
    const cards = [
        {
            label: 'Total guests',
            value: summary.total_guests,
            display: formatNumber(summary.total_guests),
            hint: 'On the guest list',
            tone: 'primary',
            suffix: '',
        },
        {
            label: 'Accredited',
            value: summary.accredited_guests,
            display: formatNumber(summary.accredited_guests),
            hint: `${formatNumber(summary.no_shows)} not yet`,
            tone: 'success',
            suffix: '',
        },
        {
            label: 'Attendance',
            value: summary.attendance_rate,
            display: `${summary.attendance_rate}%`,
            hint: 'Accredited ÷ total guests',
            tone: 'warning',
            suffix: '%',
        },
    ];

    return `
  <section class="kpis" aria-label="Key figures">
    ${cards
        .map(
            (card) => `
    <article class="kpi reveal">
      <span class="kpi-dot kpi-dot--${card.tone}" aria-hidden="true"></span>
      <span class="kpi-label">${esc(card.label)}</span>
      <span class="kpi-value" data-count="${card.value}" data-format="${
                card.display.includes('%') ? 'percent' : 'number'
            }" data-suffix="${card.suffix ?? ''}">${esc(
                card.display
            )}</span>
      <span class="kpi-hint">${esc(card.hint)}</span>
    </article>`
        )
        .join('')}
  </section>`;
}

function donut(accredited: number, total: number): string {
    const rate = total > 0 ? accredited / total : 0;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - rate);

    return `
  <div class="donut-wrap">
    <svg class="donut" viewBox="0 0 140 140" role="img" aria-label="Attendance ${accredited} of ${total}">
      <circle class="donut-track" cx="70" cy="70" r="${radius}" />
      <circle class="donut-value" cx="70" cy="70" r="${radius}"
        stroke-dasharray="${circumference.toFixed(2)}"
        stroke-dashoffset="${offset.toFixed(2)}"
        style="--from:${circumference.toFixed(2)};--to:${offset.toFixed(2)}" />
      <text class="donut-number" x="70" y="70" text-anchor="middle">${formatNumber(
          accredited
      )}</text>
      <text class="donut-label" x="70" y="92" text-anchor="middle">accredited</text>
    </svg>
    <div class="donut-legend">
      <div class="donut-stat">
        <span class="donut-stat-value">${formatNumber(total)}</span>
        <span class="donut-stat-label">Total guests</span>
      </div>
      <div class="donut-stat">
        <span class="donut-stat-value">${formatNumber(
            total - accredited
        )}</span>
        <span class="donut-stat-label">Not yet accredited</span>
      </div>
      <div class="donut-stat">
        <span class="donut-stat-value">${formatNumber(
            Math.round(rate * 1000) / 10
        )}%</span>
        <span class="donut-stat-label">Attendance rate</span>
      </div>
    </div>
  </div>`;
}

function dailyChart(
    daily: { date: string; checkins: number; guests: number }[]
): string {
    if (daily.length === 0) {
        return `<p class="empty">No daily data available.</p>`;
    }
    const max = Math.max(1, ...daily.map((day) => day.checkins));

    return `
  <div class="legend">
    <span><i class="swatch swatch--primary"></i>Check-ins</span>
    <span><i class="swatch swatch--secondary"></i>Unique guests</span>
  </div>
  <div class="bar-list">
    ${daily
        .map(
            (day) => `
    <div class="bar-row reveal">
      <span class="bar-label">${esc(formatDay(day.date))}</span>
      <div class="bar-stack">
        <div class="bar-track"><div class="bar-fill bar-fill--primary" style="width:${share(
            day.checkins,
            max
        ).toFixed(2)}%"></div></div>
        <div class="bar-track bar-track--slim"><div class="bar-fill bar-fill--secondary" style="width:${share(
            day.guests,
            max
        ).toFixed(2)}%"></div></div>
      </div>
      <span class="bar-value">${formatNumber(day.checkins)}</span>
    </div>`
        )
        .join('')}
  </div>`;
}

function hourlyChart(hourly: { hour: string; count: number }[]): string {
    if (hourly.length === 0) {
        return `<p class="empty">No check-ins have been recorded yet.</p>`;
    }
    const max = Math.max(1, ...hourly.map((point) => point.count));
    return `
  <div class="columns">
    ${hourly
        .map(
            (point) => `
    <div class="column" title="${esc(point.hour)} · ${formatNumber(
                point.count
            )} check-ins">
      <span class="column-value">${
          point.count ? formatNumber(point.count) : ''
      }</span>
      <div class="column-track"><div class="column-bar reveal" style="height:${Math.max(
          2,
          share(point.count, max)
      ).toFixed(2)}%"></div></div>
      <span class="column-label">${esc(formatHour(point.hour))}</span>
    </div>`
        )
        .join('')}
  </div>`;
}

function categoryList(categories: ReportCategoryRow[]): string {
    if (categories.length === 0) {
        return `<p class="empty">No category data available.</p>`;
    }
    const total = categories.reduce((sum, row) => sum + row.checked_in, 0);
    return `
  <div class="bar-list">
    ${categories
        .map(
            (row) => `
    <div class="bar-row reveal">
      <span class="bar-label bar-label--dot"><i class="dot" style="background:${esc(
          row.color || 'var(--brand-primary)'
      )}"></i>${esc(row.name)}</span>
      <div class="bar-stack">
        <div class="bar-track"><div class="bar-fill" style="width:${share(
            row.checked_in,
            total
        ).toFixed(2)}%;background:${esc(
                row.color || 'var(--brand-primary)'
            )}"></div></div>
      </div>
      <span class="bar-value">${formatNumber(row.checked_in)} <small>· ${Math.round(
                share(row.checked_in, total)
            )}%</small></span>
    </div>`
        )
        .join('')}
  </div>`;
}

function locationList(
    locations: { name: string; count: number; share: number }[]
): string {
    if (locations.length === 0) {
        return `<p class="empty">No location data yet.</p>`;
    }
    return `
  <div class="bar-list">
    ${locations
        .map(
            (row) => `
    <div class="bar-row reveal">
      <span class="bar-label">${esc(row.name)}</span>
      <div class="bar-stack">
        <div class="bar-track"><div class="bar-fill bar-fill--secondary" style="width:${Math.min(
            100,
            row.share
        ).toFixed(2)}%"></div></div>
      </div>
      <span class="bar-value">${formatNumber(row.count)} <small>· ${
                row.share
            }%</small></span>
    </div>`
        )
        .join('')}
  </div>`;
}

function recentList(
    recent: {
        guest_name: string;
        category: string | null;
        location: string | null;
        ambassador: string | null;
        date: string;
        time: string | null;
    }[]
): string {
    if (recent.length === 0) {
        return `<p class="empty">No check-ins yet.</p>`;
    }
    return `
  <ul class="recent">
    ${recent
        .map(
            (row) => `
    <li class="recent-item reveal">
      <span class="recent-avatar">${esc(
          (row.guest_name || 'G').slice(0, 1).toUpperCase()
      )}</span>
      <span class="recent-main">
        <span class="recent-name">${esc(row.guest_name)}</span>
        <span class="recent-meta">${esc(
            row.category ?? 'Uncategorized'
        )} · ${esc(row.location ?? 'No location')} · ${esc(
                row.ambassador ?? 'Unassigned'
            )}</span>
      </span>
      <span class="recent-time">${esc(formatDateStr(row.date))}${
                row.time ? ` · ${esc(String(row.time).slice(0, 5))}` : ''
            }</span>
    </li>`
        )
        .join('')}
  </ul>`;
}

function guestTable(guests: ReportGuest[]): string {
    if (guests.length === 0) {
        return `<p class="empty">No guests on the list.</p>`;
    }

    const rows = guests
        .map((guest) => {
            const status = guest.checked_in ? 'Accredited' : 'Not yet';
            const searchText = [
                guest.ticket_number,
                guest.names,
                guest.category,
                guest.location,
                guest.email,
                guest.phone,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return `
    <tr data-search="${esc(searchText)}">
      <td class="mono">${esc(guest.ticket_number)}</td>
      <td class="strong">${esc(guest.names)}</td>
      <td>${esc(guest.category ?? '—')}</td>
      <td>${esc(guest.location ?? '—')}</td>
      <td><span class="status ${
          guest.checked_in ? 'status--yes' : 'status--no'
      }">${status}</span></td>
    </tr>`;
        })
        .join('');

    return `
  <div class="table-tools">
    <input id="guest-search" type="search" placeholder="Search guests, tickets, categories…" aria-label="Search guests" />
    <span id="guest-count">${formatNumber(guests.length)} guests</span>
  </div>
  <div class="table-wrap">
    <table class="guests">
      <thead>
        <tr>
          <th>Ticket</th>
          <th>Guest</th>
          <th>Category</th>
          <th>Location</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

/**
 * Assemble the complete self-contained HTML document.
 *
 * @param flyerDataUrl Optional base64 data URL for the flyer. When omitted the
 *        report uses a generated gradient hero, so the file never depends on
 *        an external image.
 * @param options.includeGuestList When false the guest list section is omitted,
 *        which keeps the client-facing report shorter and more private.
 */
export function buildInfographicHtml(
    report: EventReport,
    palette: FlyerPalette,
    flyerDataUrl: string | null = null,
    options: { includeGuestList?: boolean } = {}
): string {
    const { event, summary } = report;
    const eventName = esc(event.name);
    const generated = new Date().toLocaleString();
    const includeGuestList = options.includeGuestList ?? true;

    const css = `
  :root {
    --brand-primary: ${palette.primary};
    --brand-secondary: ${palette.secondary};
    --brand-bg: ${palette.background};
    --brand-surface: ${palette.surface};
    --brand-text: ${palette.text};
    --brand-on-primary: ${palette.onPrimary};
    --brand-subtle: ${palette.subtle};
    --brand-border: ${palette.border};
    --shadow: 0 18px 44px -26px rgba(15, 23, 42, 0.38);
    --radius: 18px;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: ${SYSTEM_FONT};
    background:
      radial-gradient(1100px 520px at 8% -8%, var(--brand-subtle), transparent 62%),
      radial-gradient(900px 460px at 100% 4%, color-mix(in srgb, var(--brand-secondary) 12%, transparent), transparent 58%),
      var(--brand-bg);
    color: var(--brand-text);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .progress {
    position: fixed;
    inset: 0 0 auto;
    height: 3px;
    background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
    transform: scaleX(0);
    transform-origin: left;
    z-index: 50;
  }
  .report {
    width: min(1080px, 100%);
    margin: 0 auto;
    padding: 28px 20px 56px;
  }

  /* Hero */
  .hero {
    position: relative;
    min-height: 400px;
    border-radius: 26px;
    overflow: hidden;
    background: var(--brand-surface);
    box-shadow: var(--shadow);
    isolation: isolate;
    margin-bottom: 26px;
  }
  .hero--plain {
    background:
      radial-gradient(620px 280px at 12% 8%, var(--brand-primary), transparent 70%),
      linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    min-height: 340px;
  }
  .hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    animation: heroZoom 18s ease-out both;
  }
  .hero-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(8, 15, 30, 0.08) 20%, rgba(8, 15, 30, 0.78) 100%);
    z-index: 1;
  }
  .hero--plain .hero-shade {
    background: linear-gradient(180deg, rgba(8, 15, 30, 0.02) 10%, rgba(8, 15, 30, 0.46) 100%);
  }
  .hero-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(2px);
    opacity: 0.55;
    z-index: 0;
  }
  .hero-orb--one {
    width: 340px; height: 340px; right: -90px; top: -120px;
    background: color-mix(in srgb, var(--brand-on-primary) 35%, transparent);
  }
  .hero-orb--two {
    width: 260px; height: 260px; left: -60px; bottom: -120px;
    background: color-mix(in srgb, var(--brand-secondary) 65%, transparent);
  }
  .hero-monogram {
    position: absolute;
    right: 6%;
    top: 50%;
    transform: translateY(-50%);
    font-size: clamp(120px, 22vw, 260px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.06em;
    color: color-mix(in srgb, var(--brand-on-primary) 22%, transparent);
    z-index: 0;
    user-select: none;
  }
  .hero-content {
    position: absolute;
    inset: auto 0 0;
    z-index: 2;
    padding: 28px 30px 30px;
    color: #fff;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    backdrop-filter: blur(6px);
  }
  .hero h1 {
    margin: 0;
    font-size: clamp(28px, 5vw, 48px);
    line-height: 1.08;
    letter-spacing: -0.028em;
    font-weight: 800;
    max-width: 18ch;
    text-shadow: 0 4px 26px rgba(0, 0, 0, 0.36);
  }
  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    opacity: 0.94;
  }
  .dot { opacity: 0.5; }
  .hero-pill {
    position: absolute;
    right: 26px;
    bottom: 28px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 10px 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
  }
  .hero-pill strong { font-size: 26px; line-height: 1; letter-spacing: -0.02em; }
  .hero-pill span { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.85; }

  /* KPI cards */
  .kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 22px;
  }
  .kpi {
    position: relative;
    background: var(--brand-surface);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    padding: 16px 16px 14px;
    box-shadow: 0 12px 26px -24px rgba(15, 23, 42, 0.5);
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow: hidden;
    transition: transform 180ms ease, box-shadow 180ms ease;
  }
  .kpi:hover { transform: translateY(-3px); box-shadow: 0 18px 34px -24px rgba(15, 23, 42, 0.55); }
  .kpi::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: 3px;
    background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
    opacity: 0.7;
  }
  .kpi-dot {
    width: 9px; height: 9px; border-radius: 50%;
    margin-bottom: 8px;
    background: var(--brand-primary);
    box-shadow: 0 0 0 4px var(--brand-subtle);
  }
  .kpi-dot--success { background: #16A34A; box-shadow: 0 0 0 4px #DCFCE7; }
  .kpi-dot--warning { background: #D97706; box-shadow: 0 0 0 4px #FEF3C7; }
  .kpi-dot--info { background: #0284C7; box-shadow: 0 0 0 4px #E0F2FE; }
  .kpi-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--brand-text) 55%, transparent);
  }
  .kpi-value {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    line-height: 1.15;
  }
  .kpi-hint { font-size: 11px; color: color-mix(in srgb, var(--brand-text) 52%, transparent); }

  /* Cards */
  .card {
    background: var(--brand-surface);
    border: 1px solid var(--brand-border);
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: 0 12px 30px -28px rgba(15, 23, 42, 0.55);
    min-width: 0;
  }
  .section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }
  .section-title { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
  .section-desc { font-size: 11.5px; color: color-mix(in srgb, var(--brand-text) 52%, transparent); }
  .grid {
    display: grid;
    gap: 14px;
    margin-bottom: 14px;
  }
  .grid--2 { grid-template-columns: 1fr 1fr; }
  .empty {
    margin: 0;
    padding: 18px 0;
    text-align: center;
    font-size: 12px;
    color: color-mix(in srgb, var(--brand-text) 50%, transparent);
  }

  /* Donut */
  .donut-wrap { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
  .donut { width: 148px; height: 148px; flex: 0 0 auto; transform: rotate(-90deg); }
  .donut-track { fill: none; stroke: color-mix(in srgb, var(--brand-primary) 12%, #fff); stroke-width: 13; }
  .donut-value {
    fill: none;
    stroke: var(--brand-primary);
    stroke-width: 13;
    stroke-linecap: round;
    animation: ringDraw 1.5s cubic-bezier(.22,.61,.36,1) both;
  }
  .donut-number {
    transform: rotate(90deg);
    transform-origin: 70px 70px;
    font-family: ${SYSTEM_FONT};
    font-size: 30px;
    font-weight: 800;
    fill: var(--brand-text);
  }
  .donut-label {
    transform: rotate(90deg);
    transform-origin: 70px 70px;
    font-family: ${SYSTEM_FONT};
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    fill: color-mix(in srgb, var(--brand-text) 55%, transparent);
  }
  .donut-legend { display: grid; gap: 10px; flex: 1; min-width: 140px; }
  .donut-stat {
    display: flex; flex-direction: column;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--brand-border);
  }
  .donut-stat:last-child { border-bottom: 0; padding-bottom: 0; }
  .donut-stat-value { font-size: 19px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .donut-stat-label { font-size: 11px; color: color-mix(in srgb, var(--brand-text) 52%, transparent); }

  /* Bars */
  .legend { display: flex; gap: 16px; font-size: 10.5px; color: color-mix(in srgb, var(--brand-text) 55%, transparent); margin-bottom: 12px; }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .swatch--primary { background: var(--brand-primary); }
  .swatch--secondary { background: var(--brand-secondary); }
  .bar-list { display: flex; flex-direction: column; gap: 11px; }
  .bar-row {
    display: grid;
    grid-template-columns: minmax(86px, 132px) minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
  }
  .bar-label {
    font-size: 11.5px;
    font-weight: 500;
    color: color-mix(in srgb, var(--brand-text) 78%, transparent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .bar-label--dot .dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
  .bar-stack { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .bar-track {
    height: 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-primary) 10%, #fff);
    overflow: hidden;
  }
  .bar-track--slim { height: 5px; }
  .bar-fill {
    height: 100%;
    border-radius: inherit;
    transform-origin: left;
    animation: growX 1.1s cubic-bezier(.22,.61,.36,1) both;
  }
  .bar-fill--primary { background: var(--brand-primary); }
  .bar-fill--secondary { background: var(--brand-secondary); }
  .bar-value { font-size: 11.5px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .bar-value small { font-weight: 500; color: color-mix(in srgb, var(--brand-text) 50%, transparent); }

  /* Columns */
  .columns {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 190px;
    padding-top: 8px;
  }
  .column { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; gap: 5px; min-width: 0; }
  .column-value { font-size: 9.5px; font-weight: 700; font-variant-numeric: tabular-nums; min-height: 12px; }
  .column-track { flex: 1; width: 100%; display: flex; align-items: flex-end; }
  .column-bar {
    width: 72%;
    margin: 0 auto;
    min-height: 2px;
    border-radius: 5px 5px 2px 2px;
    background: linear-gradient(180deg, var(--brand-secondary), var(--brand-primary));
    transform-origin: bottom;
    animation: growY 900ms cubic-bezier(.22,.61,.36,1) both;
  }
  .column-label {
    font-size: 8.5px;
    color: color-mix(in srgb, var(--brand-text) 50%, transparent);
    white-space: nowrap;
  }

  /* Recent */
  .recent { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 2px 18px; }
  .recent-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--brand-border); min-width: 0; }
  .recent-avatar {
    width: 28px; height: 28px; flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 9px;
    background: var(--brand-subtle);
    color: var(--brand-primary);
    font-size: 11px; font-weight: 700;
  }
  .recent-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .recent-name { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .recent-meta { font-size: 10px; color: color-mix(in srgb, var(--brand-text) 48%, transparent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .recent-time { font-size: 10px; color: color-mix(in srgb, var(--brand-text) 48%, transparent); white-space: nowrap; }

  /* Guest table */
  .table-tools { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .table-tools input {
    flex: 1;
    min-width: 200px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid var(--brand-border);
    background: color-mix(in srgb, var(--brand-bg) 55%, #fff);
    padding: 0 12px;
    font: inherit;
    font-size: 12px;
    color: var(--brand-text);
    outline: none;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }
  .table-tools input:focus {
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 16%, transparent);
  }
  #guest-count { font-size: 11.5px; color: color-mix(in srgb, var(--brand-text) 52%, transparent); }
  .table-wrap { max-height: 520px; overflow: auto; border: 1px solid var(--brand-border); border-radius: 12px; }
  table.guests { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  table.guests thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    text-align: left;
    padding: 9px 12px;
    background: color-mix(in srgb, var(--brand-primary) 7%, #fff);
    border-bottom: 1px solid var(--brand-border);
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--brand-text) 58%, transparent);
    white-space: nowrap;
  }
  table.guests td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--brand-border);
    color: color-mix(in srgb, var(--brand-text) 82%, transparent);
    white-space: nowrap;
  }
  table.guests tbody tr:last-child td { border-bottom: 0; }
  table.guests tbody tr:hover td { background: color-mix(in srgb, var(--brand-primary) 5%, #fff); }
  .mono { font-variant-numeric: tabular-nums; font-size: 10.5px; color: color-mix(in srgb, var(--brand-text) 58%, transparent); }
  .strong { font-weight: 600; color: var(--brand-text); }
  .status {
    display: inline-flex; align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .status--yes { background: #DCFCE7; color: #15803D; }
  .status--no { background: #FEF2F2; color: #991B1B; }
  .row-hidden { display: none; }

  /* Footer */
  .footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--brand-border);
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 10.5px;
    color: color-mix(in srgb, var(--brand-text) 46%, transparent);
  }

  /* Motion */
  html.js .reveal { opacity: 0; transform: translateY(14px); }
  html.js .reveal.in { opacity: 1; transform: none; transition: opacity 560ms ease, transform 560ms cubic-bezier(.22,.61,.36,1); }
  @keyframes heroZoom { from { transform: scale(1.08); } to { transform: scale(1); } }
  @keyframes ringDraw { from { stroke-dashoffset: var(--from); } to { stroke-dashoffset: var(--to); } }
  @keyframes growX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes growY { from { transform: scaleY(0); } to { transform: scaleY(1); } }

  @media (max-width: 860px) {
    .grid--2 { grid-template-columns: 1fr; }
    .kpis { grid-template-columns: 1fr 1fr; }
    .recent { grid-template-columns: 1fr; }
    .hero h1 { max-width: 14ch; }
  }
  @media (max-width: 560px) {
    .report { padding: 16px 12px 40px; }
    .hero { min-height: 320px; }
    .hero-content { padding: 20px; }
    .hero-pill { position: static; align-self: flex-start; margin-top: 6px; align-items: flex-start; }
    .kpis { grid-template-columns: 1fr; }
    .bar-row { grid-template-columns: 88px minmax(0, 1fr) auto; gap: 8px; }
    .card { padding: 16px; }
    .columns { height: 150px; }
    .column:nth-child(even) .column-label { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
    html.js .reveal { opacity: 1; transform: none; }
  }
  @media print {
    .progress, .table-tools { display: none !important; }
    html.js .reveal { opacity: 1 !important; transform: none !important; }
    .hero { min-height: 280px; box-shadow: none; }
    .card, .kpi { box-shadow: none; break-inside: avoid; }
    .table-wrap { max-height: none; overflow: visible; }
    body { background: #fff; }
  }
`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="generator" content="Accredit report exporter" />
<title>${eventName} – Accreditation Report</title>
<script>document.documentElement.classList.add('js');</script>
<style>${css}</style>
</head>
<body>
<div class="progress" id="progress"></div>
<main class="report">
${heroSection(report, flyerDataUrl)}
${kpiSection(report)}

  <div class="grid grid--2">
    <section class="card reveal">
      <div class="section-head">
        <span class="section-title">Attendance</span>
        <span class="section-desc">Accredited guests</span>
      </div>
      ${donut(summary.accredited_guests, summary.total_guests)}
    </section>
    <section class="card reveal">
      <div class="section-head">
        <span class="section-title">Daily attendance</span>
        <span class="section-desc">Check-ins and unique guests per event day</span>
      </div>
      ${dailyChart(report.daily)}
    </section>
  </div>

  <div class="grid grid--2">
    <section class="card reveal">
      <div class="section-head">
        <span class="section-title">Arrivals by hour</span>
        <span class="section-desc">When guests collect accreditation</span>
      </div>
      ${hourlyChart(report.hourly)}
    </section>
    <section class="card reveal">
      <div class="section-head">
        <span class="section-title">Guest mix</span>
        <span class="section-desc">Accredited guests by category</span>
      </div>
      ${categoryList(report.by_category)}
    </section>
  </div>

  <div class="grid">
    <section class="card reveal">
      <div class="section-head">
        <span class="section-title">Accreditation points</span>
        <span class="section-desc">Where badges were collected</span>
      </div>
      ${locationList(report.by_location)}
    </section>
  </div>

  <div class="grid">
    <section class="card reveal">
      <div class="section-head">
        <span class="section-title">Recent check-ins</span>
        <span class="section-desc">The latest guests through accreditation</span>
      </div>
      ${recentList(report.recent_checkins)}
    </section>
  </div>

  ${
      includeGuestList
          ? `<div class="grid">
    <section class="card reveal">
      <div class="section-head">
        <span class="section-title">Guest list</span>
        <span class="section-desc">${formatNumber(
            report.guests.length
        )} guests · ${formatNumber(
              summary.accredited_guests
          )} accredited</span>
      </div>
      ${guestTable(report.guests)}
    </section>
  </div>`
          : ''
  }

  <footer class="footer">
    <span>Accreditation report · ${eventName}</span>
    <span>Generated ${esc(generated)}</span>
  </footer>
</main>
<script>
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // Scroll progress
  var progress = document.getElementById('progress');
  function updateProgress() {
    if (!progress) return;
    var scrollable = root.scrollHeight - root.clientHeight;
    var ratio = scrollable > 0 ? root.scrollTop / scrollable : 0;
    progress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, ratio)) + ')';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Reveal on scroll
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('in'); });
  }

  // Count-up KPIs
  function animateCount(element) {
    var target = Number(element.getAttribute('data-count') || '0');
    var isPercent = element.getAttribute('data-format') === 'percent';
    var suffix = element.getAttribute('data-suffix') || '';
    var start = performance.now();
    var duration = 1100;
    function frame(now) {
      var progressRatio = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - progressRatio, 3);
      var value = target * eased;
      var formatted = isPercent
        ? (Math.round(value * 10) / 10).toFixed(1).replace(/\\.0$/, '')
        : Math.round(value).toLocaleString();
      element.textContent = formatted + suffix;
      if (progressRatio < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (item) { countObserver.observe(item); });
  } else {
    counters.forEach(animateCount);
  }

  // Guest search
  var search = document.getElementById('guest-search');
  var countLabel = document.getElementById('guest-count');
  var rows = Array.prototype.slice.call(document.querySelectorAll('table.guests tbody tr'));
  if (search) {
    search.addEventListener('input', function () {
      var query = search.value.trim().toLowerCase();
      var visible = 0;
      rows.forEach(function (row) {
        var haystack = row.getAttribute('data-search') || '';
        var match = !query || haystack.indexOf(query) !== -1;
        row.classList.toggle('row-hidden', !match);
        if (match) visible += 1;
      });
      if (countLabel) countLabel.textContent = visible.toLocaleString() + ' of ' + rows.length.toLocaleString() + ' guests';
    });
  }

  window.addEventListener('beforeprint', function () {
    revealItems.forEach(function (item) { item.classList.add('in'); });
  });
})();
</script>
</body>
</html>
`;

    return html;
}

/**
 * Resolve an image URL to a data URL.
 *
 * Used as a fallback when the API did not already include a Base64 flyer.
 * Returns `null` when the image cannot be read (for example when the media
 * host does not send CORS headers), so callers can omit it instead of
 * producing an HTML file with a broken external image.
 */
export async function fetchImageAsDataUrl(
    url: string | null | undefined
): Promise<string | null> {
    if (!url) return null;
    if (url.startsWith('data:')) return url;

    try {
        const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
        if (!response.ok) return null;
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('Could not read image'));
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/**
 * Downloads the given HTML string as a single .html file.
 * The file is fully self-contained (no external assets).
 */
export function downloadHtmlReport(
    htmlString: string,
    filename: string
): void {
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename.endsWith('.html')
        ? filename
        : `${filename}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}
