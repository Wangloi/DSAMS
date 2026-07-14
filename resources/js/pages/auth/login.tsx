import { Form, Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Lock, LogIn, User, Eye, EyeOff } from 'lucide-react';
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
import { landing } from '@/routes';
import { request } from '@/routes/password';
import { AuthLoadingOverlay } from '@/components/AuthLoadingOverlay';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

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
        <div className="relative flex min-h-svh w-full flex-row">
            <Head title="Log in" />

            {/* Left: Video Area */}
            <div className="relative hidden md:flex flex-col flex-1 overflow-hidden">
                <VideoBackground src="/images/OSABG.mp4" />

                {/* Overlay Content */}
                <div className="relative z-10 flex flex-col flex-1 justify-between p-12 text-[#1b2f8a]">
                    <div className="flex justify-start">
                        <Link
                            href={landing()}
                            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[#1b2f8a]/80 hover:text-[#1b2f8a] transition-colors bg-white/40 px-4 py-2 rounded-full backdrop-blur-md shadow-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                    </div>

                    <div className="flex flex-col gap-8 max-w-xl pb-12 self-start text-left">
                        <div className="flex items-center justify-start gap-4">
                            <img src="/images/SRCB.png" alt="SRCB" className="h-24 w-24 rounded-full bg-white/20 p-2 object-cover backdrop-blur-md shadow-2xl" />
                            <img src="/images/DSA.png" alt="DSA" className="h-24 w-24 rounded-full bg-white p-2 object-cover shadow-2xl" />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl lg:text-5xl leading-tight font-bold text-[#1b2f8a]">
                                Office of Student Affairs
                                <br />
                                Management System
                            </h1>
                            <p className="text-lg lg:text-xl text-[#1b2f8a]/90 font-semibold">
                                Your gateway to student affairs management.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Blue Form Panel */}
            <div className="relative z-10 flex w-full flex-col justify-center bg-[#1b2f8a] px-8 py-12 md:w-[480px] lg:w-[540px] sm:px-12 shadow-2xl shrink-0 h-svh overflow-y-auto">
                <div className="w-full max-w-sm mx-auto">
                    {/* Mobile back link */}
                    <Link
                        href={landing()}
                        className="mb-8 inline-flex md:hidden items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>

                    <div className="text-3xl font-semibold text-white">Welcome back, User</div>
                    <div className="mt-1 text-sm text-white/80">Sign in to access your dashboard</div>

                    <Form
                        action="/login"
                        method="post"
                        resetOnSuccess={['password']}
                        className="mt-8"
                        onBefore={() => setIsProcessing(true)}
                        onFinish={() => setIsProcessing(false)}
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-5">
                                    {/* Identifier */}
                                    <div className="space-y-2">
                                        <Label htmlFor="identifier" className="text-sm text-white/90">
                                            ID Number / Email
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="identifier"
                                                type="text"
                                                name="identifier"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="username"
                                                placeholder="Enter your ID number or email"
                                                className="h-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 pl-11 focus:bg-white/20"
                                            />
                                        </div>
                                        {errors.identifier && (
                                            <Alert variant="destructive" className="mt-2 bg-red-900/40 border-red-400/40 text-red-200">
                                                <AlertTriangle />
                                                <AlertDescription>{errors.identifier}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm text-white/90">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Enter your password"
                                                className="h-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 pl-11 pr-11 focus:bg-white/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <Alert variant="destructive" className="mt-2 bg-red-900/40 border-red-400/40 text-red-200">
                                                <AlertTriangle />
                                                <AlertDescription>{errors.password}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {/* Remember Me + Forgot Password */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#1b2f8a]"
                                            />
                                            <Label htmlFor="remember" className="text-sm text-white/90">
                                                Remember me
                                            </Label>
                                        </div>

                                        {canResetPassword && (
                                            <TextLink href={request()} className="text-sm text-white/80 font-medium hover:text-white" tabIndex={5}>
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>

                                    {/* Submit */}
                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-lg bg-white text-[#1b2f8a] hover:bg-slate-100 font-bold"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing ? <Spinner /> : <LogIn className="mr-2 h-5 w-5" />}
                                        Sign in
                                    </Button>

                                    {/* Register link */}
                                    {canRegister && (
                                        <div className="text-center text-sm text-white/80">
                                            Don&apos;t have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => setIsRegisterModalOpen(true)}
                                                tabIndex={6}
                                                className="text-white hover:text-white/80 font-bold"
                                            >
                                                Register here
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {status && (
                                    <Alert className="mt-5 bg-green-900/30 border-green-400/40 text-green-200">
                                        <CheckCircle />
                                        <AlertDescription>{status}</AlertDescription>
                                    </Alert>
                                )}
                            </>
                        )}
                    </Form>
                </div>
            </div>

            <RegistrationModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
            />

            <AuthLoadingOverlay
                visible={isProcessing}
                state="signing-in"
            />
        </div>
    );
}
