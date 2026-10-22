'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    ArrowRight,
    BadgeCheck,
    Eye,
    EyeOff,
    Loader2,
    Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { isAuthenticated, isDemoMode, setAuthData, signInDemo } from '@/lib/auth';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/common/Avatar';

const previewBars = [38, 62, 48, 76, 58, 88, 70, 94, 64, 52, 72, 44];

function BrandPanel() {
    return (
        <aside className="relative hidden overflow-hidden bg-[oklch(0.16_0.018_282)] text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:p-10 xl:p-14">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="bg-grid absolute inset-0 opacity-60" />
                <div className="absolute -top-24 -right-20 size-[420px] rounded-full bg-[oklch(0.55_0.2_280)] opacity-25 blur-[100px]" />
                <div className="absolute -bottom-32 -left-24 size-[360px] rounded-full bg-[oklch(0.62_0.14_200)] opacity-20 blur-[100px]" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            <div className="relative flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-[9px] bg-white/10 ring-1 ring-white/15 ring-inset">
                    <BadgeCheck className="size-4" strokeWidth={1.9} />
                </span>
                <span className="text-[13px] font-medium tracking-[-0.01em]">
                    Accreditation
                </span>
            </div>

            <div className="relative max-w-[520px]">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Live accreditation, without the chaos
                </p>
                <h2 className="text-[38px] leading-[1.04] font-semibold tracking-[-0.045em] text-balance xl:text-[50px]">
                    Every guest. Every door. One calm view.
                </h2>
                <p className="mt-5 max-w-md text-[14px] leading-relaxed text-white/60">
                    Watch arrivals in real time, keep your team aligned, and know
                    exactly who&apos;s inside — without chasing a spreadsheet.
                </p>

                <div
                    aria-hidden="true"
                    className="mt-10 rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur-sm sm:p-5"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-[10px] font-semibold ring-1 ring-white/10 ring-inset">
                                DS
                            </span>
                            <div>
                                <p className="text-[12px] font-medium">
                                    Design Systems Summit
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/45">
                                    <span className="size-1 rounded-full bg-emerald-400" />
                                    Live · Main Entrance
                                </p>
                            </div>
                        </div>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] text-white/60">
                            Just now
                        </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                                1,194
                            </p>
                            <p className="mt-1.5 text-[10px] text-white/45">
                                check-ins today
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[16px] font-medium tabular-nums">35%</p>
                            <p className="mt-1 text-[10px] text-white/45">
                                of guest list
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex h-16 items-end gap-1.5">
                        {previewBars.map((height, index) => (
                            <div
                                key={index}
                                className="flex-1 rounded-sm bg-gradient-to-t from-white/10 to-white/45"
                                style={{ height: `${height}%` }}
                            />
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3.5">
                        <div className="flex -space-x-1.5">
                            {['Zainab Bello', 'Tobi Adeyemi', 'Fatima Yusuf', 'Daniel Mensah'].map(
                                (name) => (
                                    <Avatar
                                        key={name}
                                        name={name}
                                        size="xs"
                                        className="ring-2 ring-[oklch(0.16_0.018_282)]"
                                    />
                                )
                            )}
                        </div>
                        <span className="text-[10px] text-white/45">
                            6 ambassadors active
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative flex items-center justify-between gap-4 text-[10px] text-white/35">
                <span>Guest accreditation, made calm.</span>
                <span>© Accreditation</span>
            </div>
        </aside>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState(
        isDemoMode ? 'admin@accreditation.app' : ''
    );
    const [password, setPassword] = useState(isDemoMode ? 'demo1234' : '');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthenticated()) {
            router.replace('/dashboard');
        }
    }, [router]);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api<{
                access: string;
                refresh?: string;
                user: User;
            }>('/auth/login/', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (data.user?.role !== 'admin') {
                setError('This account does not have admin access.');
                return;
            }

            setAuthData(data.access, data.user, data.refresh);
            router.replace('/dashboard');
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'That email and password combination did not work.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDemo = () => {
        setDemoLoading(true);
        signInDemo();
        router.replace('/dashboard');
    };

    return (
        <div className="grid min-h-dvh bg-background lg:grid-cols-2 xl:grid-cols-[1.02fr_1fr]">
            <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-10 lg:py-8 xl:px-16">
                <header className="flex items-center gap-2.5 lg:hidden">
                    <span className="flex size-8 items-center justify-center rounded-[9px] bg-primary text-primary-foreground">
                        <BadgeCheck className="size-4" strokeWidth={1.9} />
                    </span>
                    <span className="text-[13px] font-semibold tracking-[-0.01em]">
                        Accreditation
                    </span>
                </header>

                <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
                    <div className="w-full max-w-[380px]">
                        <div className="animate-enter">
                            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                                Admin console
                            </p>
                            <h1 className="mt-3 text-[30px] leading-tight font-semibold tracking-[-0.035em] sm:text-[34px]">
                                Welcome back
                            </h1>
                            <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                                Sign in to manage events, ambassadors, and guest
                                accreditation.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="mt-8 space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    aria-invalid={Boolean(error)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        autoComplete="current-password"
                                        className="pr-10"
                                        required
                                        aria-invalid={Boolean(error)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error ? (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-[12.5px] leading-relaxed text-destructive"
                                >
                                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                    {error}
                                </div>
                            ) : null}

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={loading || demoLoading}
                            >
                                {loading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : null}
                                {loading ? 'Signing in…' : 'Sign in'}
                                {!loading ? (
                                    <ArrowRight className="size-4 transition-transform duration-200 ease-snappy group-hover/button:translate-x-0.5" />
                                ) : null}
                            </Button>
                        </form>

                        {isDemoMode ? (
                            <div className="mt-6 rounded-xl border border-dashed border-border bg-card/60 p-4">
                                <div className="flex items-center gap-2 text-[12px] font-medium">
                                    <Sparkles className="size-3.5 text-brand" />
                                    Preview mode
                                </div>
                                <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                                    This workspace is running on sample data. Jump in
                                    without a backend.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 w-full"
                                    onClick={handleDemo}
                                    disabled={loading || demoLoading}
                                >
                                    {demoLoading ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : null}
                                    Open demo workspace
                                </Button>
                            </div>
                        ) : null}

                        <p className="mt-8 text-center text-[11px] text-muted-foreground">
                            Need access? Ask your accreditation lead to invite you.
                        </p>
                    </div>
                </div>

                <footer className="flex items-center justify-between text-[10px] text-muted-foreground lg:hidden">
                    <span>© Accreditation</span>
                    <span>Admin console</span>
                </footer>
            </main>

            <BrandPanel />
        </div>
    );
}
