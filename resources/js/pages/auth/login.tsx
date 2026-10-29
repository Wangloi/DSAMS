import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import VideoBackground from '@/components/VideoBackground';
import { focusFirstInvalidField } from '@/lib/formFocusNavigation';
import { forgotPassword, landing } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle,
    Eye,
    EyeOff,
    Lock,
    LogIn,
    Shield,
    User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getDeviceBindingInfo } from '@/lib/device-uuid';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
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
                }).then(() => {
                    setTimeout(() => focusFirstInvalidField(), 50);
                });
            }
        }
    }, [errors]);

    return null;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const [identifier, setIdentifier] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState({ deviceUuid: '', deviceName: '' });

    useEffect(() => {
        setDeviceInfo(getDeviceBindingInfo());
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search.includes('expired=1')) {
            Swal.fire({
                title: 'Session Expired',
                text: 'Your session expired due to inactivity. Please sign in again to continue.',
                icon: 'info',
                confirmButtonColor: '#1b2f8a',
                customClass: {
                    popup: 'rounded-2xl p-6 shadow-2xl font-sans',
                    title: 'text-2xl font-black text-slate-800',
                    htmlContainer: 'text-sm text-slate-600 font-medium mt-2',
                },
            });
        } else if (status) {
            Swal.fire({
                title: 'Success!',
                text: status,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    }, [status]);

    return (
        <div className="relative flex h-screen max-h-screen min-h-svh w-full flex-row overflow-hidden bg-slate-50 font-sans selection:bg-blue-500 selection:text-white">
            <Head title="Log in - Student Affairs Management System" />

            {/* Left: Video Area with White Opacity Overlay */}
            <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-slate-100 md:flex">
                <VideoBackground />
                {/* White Opacity Overlay */}
                <div className="absolute inset-0 bg-white/45 backdrop-blur-[1px]" />

                {/* Desktop Header Navigation */}
                <div className="relative z-10 flex flex-col gap-4 items-start lg:flex-row lg:items-center lg:justify-between p-8 lg:p-12">
                    <Link
                        href={landing()}
                        className="group inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-[#1b2f8a] shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-[#162775]"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span>Back to Home</span>
                    </Link>

                    {/* Dual Institutional Logos Badge */}
                    <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 shadow-md backdrop-blur-md">
                        <img
                            src="/images/SRCB1.png"
                            alt="SRCB Logo"
                            className="h-12 w-12 object-contain transition-transform hover:scale-105"
                        />
                        <span className="h-7 w-px bg-slate-300" />
                        <img
                            src="/images/DSA.png"
                            alt="OSA Logo"
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-200 transition-transform hover:scale-105"
                        />
                    </div>
                </div>

                {/* Hero Caption */}
                <div className="relative z-10 max-w-2xl p-8 lg:p-16">
                    <div className="space-y-6">
                        {/* Prominent Hero Logos Display */}

                        <h1 className="text-4xl leading-tight font-black tracking-tight text-[#1b2f8a] lg:text-6xl">
                            <span className="sr-only">Student Affairs Management System</span>
                            <img
                                src="/images/OSA_BNR1.png"
                                alt="Student Affairs Management System"
                                className="h-auto w-full max-w-md object-contain transition-transform hover:scale-[1.01]"
                            />
                        </h1>

                        <p className="max-w-lg text-base leading-relaxed font-semibold text-slate-700 lg:text-lg">
                            Streamlining student services, activities, event
                            management, and discipline tracking into one modern
                            unified platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: Modern Form Panel with original Royal Blue Theme */}
            <div className="relative z-10 flex h-full max-h-screen min-h-svh w-full shrink-0 flex-col justify-center overflow-x-hidden overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-l border-white/10 bg-gradient-to-b from-[#1b2f8a] via-[#162775] to-[#0f1b52] px-4 py-6 shadow-2xl sm:px-10 sm:py-8 md:h-screen md:max-h-screen md:w-[480px] lg:w-[540px]">
                {/* Subtle Professional Ambient Lighting within Royal Blue Theme */}
                <div
                    className="pointer-events-none absolute inset-x-0 -top-20 h-96 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12)_0%,transparent_70%)]"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-blue-400/10 blur-[100px]"
                    aria-hidden="true"
                />

                {/* Subtle Modern Dot-Matrix Texture */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_40%,transparent_100%)]"
                    aria-hidden="true"
                />

                <div className="relative z-10 mx-auto my-auto w-full max-w-sm space-y-4 sm:space-y-5">
                    {/* Mobile Top Navigation with Home link */}
                    <div className="flex items-center justify-between md:hidden">
                        <Link
                            href={landing()}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-md transition-all hover:bg-white/20 hover:text-white"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Home</span>
                        </Link>
                    </div>

                    {/* Centered Dual Institutional Logos on Mobile */}
                    <div className="relative flex flex-col items-center justify-center md:hidden">
                        {/* Soft ambient halo behind logos */}
                        <div className="pointer-events-none absolute h-20 w-44 rounded-full bg-white/10 blur-xl" />
                        <div className="relative flex items-center justify-center gap-4">
                            <img
                                src="/images/SRCB1.png"
                                alt="SRCB Logo"
                                className="h-16 w-16 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] transition-transform hover:scale-105"
                            />
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.25)] ring-2 ring-white/30 transition-transform hover:scale-105">
                                <img
                                    src="/images/DSA.ico"
                                    alt="OSA Logo"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        </div>

                        {/* Institutional Text Below Logos */}
                        <div className="mt-2.5 text-center space-y-0.5">
                            <h3 className="text-xs font-bold tracking-wider text-white uppercase sm:text-sm">
                                St. Rita&apos;s College of Balingasag
                            </h3>
                            <p className="text-xs font-medium text-blue-200/90">
                                Office of Student Affairs
                            </p>
                        </div>
                    </div>

                    {/* Panel Title Header */}
                    <div className="space-y-1.5 text-center sm:text-left">
                        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                            Welcome back
                        </h2>
                        <p className="text-xs text-slate-300/90 sm:text-sm">
                            Please enter your credentials to access your account.
                        </p>
                    </div>

                    {/* Login Form */}
                    <Form
                        action="/login"
                        method="post"
                        resetOnSuccess={['password']}
                        className="space-y-3 sm:space-y-4"
                    >
                        {({ processing, errors }) => {
                            return (
                                <>
                                    <AuthErrorAlert errors={errors} />
                                    <div className="space-y-3.5 sm:space-y-4">
                                        {/* Identifier Input */}
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="identifier"
                                                className="text-[11px] font-bold tracking-wider text-slate-200 uppercase sm:text-xs"
                                            >
                                                ID Number or Email
                                            </Label>
                                            <div className="group relative">
                                                <User className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300 sm:left-4 sm:h-5 sm:w-5" />
                                                <Input
                                                    id="identifier"
                                                    type="text"
                                                    name="identifier"
                                                    tabIndex={1}
                                                    autoFocus
                                                    value={identifier}
                                                    hasError={!!errors.identifier}
                                                    aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                                                    onChange={(e) => setIdentifier(e.target.value)}
                                                    placeholder="Enter ID number or email"
                                                    className="h-11 rounded-xl border-white/20 bg-white/10 pl-10 text-base text-white placeholder-slate-400 transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30 sm:h-12 sm:pl-11 sm:text-sm"
                                                />
                                            </div>
                                            <InputError
                                                id="identifier-error"
                                                message={errors.identifier}
                                            />
                                        </div>

                                        {/* Password Input */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="password"
                                                    className="text-[11px] font-bold tracking-wider text-slate-200 uppercase sm:text-xs"
                                                >
                                                    Password
                                                </Label>
                                            </div>
                                            <div className="group relative">
                                                <Lock className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300 sm:left-4 sm:h-5 sm:w-5" />
                                                <Input
                                                    id="password"
                                                    type={
                                                        showPassword
                                                             ? 'text'
                                                            : 'password'
                                                    }
                                                    name="password"
                                                    tabIndex={2}
                                                    hasError={!!errors.password}
                                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                                    placeholder="Enter your password"
                                                    className="h-11 rounded-xl border-white/20 bg-white/10 pr-10 pl-10 text-base text-white placeholder-slate-400 transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30 sm:h-12 sm:pr-11 sm:pl-11 sm:text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword,
                                                        )
                                                    }
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 text-slate-400 transition-colors hover:text-white sm:right-4"
                                                    aria-label={
                                                        showPassword
                                                            ? 'Hide password'
                                                            : 'Show password'
                                                    }
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                                    ) : (
                                                        <Eye className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                                    )}
                                                </button>
                                            </div>
                                            <InputError
                                                id="password-error"
                                                message={errors.password}
                                            />
                                        </div>

                                        {/* Options: Remember & Forgot */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="remember"
                                                    name="remember"
                                                    tabIndex={3}
                                                    className="rounded border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-[#1b2f8a]"
                                                />
                                                <Label
                                                    htmlFor="remember"
                                                    className="cursor-pointer text-xs font-medium text-slate-200"
                                                >
                                                    Remember me
                                                </Label>
                                            </div>

                                            {canResetPassword && (
                                                <TextLink
                                                    href={forgotPassword()}
                                                    className="text-xs font-semibold text-blue-200 transition-colors hover:text-white"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                </TextLink>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            className="mt-2 h-11 w-full rounded-xl bg-white text-sm font-bold text-[#1b2f8a] shadow-lg shadow-black/20 transition-all hover:scale-[1.01] hover:bg-slate-100 active:scale-[0.99] sm:h-12"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <LogIn className="mr-2 h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                            )}
                                            Sign in
                                        </Button>
                                    </div>

                                    {/* One Device, One Account Policy Hidden Inputs */}
                                    <input
                                        type="hidden"
                                        name="device_uuid"
                                        value={deviceInfo.deviceUuid}
                                    />
                                    <input
                                        type="hidden"
                                        name="device_name"
                                        value={deviceInfo.deviceName}
                                    />

                                    {status && (
                                        <Alert className="mt-4 rounded-xl border-emerald-500/40 bg-emerald-900/40 text-emerald-200">
                                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                                            <AlertDescription>
                                                {status}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Device Integrity Assurance Badge */}
                                    <div className="pt-2 text-center">
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300/80 backdrop-blur-sm">
                                            <Shield className="h-3 w-3 text-emerald-400" />
                                            <span>Protected by 1-Device, 1-Account Attendance Policy</span>
                                        </div>
                                    </div>
                                </>
                            );
                        }}
                    </Form>
                </div>
            </div>
        </div>
    );
}
