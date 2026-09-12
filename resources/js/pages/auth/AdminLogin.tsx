import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import VideoBackground from '@/components/VideoBackground';
import { forgotPassword, login, programHeadLogin } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Lock, LogIn, ShieldAlert, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    loginBlockedUntil?: string | null;
    securityAlerts?: any[];
};

function AuthErrorAlert({
    errors,
}: {
    errors: Record<string, string | undefined>;
}) {
    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            const firstError = Object.values(errors).find(
                (err) => typeof err === 'string' && err.length > 0,
            );
            if (firstError) {
                Swal.fire({
                    title: 'Sign In Failed',
                    text: firstError,
                    icon: 'error',
                    confirmButtonColor: '#1b2f8a',
                    customClass: {
                        popup: 'rounded-2xl p-6 shadow-2xl font-sans',
                        title: 'text-2xl font-black text-slate-800',
                        htmlContainer: 'text-sm text-slate-600 font-medium mt-2',
                    },
                });
            }
        }
    }, [errors]);

    return null;
}

export default function AdminLogin({
    status,
    canResetPassword,
    canRegister,
    loginBlockedUntil,
    securityAlerts,
}: Props) {
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
        () => {
            if (loginBlockedUntil) {
                const diff = Math.ceil(
                    (new Date(loginBlockedUntil).getTime() - Date.now()) / 1000,
                );
                return diff > 0 ? diff : null;
            }
            return null;
        },
    );

    const isBlocked = (remainingSeconds ?? 0) > 0;

    useEffect(() => {
        if (status) {
            Swal.fire({
                title: 'Success!',
                text: status,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    }, [status]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/auth/status/login-block', {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    setRemainingSeconds(
                        data.login_blocked && data.remaining_seconds > 0
                            ? data.remaining_seconds
                            : null,
                    );
                }
            } catch {
                // silent
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative min-h-svh overflow-hidden bg-slate-900">
            <VideoBackground />
            {/* Dark Overlay - matching the hero section */}
            <div className="absolute inset-0 bg-black/35" />

            <Head title="Admin Login" />

            <div className="relative flex min-h-svh items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
                <div className="w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="relative hidden flex-col bg-[#1b2f8a] text-white md:flex">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-5 text-sm font-semibold text-white/80 transition-colors hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Home
                            </Link>

                            <div className="flex flex-1 flex-col justify-center px-10 pb-12">
                                <div className="flex w-full items-center justify-center gap-4">
                                    <img
                                        src="/images/SRCB.png"
                                        alt="SRCB"
                                        className="h-18 w-18 rounded-full bg-white/10 object-contain p-1 shadow-inner"
                                    />
                                    <img
                                        src="/images/DSA.jpg"
                                        alt="DSA"
                                        className="h-18 w-18 rounded-full bg-white/10 object-contain p-1 shadow-inner"
                                    />
                                </div>

                                <div className="mt-8 space-y-3 text-center">
                                    <div className="text-2xl lg:text-3xl leading-tight font-black">
                                        Office of Student Affairs
                                        <br />
                                        Management System
                                    </div>
                                    <div className="text-xs sm:text-sm text-blue-200/90 font-medium">
                                        Administrator Control Portal
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-8 sm:px-10 sm:py-12">
                            <div className="mx-auto max-w-md">
                                <div className="mb-6 flex items-center justify-between gap-3 md:hidden">
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        <span>Home</span>
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <img
                                            src="/images/SRCB.png"
                                            alt="SRCB"
                                            className="h-7 w-7 rounded-full bg-slate-50 object-contain p-0.5 shadow-xs"
                                        />
                                        <img
                                            src="/images/DSA.jpg"
                                            alt="DSA"
                                            className="h-7 w-7 rounded-full bg-slate-50 object-contain p-0.5 shadow-xs"
                                        />
                                    </div>
                                </div>

                                <div className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                    Welcome back, Admin
                                </div>
                                <div className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                                    Sign in to access the administrator dashboard
                                </div>

                                {isBlocked && (
                                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                        <div>
                                            <div className="text-sm font-semibold text-amber-900">
                                                Too many failed attempts
                                            </div>
                                            <div className="mt-0.5 text-xs text-amber-700">
                                                Please wait{' '}
                                                <span className="font-bold">
                                                    {remainingSeconds}s
                                                </span>{' '}
                                                before trying again.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {securityAlerts &&
                                    securityAlerts.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {securityAlerts.map((alert) => (
                                                <div
                                                    key={alert.id}
                                                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                                                >
                                                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                                    <div>
                                                        <div className="text-sm font-semibold text-red-900">
                                                            {alert.details}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                <Form
                                    action="/admin-login"
                                    method="post"
                                    resetOnSuccess={['password']}
                                    className="mt-6 sm:mt-8"
                                >
                                    {({
                                        processing,
                                        errors,
                                    }: {
                                        processing: boolean;
                                        errors: Record<
                                            string,
                                            string | undefined
                                        >;
                                    }) => {
                                        return (
                                            <>
                                                <AuthErrorAlert errors={errors} />
                                                <div className="space-y-4 sm:space-y-5">
                                                    <div className="space-y-1.5">
                                                        <Label
                                                            htmlFor="email"
                                                            className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700"
                                                        >
                                                            Username / Email
                                                        </Label>
                                                        <div className="group relative">
                                                            <User className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600 sm:left-4 sm:h-5 sm:w-5" />
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                name="email"
                                                                required
                                                                autoFocus
                                                                tabIndex={1}
                                                                autoComplete="email"
                                                                placeholder="Enter your email"
                                                                className="h-11 sm:h-12 rounded-xl border border-slate-200 bg-slate-50/80 pl-10 sm:pl-11 text-base sm:text-sm text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20"
                                                            />
                                                        </div>
                                                        <InputError
                                                            message={
                                                                errors.email
                                                            }
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label
                                                            htmlFor="password"
                                                            className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700"
                                                        >
                                                            Password
                                                        </Label>
                                                        <div className="group relative">
                                                            <Lock className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600 sm:left-4 sm:h-5 sm:w-5" />
                                                            <Input
                                                                id="password"
                                                                type="password"
                                                                name="password"
                                                                required
                                                                tabIndex={2}
                                                                autoComplete="current-password"
                                                                placeholder="Enter your password"
                                                                className="h-11 sm:h-12 rounded-xl border border-slate-200 bg-slate-50/80 pl-10 sm:pl-11 text-base sm:text-sm text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20"
                                                            />
                                                        </div>
                                                        <InputError
                                                            message={
                                                                errors.password
                                                            }
                                                        />
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id="remember"
                                                                name="remember"
                                                                tabIndex={3}
                                                                className="rounded border-slate-300"
                                                            />
                                                            <Label
                                                                htmlFor="remember"
                                                                className="cursor-pointer text-xs font-medium text-slate-600"
                                                            >
                                                                Remember me
                                                            </Label>
                                                        </div>

                                                        {canResetPassword && (
                                                            <TextLink
                                                                href={forgotPassword()}
                                                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                                tabIndex={5}
                                                            >
                                                                Forgot password?
                                                            </TextLink>
                                                        )}
                                                    </div>

                                                    <Button
                                                        type="submit"
                                                        className="mt-1 h-11 sm:h-12 w-full rounded-xl bg-[#1b2f8a] text-sm font-bold text-white shadow-md shadow-blue-900/20 hover:bg-[#162775] active:scale-[0.99] transition-all"
                                                        tabIndex={4}
                                                        disabled={
                                                            processing ||
                                                            isBlocked
                                                        }
                                                        data-test="login-button"
                                                    >
                                                        {isBlocked ? (
                                                            <>
                                                                Please wait{' '}
                                                                {
                                                                    remainingSeconds
                                                                }
                                                                s
                                                            </>
                                                        ) : processing ? (
                                                            <Spinner />
                                                        ) : (
                                                            <>
                                                                <LogIn className="mr-2 h-4.5 w-4.5 sm:h-5 sm:w-5" />{' '}
                                                                Sign in
                                                            </>
                                                        )}
                                                    </Button>

                                                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-center text-xs text-slate-500">
                                                        <span>Not an Admin?</span>
                                                        <TextLink
                                                            href={login()}
                                                            className="font-bold text-blue-600 hover:underline"
                                                            tabIndex={7}
                                                        >
                                                            Student
                                                        </TextLink>
                                                        <span>or</span>
                                                        <TextLink
                                                            href={programHeadLogin()}
                                                            className="font-bold text-blue-600 hover:underline"
                                                            tabIndex={8}
                                                        >
                                                            Program Head
                                                        </TextLink>
                                                    </div>
                                                </div>

                                                {status && (
                                                    <div className="mt-5 text-center text-sm font-medium text-green-600">
                                                        {status}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    }}
                                </Form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
