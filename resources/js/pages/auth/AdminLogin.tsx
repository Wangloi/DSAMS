import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Lock, LogIn, ShieldAlert, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import RegistrationModal from '@/components/RegistrationModal';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import VideoBackground from '@/components/VideoBackground';
import { adminLogin, programHeadLogin, register, login, forgotPassword } from '@/routes';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    loginBlockedUntil?: string | null;
    securityAlerts?: any[];
};

export default function AdminLogin({
    status,
    canResetPassword,
    canRegister,
    loginBlockedUntil,
    securityAlerts,
}: Props) {
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
        if (loginBlockedUntil) {
            const diff = Math.ceil((new Date(loginBlockedUntil).getTime() - Date.now()) / 1000);
            return diff > 0 ? diff : null;
        }
        return null;
    });

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
                    setRemainingSeconds(data.login_blocked && data.remaining_seconds > 0 ? data.remaining_seconds : null);
                }
            } catch {
                // silent
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative min-h-svh overflow-hidden">
            <VideoBackground />
            <div className="absolute inset-0 bg-blue-900/50" />

            <Head title="Admin Login" />

            <div className="relative flex min-h-svh items-center justify-center px-4 py-10">
                <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="relative hidden md:flex flex-col bg-[#1b2f8a] text-white">
                            <Link
                                href="/"
                                className="px-4 py-4 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Link>

                            <div className="flex-1 flex flex-col justify-center px-12 pb-12">
                                <div className="flex items-center justify-center gap-4 w-full">
                                    <img src="/images/SRCB.png" alt="SRCB" className="h-20 w-20 rounded-full bg-white/10 p-1 object-cover" />
                                    <img src="/images/DSA.jpg" alt="DSA" className="h-20 w-20 rounded-full bg-white/10 p-1 object-cover" />
                                </div>

                                <div className="mt-10 space-y-4 text-center">
                                    <div className="text-3xl leading-tight font-semibold">
                                        Office of Student Affairs
                                        <br />
                                        Management System
                                    </div>
                                    <div className="text-sm text-white/80">Your gateway to student affairs management</div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-12 sm:px-12">
                            <div className="max-w-md">
                                <Link
                                    href="/"
                                    className="mb-6 inline-flex md:hidden items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </Link>

                                <div className="text-3xl font-semibold text-slate-90">Welcome back, Admin</div>
                                <div className="mt-1 text-sm text-slate-60">Sign in to access your dashboard</div>

                                {isBlocked && (
                                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                        <div>
                                            <div className="text-sm font-semibold text-amber-900">
                                                Too many failed attempts
                                            </div>
                                            <div className="mt-0.5 text-xs text-amber-700">
                                                Please wait <span className="font-bold">{remainingSeconds}s</span> before trying again.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {securityAlerts && securityAlerts.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {securityAlerts.map((alert) => (
                                            <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
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

                                <Form action="/admin-login" method="post" resetOnSuccess={['password']} className="mt-8">
                                    {({ processing, errors }: { processing: boolean; errors: Record<string, string | undefined> }) => (
                                        <>
                                            <div className="space-y-5">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-sm text-slate-700">
                                                        Username
                                                    </Label>
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            name="email"
                                                            required
                                                            autoFocus
                                                            tabIndex={1}
                                                            autoComplete="email"
                                                            placeholder="Enter your username"
                                                            className="h-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-500 pl-11"
                                                        />
                                                    </div>
                                                    <InputError message={errors.email} />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="password" className="text-sm text-slate-700">
                                                        Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                                        <Input
                                                            id="password"
                                                            type="password"
                                                            name="password"
                                                            required
                                                            tabIndex={2}
                                                            autoComplete="current-password"
                                                            placeholder="Enter your password"
                                                            className="h-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-500 pl-11"
                                                        />
                                                    </div>
                                                    <InputError message={errors.password} />
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox id="remember" name="remember" tabIndex={3} />
                                                        <Label htmlFor="remember" className="text-sm text-slate-700">
                                                            Remember me
                                                        </Label>
                                                    </div>

                                                    {canResetPassword && (
                                                        <TextLink href={request()} className="text-sm text-blue-700" tabIndex={5}>
                                                            Forgot password?
                                                        </TextLink>
                                                    )}
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="h-11 w-full rounded-lg bg-[#2f4fd0] text-white hover:bg-[#2746c2]"
                                                    tabIndex={4}
                                                    disabled={processing || isBlocked}
                                                    data-test="login-button"
                                                >
                                                    {isBlocked
                                                        ? <>Please wait {remainingSeconds}s</>
                                                        : processing
                                                            ? <Spinner />
                                                            : <><LogIn className="mr-2 h-5 w-5" /> Sign in</>
                                                    }
                                                </Button>

                                                <div className="text-center text-sm text-slate-600">
                                                    Not an Admin?{' '}
                                                    <TextLink href={login()} className="text-blue-700" tabIndex={7}>
                                                        Student
                                                    </TextLink>
                                                    {' '}or{' '}
                                                    <TextLink href={programHeadLogin()} className="text-blue-700" tabIndex={8}>
                                                        Program Head
                                                    </TextLink>
                                                </div>

                                                {canRegister && (
                                                    <div className="text-center text-sm text-slate-600">
                                                        Don&apos;t have an account?{' '}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setIsRegisterModalOpen(true)} 
                                                            tabIndex={6} 
                                                            className="text-blue-700 hover:text-blue-600 font-medium"
                                                        >
                                                            Register here
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {status && (
                                                <div className="mt-5 text-center text-sm font-medium text-green-600">{status}</div>
                                            )}
                                        </>
                                    )}
                                </Form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <RegistrationModal 
                isOpen={isRegisterModalOpen} 
                onClose={() => setIsRegisterModalOpen(false)} 
            />
        </div>
    );
}
