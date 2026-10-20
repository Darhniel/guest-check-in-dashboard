'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardStats } from '@/types';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Calendar, Users, Ticket, UserCheck, Loader2 } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await api<DashboardStats>('/admin/dashboard/stats/');
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    const chartData = (stats?.hourly_checkins || []).map((h) => {
        // If it's already in "HH:mm" format, just use it or format it manually
        if (typeof h.hour === 'string' && h.hour.includes(':')) {
            const [hours, minutes] = h.hour.split(':');
            const hourNum = parseInt(hours, 10);
            const ampm = hourNum >= 12 ? 'pm' : 'am';
            const displayHour = hourNum % 12 || 12; // Convert 0 to 12, 13 to 1, etc.

            return {
                time: `${displayHour}${ampm}`, // e.g., "2pm"
                count: h.count,
            };
        }

        // Fallback for valid ISO strings
        try {
            const parsedDate = parseISO(h.hour);
            if (!isNaN(parsedDate.getTime())) {
                return { time: format(parsedDate, 'ha'), count: h.count };
            }
        } catch (e) {
            // Ignore and fallback
        }

        return { time: h.hour || 'Unknown', count: h.count };
    });

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Overview</h1>
                <p className="text-neutral-500 mt-1">
                    Today's performance across all events
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard
                    label="Active Events"
                    value={stats?.active_events || 0}
                    icon={Calendar}
                    accent="blue"
                />
                <StatsCard
                    label="Total Guests"
                    value={stats?.total_guests || 0}
                    icon={Ticket}
                    accent="neutral"
                />
                <StatsCard
                    label="Check-ins Today"
                    value={stats?.today_checkins || 0}
                    icon={UserCheck}
                    accent="green"
                />
                <StatsCard
                    label="Active Ambassadors"
                    value={stats?.total_ambassadors || 0}
                    icon={Users}
                    accent="amber"
                />
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-1">
                    Check-ins Today
                </h2>
                <p className="text-sm text-neutral-500 mb-6">Hourly breakdown</p>
                <div className="h-64">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#111827" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                                <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#111827"
                                    strokeWidth={2}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
                            No check-ins yet today
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}