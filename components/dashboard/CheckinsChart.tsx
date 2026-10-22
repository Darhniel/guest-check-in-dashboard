'use client';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export interface CheckinPoint {
    time: string;
    count: number;
}

function ChartTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value?: number | string }>;
    label?: string | number;
}) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-float">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {Number(payload[0]?.value ?? 0).toLocaleString()} check-ins
            </p>
        </div>
    );
}

export function CheckinsChart({ data }: { data: CheckinPoint[] }) {
    return (
        <div className="h-[240px] w-full sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 6, left: -18, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="checkin-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
                            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="4 4"
                    />
                    <XAxis
                        dataKey="time"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        minTickGap={28}
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
                        content={<ChartTooltip />}
                        cursor={{
                            stroke: 'var(--border)',
                            strokeWidth: 1,
                            strokeDasharray: '4 4',
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        fill="url(#checkin-fill)"
                        dot={false}
                        activeDot={{
                            r: 4,
                            fill: 'var(--chart-1)',
                            stroke: 'var(--card)',
                            strokeWidth: 2,
                        }}
                        animationDuration={650}
                        animationEasing="ease-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
