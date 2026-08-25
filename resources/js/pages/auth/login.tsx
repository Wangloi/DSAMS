import InputError from '@/components/input-error';
import RegistrationModal from '@/components/RegistrationModal';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import VideoBackground from '@/components/VideoBackground';
import { forgotPassword, landing } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle,
    Eye,
    EyeOff,
    Lock,
    LogIn,
    User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    return (
        <div className="relative flex min-h-svh w-full flex-row overflow-hidden bg-slate-50 font-sans selection:bg-blue-500 selection:text-white">
            <Head title="Log in - Student Affairs Management System" />

            {/* Left: Light Mode Video Area */}
            <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-slate-100 md:flex">
                <VideoBackground />
                {/* Light bright gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/90 via-slate-100/60 to-white/40 backdrop-blur-[1px]" />
                <div className="absolute inset-0 bg-white/20" />

                {/* Desktop Header Navigation */}
                <div className="relative z-10 flex items-center justify-between p-8 lg:p-12">
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
                            alt="DSA Logo"
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-200 transition-transform hover:scale-105"
                        />
                    </div>
                </div>

                {/* Hero Caption */}
                <div className="relative z-10 max-w-2xl p-8 lg:p-16">
                    <div className="space-y-6">
                        {/* Prominent Hero Logos Display */}

                        <h1 className="text-4xl leading-tight font-black tracking-tight text-[#1b2f8a] lg:text-6xl">
                            Student Affairs <br />
                            <span className="text-[#23509A]">
                                Management System
                            </span>
                        </h1>

                        <p className="max-w-lg text-base leading-relaxed font-medium text-slate-700 lg:text-lg">
                            Streamlining student services, activities, event
                            management, and discipline tracking into one modern
                            unified platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: Modern Form Panel */}
            <div className="relative z-10 flex h-svh w-full shrink-0 flex-col justify-center overflow-y-auto border-l border-white/10 bg-gradient-to-b from-[#1b2f8a] via-[#162775] to-[#101d5c] px-6 py-12 shadow-2xl sm:px-12 md:w-[480px] lg:w-[540px]">
                <div className="mx-auto w-full max-w-sm space-y-8">
                    {/* Mobile back link & logos */}
                    <div className="flex items-center justify-between md:hidden">
                        <Link
                            href={landing()}
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 transition-colors hover:text-white"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back
                        </Link>
                        <div className="flex items-center gap-3 rounded-full bg-white/20 p-2 backdrop-blur-md">
                            <img
                                src="/images/SRCB.png"
                                alt="SRCB"
                                className="h-10 w-10 object-contain"
                            />
                            <img
                                src="/images/DSA.png"
                                alt="DSA"
                                className="h-10 w-10 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Panel Title Header */}
                    <div className="space-y-2 text-left">
                        <h2 className="text-3xl font-extrabold tracking-tight text-white">
                            Welcome back
                        </h2>
                        <p className="text-sm text-slate-300/90">
                            Please enter your credentials to access your
                            account.
                        </p>
                    </div>

                    {/* Login Form */}
                    <Form
                        action="/login"
                        method="post"
                        resetOnSuccess={['password']}
                        className="space-y-5"
                    >
                        {({ processing, errors }) => {
                            useEffect(() => {
                                if (processing) {
                                    Swal.fire({
                                        title: 'Signing in...',
                                        text: 'Please wait while we verify your credentials.',
                                        allowOutsideClick: false,
                                        allowEscapeKey: false,
                                        didOpen: () => {
                                            Swal.showLoading();
                                        },
                                    });
                                } else {
                                    if (
                                        Swal.isVisible() &&
                                        Swal.getTitle()?.textContent ===
                                            'Signing in...'
                                    ) {
                                        Swal.close();
                                    }
                                }
                            }, [processing]);

                            return (
                                <>
                                    <div className="space-y-4">
                                        {/* Identifier Input */}
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="identifier"
                                                className="text-xs font-semibold tracking-wider text-slate-200 uppercase"
                                            >
                                                ID Number or Email
                                            </Label>
                                            <div className="group relative">
                                                <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300" />
                                                <Input
                                                    id="identifier"
                                                    type="text"
                                                    name="identifier"
                                                    required
                                                    tabIndex={1}
                                                    autoFocus
                                                    placeholder="Enter ID number or email"
                                                    className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 text-white placeholder-slate-400 transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30"
                                                />
                                            </div>
                                            <InputError
                                                message={errors.identifier}
                                            />
                                        </div>

                                        {/* Password Input */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="password"
                                                    className="text-xs font-semibold tracking-wider text-slate-200 uppercase"
                                                >
                                                    Password
                                                </Label>
                                            </div>
                                            <div className="group relative">
                                                <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300" />
                                                <Input
                                                    id="password"
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    placeholder="Enter your password"
                                                    className="h-12 rounded-xl border-white/20 bg-white/10 pr-11 pl-11 text-white placeholder-slate-400 transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword,
                                                        )
                                                    }
                                                    className="absolute top-1/2 right-4 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-white"
                                                    aria-label={
                                                        showPassword
                                                            ? 'Hide password'
                                                            : 'Show password'
                                                    }
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-5 w-5" />
                                                    ) : (
                                                        <Eye className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        {/* Options: Remember & Forgot */}
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-2.5">
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
                                                    className="text-xs font-medium text-blue-200 transition-colors hover:text-white"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                </TextLink>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            className="mt-2 h-12 w-full rounded-xl bg-white text-sm font-bold text-[#1b2f8a] shadow-lg shadow-black/20 transition-all hover:scale-[1.01] hover:bg-slate-100 active:scale-[0.99]"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <LogIn className="mr-2 h-5 w-5" />
                                            )}
                                            Sign in
                                        </Button>

                                        {/* Register link */}
                                        {canRegister && (
                                            <div className="pt-2 text-center text-xs text-slate-300/90">
                                                Don&apos;t have an account?{' '}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsRegisterModalOpen(
                                                            true,
                                                        )
                                                    }
                                                    tabIndex={6}
                                                    className="ml-1 font-bold text-white underline underline-offset-4 hover:text-blue-200"
                                                >
                                                    Register here
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {status && (
                                        <Alert className="mt-4 rounded-xl border-emerald-500/40 bg-emerald-900/40 text-emerald-200">
                                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                                            <AlertDescription>
                                                {status}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </>
                            );
                        }}
                    </Form>
                </div>
            </div>

            <RegistrationModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
            />
        </div>
    );
}
