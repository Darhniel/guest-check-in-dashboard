import type { ReportCategoryRow } from '@/types';
import { formatNumber } from '@/lib/format';

export function CategoryBreakdown({ data }: { data: ReportCategoryRow[] }) {
    if (data.length === 0) {
        return (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">
                No guest categories yet.
            </p>
        );
    }

    return (
        <ul className="space-y-3.5">
            {data.map((row) => (
                <li key={`${row.id ?? 'none'}-${row.name}`}>
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: row.color }}
                            />
                            <span className="truncate text-[12.5px]">
                                {row.name}
                            </span>
                        </span>
                        <span className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums">
                            {formatNumber(row.checked_in)}/
                            {formatNumber(row.guests)} · {row.rate}%
                        </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full transition-[width] duration-700 ease-out-soft"
                            style={{
                                width: `${Math.min(100, row.rate)}%`,
                                backgroundColor: row.color,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}
