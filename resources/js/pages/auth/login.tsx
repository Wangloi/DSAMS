import { Form, Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Lock, LogIn, User, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import RegistrationModal from '@/components/RegistrationModal';
import Swal from 'sweetalert2';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import VideoBackground from '@/components/VideoBackground';
import { landing, forgotPassword, adminLogin, programHeadLogin } from '@/routes';
import InputError from '@/components/input-error';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
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
        <div className="relative flex min-h-svh w-full flex-row bg-slate-50 font-sans selection:bg-blue-500 selection:text-white overflow-hidden">
            <Head title="Log in - Student Affairs Management System" />

            {/* Left: Light Mode Video Area */}
            <div className="relative hidden flex-1 bg-slate-100 md:flex flex-col justify-between overflow-hidden">
                <VideoBackground />
                {/* Light bright gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/90 via-slate-100/60 to-white/40 backdrop-blur-[1px]" />
                <div className="absolute inset-0 bg-white/20" />

                {/* Desktop Header Navigation */}
                <div className="relative z-10 p-8 lg:p-12 flex items-center justify-between">
                    <Link
                        href={landing()}
                        className="group inline-flex items-center gap-2 text-sm text-[#1b2f8a] hover:text-[#162775] font-semibold transition-all px-4 py-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/80 shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span>Back to Home</span>
                    </Link>

                    {/* Dual Institutional Logos Badge */}
                    <div className="flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-md">
                        <img src="/images/SRCB1.png" alt="SRCB Logo" className="h-12 w-12 object-contain hover:scale-105 transition-transform" />
                        <span className="h-7 w-px bg-slate-300" />
                        <img src="/images/DSA.png" alt="DSA Logo" className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-200 hover:scale-105 transition-transform" />
                    </div>
                </div>

                {/* Hero Caption */}
                <div className="relative z-10 p-8 lg:p-16 max-w-2xl">
                    <div className="space-y-6">
                        {/* Prominent Hero Logos Display */}


                        <h1 className="text-4xl lg:text-6xl font-black text-[#1b2f8a] tracking-tight leading-tight">
                            Student Affairs <br />
                            <span className="text-[#23509A]">
                                Management System
                            </span>
                        </h1>

                        <p className="text-base lg:text-lg text-slate-700 leading-relaxed font-medium max-w-lg">
                            Streamlining student services, activities, event management, and discipline tracking into one modern unified platform.
                        </p>

                    </div>
                </div>
            </div>

            {/* Right: Modern Form Panel */}
            <div className="relative z-10 flex w-full flex-col justify-center bg-gradient-to-b from-[#1b2f8a] via-[#162775] to-[#101d5c] px-6 py-12 md:w-[480px] lg:w-[540px] sm:px-12 shadow-2xl shrink-0 h-svh overflow-y-auto border-l border-white/10">
                <div className="w-full max-w-sm mx-auto space-y-8">
                    {/* Mobile back link & logos */}
                    <div className="flex items-center justify-between md:hidden">
                        <Link
                            href={landing()}
                            className="inline-flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-white/10"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back
                        </Link>
                        <div className="flex items-center gap-3 bg-white/20 p-2 rounded-full backdrop-blur-md">
                            <img src="/images/SRCB.png" alt="SRCB" className="h-10 w-10 object-contain" />
                            <img src="/images/DSA.png" alt="DSA" className="h-10 w-10 rounded-full" />
                        </div>
                    </div>

                    {/* Panel Title Header */}
                    <div className="space-y-2 text-left">
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">
                            Welcome back
                        </h2>
                        <p className="text-sm text-slate-300/90">
                            Please enter your credentials to access your account.
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
                                    if (Swal.isVisible() && Swal.getTitle()?.textContent === 'Signing in...') {
                                        Swal.close();
                                    }
                                }
                            }, [processing]);

                            return (
                            <>
                                <div className="space-y-4">
                                    {/* Identifier Input */}
                                    <div className="space-y-2">
                                        <Label htmlFor="identifier" className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                                            ID Number or Email
                                        </Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-300 transition-colors" />
                                            <Input
                                                id="identifier"
                                                type="text"
                                                name="identifier"
                                                required
                                                tabIndex={1}
                                                autoFocus
                                                placeholder="Enter ID number or email"
                                                className="h-12 border-white/20 bg-white/10 text-white placeholder-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30 pl-11 rounded-xl transition-all"
                                            />
                                        </div>
                                        <InputError message={errors.identifier} />
                                    </div>

                                    {/* Password Input */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                                                Password
                                            </Label>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-300 transition-colors" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                required
                                                tabIndex={2}
                                                placeholder="Enter your password"
                                                className="h-12 border-white/20 bg-white/10 text-white placeholder-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30 pl-11 pr-11 rounded-xl transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    {/* Options: Remember & Forgot */}
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-2.5">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                                className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-[#1b2f8a] rounded"
                                            />
                                            <Label htmlFor="remember" className="text-xs font-medium text-slate-200 cursor-pointer">
                                                Remember me
                                            </Label>
                                        </div>

                                        {canResetPassword && (
                                            <TextLink href={forgotPassword()} className="text-xs text-blue-200 hover:text-white font-medium transition-colors" tabIndex={5}>
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="h-12 w-full rounded-xl bg-white text-[#1b2f8a] hover:bg-slate-100 font-bold text-sm shadow-lg shadow-black/20 hover:scale-[1.01] active:scale-[0.99] transition-all mt-2"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing ? <Spinner /> : <LogIn className="mr-2 h-5 w-5" />}
                                        Sign in
                                    </Button>


                                    {/* Register link */}
                                    {canRegister && (
                                        <div className="text-center text-xs text-slate-300/90 pt-2">
                                            Don&apos;t have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => setIsRegisterModalOpen(true)}
                                                tabIndex={6}
                                                className="text-white hover:text-blue-200 font-bold underline underline-offset-4 ml-1"
                                            >
                                                Register here
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {status && (
                                    <Alert className="mt-4 bg-emerald-900/40 border-emerald-500/40 text-emerald-200 rounded-xl">
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                        <AlertDescription>{status}</AlertDescription>
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
