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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};

        if (!name.trim()) errs.name = 'Full name is required.';
        if (!email.trim()) errs.email = 'Email is required.';
        if (!password || password.length < 8)
            errs.password = 'Password must be at least 8 characters long.';
        if (!confirmHandover)
            errs.confirmHandover =
                'You must acknowledge the 3-day handover transition period.';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
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
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl sm:max-w-2xl dark:bg-slate-900 [&>button]:hidden">
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#23509A] px-6 py-6 text-white shadow-md">
                    <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-[#8CE4FF]/10 blur-2xl" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md shrink-0">
                            <Shield className="h-6 w-6 text-[#8CE4FF]" />
                        </div>
                        <DialogHeader className="p-0 text-left">
                            <DialogTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
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
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
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
                                className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                            >
                                New Admin Full Name *
                            </Label>
                            <div className="relative">
                                <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="new_admin_name"
                                    placeholder="e.g. Dr. Maria Santos (New Dean of Student Affairs)"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 text-xs sm:text-sm rounded-xl"
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        {/* Email */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="new_admin_email"
                                className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                            >
                                Institutional Email Address *
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="new_admin_email"
                                    type="email"
                                    placeholder="e.g. heddsa@srcb.edu.ph"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 text-xs sm:text-sm rounded-xl"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Password */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="new_admin_password"
                                className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                            >
                                Initial Secure Password * (Min. 8 characters)
                            </Label>
                            <div className="relative">
                                <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="new_admin_password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 text-xs sm:text-sm rounded-xl"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Handover Checkbox Confirmation */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                    id="confirm_handover"
                                    checked={confirmHandover}
                                    onCheckedChange={(c) =>
                                        setConfirmHandover(Boolean(c))
                                    }
                                    className="mt-0.5 h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-[#23509A] data-[state=checked]:border-[#23509A]"
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                                    I understand and confirm that creating this new administrator account will grant them immediate full access and schedule my current admin account to expire in <span className="font-bold">3 days (72 hours)</span>.
                                </span>
                            </label>
                            <InputError message={errors.confirmHandover} />
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
