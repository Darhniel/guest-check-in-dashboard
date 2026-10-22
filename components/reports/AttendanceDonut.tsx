'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';

function LegendRow({
    color,
    label,
    value,
}: {
    color: string;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-2">
            <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
            />
            <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                {label}
            </span>
            <span className="text-[12px] font-semibold tabular-nums">
                {formatNumber(value)}
            </span>
        </div>
    );
}

export function AttendanceDonut({
    accredited,
    total,
}: {
    accredited: number;
    total: number;
}) {
    const remaining = Math.max(0, total - accredited);
    const rate =
        total > 0 ? Math.round((accredited / total) * 1000) / 10 : 0;

    const data = [
        { name: 'Accredited', value: accredited || 0, color: 'var(--brand)' },
        { name: 'Not yet', value: remaining || 0, color: 'var(--muted)' },
    ];

    return (
        <div>
            <div className="relative h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={66}
                            outerRadius={88}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={6}
                            stroke="none"
                            animationDuration={700}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[30px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                        {rate}%
                    </span>
                    <span className="mt-1.5 text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                        attended
                    </span>
                </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
                <LegendRow
                    color="var(--brand)"
                    label="Accredited"
                    value={accredited}
                />
                <LegendRow
                    color="var(--muted)"
                    label="Not yet"
                    value={remaining}
                />
            </div>
        </div>
    );
}
