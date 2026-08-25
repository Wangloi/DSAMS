// Components
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import VideoBackground from '@/components/VideoBackground';
import { forgotPassword, login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle, Mail } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <div className="relative min-h-svh overflow-hidden">
            <VideoBackground />

            <div className="absolute inset-0 bg-blue-900/50" />
            <div className="flex min-h-svh items-center justify-center px-5 py-6">
                <Head title="Forgot password" />

                <div className="mx-auto w-full max-w-md">
                    <div className="rounded-3xl bg-white/40 p-6 shadow-sm backdrop-blur">
                        <div className="mb-4">
                            <TextLink
                                href={login()}
                                className="inline-flex items-center gap-2 text-slate-700 transition-colors hover:text-slate-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </TextLink>
                        </div>

                        <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-[#1b2f8a] to-[#0b1c5c] px-4 py-4 text-center text-white shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                                <Mail className="h-7 w-7 text-white" />
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold">
                                Forgot
                            </h1>
                            <p className="text-2xl font-semibold">Password</p>
                            <p className="mt-1 text-xs text-white/90">
                                Enter your email to receive a password reset
                                link
                            </p>
                        </div>

                        {status && (
                            <div className="mt-4 text-center text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}

                        <Form
                            action={forgotPassword()}
                            method="post"
                            className="mt-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="email"
                                            className="text-sm text-slate-900"
                                        >
                                            Email address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                autoComplete="off"
                                                autoFocus
                                                placeholder="email@example.com"
                                                className="h-10 rounded-xl bg-slate-100 pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="mt-5 flex items-center justify-start">
                                        <Button
                                            className="h-10 w-full rounded-xl bg-[#3b66d7] text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#335cc7] active:translate-y-0"
                                            disabled={processing}
                                            data-test="email-password-reset-link-button"
                                        >
                                            {processing && (
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Email password reset link
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>

                        <div className="mt-4 space-x-1 text-center text-sm text-black">
                            <span>Or, return to</span>
                            <TextLink href={login()}>log in</TextLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
