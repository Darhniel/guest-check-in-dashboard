import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    accent?: 'neutral' | 'blue' | 'green' | 'amber';
}

const accents = {
    neutral: 'bg-neutral-100 text-neutral-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
};

export function StatsCard({ label, value, icon: Icon, trend, accent = 'neutral' }: StatsCardProps) {
    return (
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm text-neutral-500 font-medium">{label}</div>
                    <div className="text-3xl font-bold text-neutral-900 mt-2">{value}</div>
                    {trend && <div className="text-xs text-neutral-500 mt-1">{trend}</div>}
                </div>
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', accents[accent])}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}