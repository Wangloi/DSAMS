import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsPageLayout from '@/layouts/settings/settings-page-layout';
import { Transition } from '@headlessui/react';
import { Form } from '@inertiajs/react';
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { useRef, useState } from 'react';

const inputClassName =
    'h-11 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-white focus-visible:border-[#23509A] focus-visible:ring-[#23509A]/20';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <SettingsPageLayout title="Password settings">
            <Card className="border-slate-200/80 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="h-1.5 bg-gradient-to-r from-[#23509A] via-[#000D6A] to-[#23509A]" />
                <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#23509A]/10 text-[#23509A] dark:bg-[#23509A]/20 dark:text-blue-300">
                            <Lock className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                                Update password
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm">
                                Use a strong, unique password. You will stay
                                signed in after updating.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Form
                        action="/settings/password"
                        method="put"
                        options={{ preserveScroll: true }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) passwordInput.current?.focus();
                            if (errors.current_password)
                                currentPasswordInput.current?.focus();
                        }}
                        className="space-y-5"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="current_password"
                                        className="text-slate-700 dark:text-slate-300"
                                    >
                                        Current password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            type={
                                                showCurrent
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            className={
                                                inputClassName + ' pr-10'
                                            }
                                            autoComplete="current-password"
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCurrent((v) => !v)
                                            }
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                            tabIndex={-1}
                                            aria-label={
                                                showCurrent
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                        >
                                            {showCurrent ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError
                                        message={errors.current_password}
                                    />
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="password"
                                            className="text-slate-700 dark:text-slate-300"
                                        >
                                            New password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                ref={passwordInput}
                                                name="password"
                                                type={
                                                    showNew
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                className={
                                                    inputClassName + ' pr-10'
                                                }
                                                autoComplete="new-password"
                                                placeholder="New password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowNew((v) => !v)
                                                }
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                tabIndex={-1}
                                                aria-label={
                                                    showNew
                                                        ? 'Hide password'
                                                        : 'Show password'
                                                }
                                            >
                                                {showNew ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="password_confirmation"
                                            className="text-slate-700 dark:text-slate-300"
                                        >
                                            Confirm new password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                type={
                                                    showConfirm
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                className={
                                                    inputClassName + ' pr-10'
                                                }
                                                autoComplete="new-password"
                                                placeholder="Repeat new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirm((v) => !v)
                                                }
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                tabIndex={-1}
                                                aria-label={
                                                    showConfirm
                                                        ? 'Hide password'
                                                        : 'Show password'
                                                }
                                            >
                                                {showConfirm ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            data-test="update-password-button"
                                            className="h-10 min-w-[140px] bg-gradient-to-r from-[#23509A] to-[#000D6A] text-white shadow-sm hover:from-[#1e4a8a] hover:to-[#000a5a]"
                                        >
                                            {processing
                                                ? 'Saving…'
                                                : 'Save password'}
                                        </Button>
                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-out duration-200"
                                            enterFrom="opacity-0"
                                            leave="transition ease-in duration-150"
                                            leaveTo="opacity-0"
                                        >
                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2
                                                    className="h-4 w-4"
                                                    aria-hidden
                                                />
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
        </SettingsPageLayout>
    );
}
