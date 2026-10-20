'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setAuthData, isAuthenticated } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthenticated()) {
            router.replace('/dashboard');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api('/auth/login/', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (data.user?.role !== 'admin') {
                setError('Access denied. Admin accounts only.');
                setLoading(false);
                return;
            }

            setAuthData(data.access, data.user);
            router.replace('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
                    <CardDescription>Sign in to manage events and ambassadors</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}