import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormRequiredNotice } from '@/components/ui/form-required-notice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { focusFirstInvalidField } from '@/lib/formFocusNavigation';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    Clock,
    KeyRound,
    Lock,
    Mail,
    Shield,
    ShieldAlert,
    User,
    UserCheck,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function AddAdminDialog({ open, onOpenChange }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmHandover, setConfirmHandover] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmHandover(false);
        setErrors({});
        onOpenChange(false);
    };

    const formRef = React.useRef<HTMLFormElement>(null);

    const handleBlur = (field: 'name' | 'email' | 'password') => {
        setErrors((prev) => {
            const next = { ...prev };
            if (field === 'name') {
                if (!name.trim()) next.name = 'Please enter administrator full name.';
                else delete next.name;
            } else if (field === 'email') {
                if (!email.trim()) next.email = 'Please enter institutional email address.';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Please enter a valid email address.';
                else delete next.email;
            } else if (field === 'password') {
                if (!password) next.password = 'Please enter an initial password.';
                else if (password.length < 8) next.password = 'Password must be at least 8 characters long.';
                else delete next.password;
            }
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};

        if (!name.trim()) errs.name = 'Please enter administrator full name.';
        if (!email.trim()) errs.email = 'Please enter institutional email address.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.';
        if (!password) errs.password = 'Please enter an initial password.';
        else if (password.length < 8) errs.password = 'Password must be at least 8 characters long.';
        if (!confirmHandover)
            errs.confirmHandover =
                'Please acknowledge the 3-day handover transition period to proceed.';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            setTimeout(() => {
                focusFirstInvalidField(formRef.current);
            }, 50);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        router.post(
            '/admin/manage-users/admin',
            {
                name,
                email,
                password,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    handleClose();
                },
                onError: (backendErrors: any) => {
                    setIsSubmitting(false);
                    setErrors(backendErrors);
                    setTimeout(() => {
                        focusFirstInvalidField(formRef.current);
                    }, 50);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="lg" preventClose={isSubmitting} className="flex max-h-[85vh] w-[95vw] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 [&>button]:hidden">
                {/* Hero Header */}
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#23509A] px-6 py-4.5 text-white shadow-md">
                    <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-[#8CE4FF]/10 blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md shrink-0">
                                <Shield className="h-5 w-5 text-[#8CE4FF]" />
                            </div>
                            <DialogHeader className="p-0 text-left">
                                <DialogTitle className="text-lg font-black tracking-tight text-white sm:text-xl flex items-center gap-2">
                                    <span>Add New Administrator</span>
                                    <span className="rounded-full bg-blue-400/20 px-2 py-0.5 text-[10px] font-bold text-[#8CE4FF] uppercase tracking-wider">
                                        Handover Flow
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs font-medium text-blue-100/90">
                                    Register a successor Dean or Administrator with full system privileges.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            aria-label="Close dialog"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-100 cursor-pointer shrink-0"
                        >
                            <X className="h-4.5 w-4.5" />
                        </button>
                    </div>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 flex flex-col justify-between">
                    {/* Required Notice */}
                    <FormRequiredNotice message="Fields marked with * or Required must be completed." />

                    {/* 3-Day Handover Warning Banner */}
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30">
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0 shadow">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <div className="font-bold text-amber-900 dark:text-amber-200">
                                    3-Day Admin Handover & Grace Period Policy
                                </div>
                                <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                                    Creating this new administrator account will activate their access immediately. 
                                    Your current administrator account will remain active for <span className="font-bold underline">3 days (72 hours)</span> to assist in the transition, after which it will automatically expire and be deactivated.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Input Fields */}
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="new_admin_name"
                                required
                                showRequiredBadge
                                className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                            >
                                New Admin Full Name
                            </Label>
                            <div className="relative">
                                <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="new_admin_name"
                                    placeholder="e.g. Dr. Maria Santos (New Dean of Student Affairs)"
                                    value={name}
                                    hasError={!!errors.name}
                                    onBlur={() => handleBlur('name')}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) {
                                            setErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.name;
                                                return next;
                                            });
                                        }
                                    }}
                                    aria-describedby={errors.name ? 'admin-name-error' : undefined}
                                    className="pl-10 text-xs sm:text-sm rounded-xl"
                                />
                            </div>
                            <InputError id="admin-name-error" message={errors.name} />
                        </div>

                        {/* Email */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="new_admin_email"
                                required
                                showRequiredBadge
                                className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                            >
                                Institutional Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="new_admin_email"
                                    type="email"
                                    placeholder="e.g. heddsa@srcb.edu.ph"
                                    value={email}
                                    hasError={!!errors.email}
                                    onBlur={() => handleBlur('email')}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) {
                                            setErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.email;
                                                return next;
                                            });
                                        }
                                    }}
                                    aria-describedby={errors.email ? 'admin-email-error' : undefined}
                                    className="pl-10 text-xs sm:text-sm rounded-xl"
                                />
                            </div>
                            <InputError id="admin-email-error" message={errors.email} />
                        </div>

                        {/* Password */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="new_admin_password"
                                required
                                showRequiredBadge
                                className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                            >
                                Initial Secure Password (Min. 8 characters)
                            </Label>
                            <div className="relative">
                                <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="new_admin_password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    hasError={!!errors.password}
                                    onBlur={() => handleBlur('password')}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) {
                                            setErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.password;
                                                return next;
                                            });
                                        }
                                    }}
                                    aria-describedby={errors.password ? 'admin-password-error' : undefined}
                                    className="pl-10 text-xs sm:text-sm rounded-xl"
                                />
                            </div>
                            <InputError id="admin-password-error" message={errors.password} />
                        </div>

                        {/* Handover Checkbox Confirmation */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                    id="confirm_handover"
                                    checked={confirmHandover}
                                    onCheckedChange={(c) => {
                                        const checked = Boolean(c);
                                        setConfirmHandover(checked);
                                        if (checked && errors.confirmHandover) {
                                            setErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.confirmHandover;
                                                return next;
                                            });
                                        }
                                    }}
                                    className="mt-0.5 h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-[#23509A] data-[state=checked]:border-[#23509A]"
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                                    I understand and confirm that creating this new administrator account will grant them immediate full access and schedule my current admin account to expire in <span className="font-bold">3 days (72 hours)</span>. <span className="text-red-500 font-bold">*</span>
                                </span>
                            </label>
                            <InputError id="confirm-handover-error" message={errors.confirmHandover} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="rounded-xl text-xs font-semibold px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-xl bg-[#23509A] px-5 text-xs font-bold text-white shadow-md hover:bg-[#000D6A] transition-all"
                        >
                            {isSubmitting ? 'Creating Admin...' : 'Create Admin & Start 3-Day Handover'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
