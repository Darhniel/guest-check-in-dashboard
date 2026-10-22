'use client';

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { ReportDailyPoint } from '@/types';
import { formatDate, formatNumber } from '@/lib/format';

function DailyTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ dataKey?: string | number; value?: number | string }>;
    label?: string | number;
}) {
    if (!active || !payload?.length) return null;

    const point = payload[0]?.value;
    const guests = payload.find((item) => item.dataKey === 'guests')?.value;

    return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-float">
            <p className="text-[11px] text-muted-foreground">
                {typeof label === 'string'
                    ? formatDate(label, 'EEE, MMM d')
                    : label}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {formatNumber(Number(point ?? 0))} check-ins
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
                {formatNumber(Number(guests ?? 0))} unique guests
            </p>
        </div>
    );
}

export function DailyAttendanceChart({ data }: { data: ReportDailyPoint[] }) {
    return (
        <div className="h-[250px] w-full sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
                    barCategoryGap="26%"
                    barGap={3}
                >
                    <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="4 4"
                    />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        minTickGap={10}
                        tickFormatter={(value: string) =>
                            formatDate(value, 'MMM d')
                        }
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        allowDecimals={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    />
                    <Tooltip
                        content={<DailyTooltip />}
                        cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
                    />
                    <Bar
                        dataKey="checkins"
                        fill="var(--brand)"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={40}
                        animationDuration={600}
                    />
                    <Bar
                        dataKey="guests"
                        fill="var(--chart-2)"
                        fillOpacity={0.55}
                        radius={[5, 5, 0, 0]}
                        maxBarSize={40}
                        animationDuration={600}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
