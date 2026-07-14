import { Transition } from '@headlessui/react';
import { Form, Link, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Mail, UserRound } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import SettingsPageLayout from '@/layouts/settings/settings-page-layout';
import { send } from '@/routes/verification';
import type { SharedData } from '@/types';

const inputClassName =
    'h-11 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-white focus-visible:border-[#23509A] focus-visible:ring-[#23509A]/20';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();
    const user = auth?.user;
    const isVerified = user?.email_verified_at != null;
    const roleLabel = auth?.roleLabel;

    return (
        <SettingsPageLayout title="Profile settings">
                {/* Profile overview — recognition over recall */}
                <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="h-1.5 bg-gradient-to-r from-[#23509A] via-[#000D6A] to-[#23509A]" />
                    <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-6">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-md ring-2 ring-[#23509A]/20">
                            <AvatarFallback className="bg-gradient-to-br from-[#23509A] to-[#000D6A] text-lg font-semibold text-white">
                                {getInitials(user?.name ?? '')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.name ?? '—'}</p>
                                {roleLabel && (
                                    <Badge variant="secondary" className="bg-[#23509A]/10 text-[#23509A] dark:bg-blue-500/15 dark:text-blue-300">
                                        {roleLabel}
                                    </Badge>
                                )}
                            </div>
                            <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                                <span className="truncate">{user?.email ?? '—'}</span>
                            </p>
                            <div className="pt-1">
                                {isVerified ? (
                                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                        <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden />
                                        Email verified
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                        <AlertCircle className="mr-1 h-3 w-3" aria-hidden />
                                        Email not verified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile form — clear labels, immediate feedback */}
                <Card className="border-slate-200/80 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#23509A]/10 text-[#23509A] dark:bg-[#23509A]/20 dark:text-blue-300">
                                <UserRound className="h-5 w-5" aria-hidden />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                                    Profile information
                                </CardTitle>
                                <CardDescription className="mt-1 text-sm">
                                    Update the name and email shown across DSAMS. Changes apply after you save.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Form
                            {...ProfileController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            className="space-y-5"
                        >
                            {({ processing, recentlySuccessful, errors }) => (
                                <>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2 sm:col-span-1">
                                            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                                                Full name
                                            </Label>
                                            <Input
                                                id="name"
                                                className={inputClassName}
                                                defaultValue={user?.name}
                                                name="name"
                                                required
                                                autoComplete="name"
                                                placeholder="Your full name"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-2 sm:col-span-1">
                                            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                                                Email address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                className={inputClassName}
                                                defaultValue={user?.email}
                                                name="email"
                                                required
                                                autoComplete="username"
                                                placeholder="you@example.com"
                                            />
                                            <InputError message={errors.email} />
                                        </div>
                                    </div>

                                    {mustVerifyEmail && !isVerified && (
                                        <div
                                            role="status"
                                            className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100"
                                        >
                                            <p className="font-medium">Verify your email address</p>
                                            <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                                                Your email is not verified yet.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="font-semibold text-[#23509A] underline underline-offset-2 hover:text-[#000D6A] dark:text-blue-300"
                                                >
                                                    Resend verification email
                                                </Link>
                                            </p>
                                            {status === 'verification-link-sent' && (
                                                <p className="mt-2 flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                                                    A new verification link was sent to your inbox.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Required fields are marked by the browser. Your session stays active after saving.
                                        </p>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                data-test="update-profile-button"
                                                className="h-10 min-w-[120px] bg-gradient-to-r from-[#23509A] to-[#000D6A] text-white shadow-sm hover:from-[#1e4a8a] hover:to-[#000a5a] focus-visible:ring-[#23509A]/30"
                                            >
                                                {processing ? 'Saving…' : 'Save changes'}
                                            </Button>
                                            <Transition
                                                show={recentlySuccessful}
                                                enter="transition ease-out duration-200"
                                                enterFrom="opacity-0 translate-y-1"
                                                enterTo="opacity-100 translate-y-0"
                                                leave="transition ease-in duration-150"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                                                    Saved
                                                </span>
                                            </Transition>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <DeleteUser />
        </SettingsPageLayout>
    );
}
