'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { EventAnalytics as AnalyticsData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Users, Tag, TrendingUp } from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';

interface Props {
    eventId: number;
}

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

export function EventAnalytics({ eventId }: Props) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [eventId]);

    const loadAnalytics = async () => {
        try {
            const result = await api<AnalyticsData>(`/admin/events/${eventId}/analytics/`);
            setData(result);
        } catch (e) {
            console.error("Failed to load analytics:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!data) return null;

    const completionRate = data.total_guests > 0
        ? Math.round((data.checked_in_today / data.total_guests) * 100)
        : 0;

    const categoryData = data.by_category.map((c) => ({
        name: c.guest__category__name || 'Uncategorized',
        value: c.count,
    }));

    const locationData = data.by_location.map((l) => ({
        name: l.location__name || 'No location',
        count: l.count,
    }));

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-700" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-neutral-900">{data.total_guests}</div>
                                <div className="text-sm text-neutral-500">Total Guests</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-neutral-900">{data.checked_in_today}</div>
                                <div className="text-sm text-neutral-500">Checked In Today</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Tag className="w-5 h-5 text-amber-700" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-neutral-900">{completionRate}%</div>
                                <div className="text-sm text-neutral-500">Completion Rate</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>By Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryData.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-neutral-400 text-sm">
                                No data yet
                            </div>
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {categoryData.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-3 justify-center mt-4">
                                    {categoryData.map((cat, i) => (
                                        <div key={cat.name} className="flex items-center gap-2 text-sm">
                                            <div
                                                className="w-3 h-3 rounded-sm"
                                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                            />
                                            <span className="text-neutral-700">{cat.name}</span>
                                            <span className="text-neutral-400">({cat.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Location Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            By Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {locationData.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-neutral-400 text-sm">
                                No data yet
                            </div>
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={locationData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis type="number" stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            stroke="#9CA3AF"
                                            fontSize={12}
                                            width={100}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Bar dataKey="count" fill="#111827" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Ambassador Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle>Ambassador Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.by_ambassador.length === 0 ? (
                        <div className="text-center py-8 text-neutral-400 text-sm">
                            No check-ins yet today
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data.by_ambassador.map((amb, i) => (
                                <div
                                    key={amb.verified_by__email}
                                    className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg"
                                >
                                    <div className="w-8 h-8 bg-neutral-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-neutral-900">
                                            {amb.verified_by__full_name || amb.verified_by__email}
                                        </div>
                                        <div className="text-sm text-neutral-500">{amb.verified_by__email}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-neutral-900">{amb.count}</div>
                                        <div className="text-xs text-neutral-500">check-ins</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}