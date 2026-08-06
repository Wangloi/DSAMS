import { Check, Hash, IdCard, KeyRound, Shield, User, UserPlus, Users, X } from 'lucide-react';
import QRCode from 'qrcode';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { UserForm, UserRow } from './types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingUser: UserRow | null;
    hasAnyError: boolean;
    errors: Record<string, string>;
    form: UserForm;
    setForm: React.Dispatch<React.SetStateAction<UserForm>>;
    onOpenCreate: () => void;
    onClose: () => void;
    onSubmit: (qrCodeDataUrl?: string | null) => void;
    onOpenBulkAdd?: () => void;
};

export default function AddEditUserDialog({
    open,
    onOpenChange,
    editingUser,
    hasAnyError,
    errors,
    form,
    setForm,
    onOpenCreate,
    onClose,
    onSubmit,
    onOpenBulkAdd,
}: Props) {
    const isEditingProgramHead = String((editingUser as any)?.userType ?? '').toLowerCase() === 'program_head';
    const qrText = useMemo(() => form.student_id?.trim() ?? '', [form.student_id]);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!qrText || isEditingProgramHead) {
                setQrDataUrl(null);
                return;
            }

            try {
                const url = await QRCode.toDataURL(qrText, {
                    margin: 1,
                    width: 256,
                    errorCorrectionLevel: 'M',
                });
                if (!cancelled) setQrDataUrl(url);
            } catch {
                if (!cancelled) setQrDataUrl(null);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [qrText]);

    return (
        <>
            {/* Trigger Button */}
            <Button
                className="h-11 gap-2 rounded-xl bg-white px-5 font-bold text-[#1e3a8a] shadow-md transition-all duration-200 hover:bg-blue-50 hover:shadow-lg"
                type="button"
                onClick={onOpenCreate}
            >
                <UserPlus className="h-5 w-5" />
                Add User
            </Button>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-4xl overflow-hidden p-0 bg-white dark:bg-slate-900 rounded-2xl border-0 shadow-2xl [&>button]:hidden">
                    {/* Hero Gradient Header */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 py-6 text-white shadow-md">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
                        <div className="relative z-10 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-inner">
                                    <UserPlus className="h-6 w-6 text-white" />
                                </div>
                                <DialogHeader className="p-0 text-left">
                                    <DialogTitle className="text-xl font-black tracking-tight text-white">
                                        {editingUser
                                            ? isEditingProgramHead
                                                ? 'Edit Program Head User'
                                                : 'Edit Student User'
                                            : 'Add User Account'}
                                    </DialogTitle>
                                    <DialogDescription className="mt-0.5 text-xs font-medium text-blue-100/80">
                                        {editingUser
                                            ? isEditingProgramHead
                                                ? 'Update program head credentials and assigned details.'
                                                : 'Modify student profile information and assigned roles.'
                                            : 'Fill out the form below to register a new user in the system.'}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            {onOpenBulkAdd && !editingUser && (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenBulkAdd();
                                    }}
                                    className="shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-2 px-4 py-2 shadow-md shadow-emerald-900/30 border border-emerald-400/30 transition-all hover:scale-[1.02]"
                                >
                                    <Users className="h-4 w-4" />
                                    Bulk Import CSV
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Dialog Form Scroll Area */}
                    <div className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-6 scrollbar-thin">
                        {hasAnyError && (
                            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-700 shadow-sm dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-black">!</span>
                                Please review and fix the highlighted fields below.
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            {/* Main Input Form Column */}
                            <div className={isEditingProgramHead ? 'grid gap-4 lg:col-span-12 sm:grid-cols-2' : 'grid gap-4.5 lg:col-span-8 sm:grid-cols-2'}>
                                {isEditingProgramHead ? (
                                    <>
                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Full Name
                                            </Label>
                                            <div className="relative">
                                                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    id="name"
                                                    placeholder="e.g. Dr. Maria Santos"
                                                    value={String(form.name ?? '')}
                                                    onChange={(e) =>
                                                        setForm((p) => ({
                                                            ...p,
                                                            name: e.target.value,
                                                        }))
                                                    }
                                                    className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pl-10 text-sm font-medium focus:bg-white dark:focus:bg-slate-800"
                                                />
                                            </div>
                                            <InputError message={(errors as any).name} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="e.g. msantos@srcb.edu.ph"
                                                value={form.email}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        email: e.target.value,
                                                    }))
                                                }
                                                className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm font-medium focus:bg-white dark:focus:bg-slate-800"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="program" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Assigned Program
                                            </Label>
                                            <Input
                                                id="program"
                                                placeholder="e.g. BSIT"
                                                value={String(form.program ?? '')}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        program: e.target.value,
                                                    }))
                                                }
                                                className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm font-medium focus:bg-white dark:focus:bg-slate-800"
                                            />
                                            <InputError message={(errors as any).program} />
                                        </div>

                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Password
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Leave blank to keep current password"
                                                value={form.password}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        password: e.target.value,
                                                    }))
                                                }
                                                className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm font-medium focus:bg-white dark:focus:bg-slate-800"
                                            />
                                            <InputError message={errors.password} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Student ID */}
                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <Label htmlFor="student_id" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Student ID Number
                                            </Label>
                                            <div className="relative">
                                                <IdCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    id="student_id"
                                                    placeholder="e.g. 230123"
                                                    value={form.student_id}
                                                    onChange={(e) =>
                                                        setForm((p) => ({
                                                            ...p,
                                                            student_id: e.target.value,
                                                        }))
                                                    }
                                                    className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pl-10 text-sm font-semibold tracking-wide text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                                                />
                                            </div>
                                            <InputError message={errors.student_id} />
                                        </div>

                                        {/* Firstname */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="first_name" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                First Name
                                            </Label>
                                            <Input
                                                id="first_name"
                                                placeholder="e.g. Juan"
                                                value={form.first_name}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        first_name: e.target.value,
                                                    }))
                                                }
                                                className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm font-medium focus:bg-white dark:focus:bg-slate-800"
                                            />
                                            <InputError message={errors.first_name} />
                                        </div>

                                        {/* Lastname */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="last_name" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Last Name
                                            </Label>
                                            <Input
                                                id="last_name"
                                                placeholder="e.g. Dela Cruz"
                                                value={form.last_name}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        last_name: e.target.value,
                                                    }))
                                                }
                                                className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm font-medium focus:bg-white dark:focus:bg-slate-800"
                                            />
                                            <InputError message={errors.last_name} />
                                        </div>

                                        {/* Grade / Year Level */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="year_level" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Year Level
                                            </Label>
                                            <Select
                                                value={form.year_level}
                                                onValueChange={(val) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        year_level: val,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger id="year_level" className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm font-medium">
                                                    <SelectValue placeholder="Select year level" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="1st Year">1st Year</SelectItem>
                                                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                                                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                                                    <SelectItem value="4th Year">4th Year</SelectItem>
                                                    <SelectItem value="Irregular">Irregular</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.year_level} />
                                        </div>

                                        {/* Section / Course */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="course" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Section / Course
                                            </Label>
                                            <Select
                                                value={form.course}
                                                onValueChange={(value) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        course: value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger id="course" className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm font-medium">
                                                    <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="BSIT">BSIT</SelectItem>
                                                    <SelectItem value="BSBA">BSBA</SelectItem>
                                                    <SelectItem value="BEED">BEED</SelectItem>
                                                    <SelectItem value="BSED">BSED</SelectItem>
                                                    <SelectItem value="BSCrim">BSCrim</SelectItem>
                                                    <SelectItem value="BSHM">BSHM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.course} />
                                        </div>

                                        {/* Default Password Info */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Default Password
                                            </Label>
                                            <div className="relative">
                                                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    id="password"
                                                    type="text"
                                                    readOnly
                                                    value={form.password || 'password123'}
                                                    className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 pl-10 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        {/* User Role */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Account Role
                                            </Label>
                                            <Select
                                                value={form.role}
                                                onValueChange={(value) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        role: value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger id="role" className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm font-medium">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="Student">Student</SelectItem>
                                                    <SelectItem value="President">President</SelectItem>
                                                    <SelectItem value="Vice President">Vice President</SelectItem>
                                                    <SelectItem value="Secretary">Secretary</SelectItem>
                                                    <SelectItem value="Finance Officer">Finance Officer</SelectItem>
                                                    <SelectItem value="Auditor">Auditor</SelectItem>
                                                    <SelectItem value="PIO">PIO</SelectItem>
                                                    <SelectItem value="1st Year Representative">1st Year Representative</SelectItem>
                                                    <SelectItem value="2nd Year Representative">2nd Year Representative</SelectItem>
                                                    <SelectItem value="3rd Year Representative">3rd Year Representative</SelectItem>
                                                    <SelectItem value="4th Year Representative">4th Year Representative</SelectItem>
                                                    <SelectItem value="Program Head">Program Head</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.role} />
                                        </div>

                                        {/* Officer Features Checkbox Grid */}
                                        {['President', 'Vice President', 'Secretary', 'Finance Officer', 'Auditor', 'PIO', '1st Year Representative', '2nd Year Representative', '3rd Year Representative', '4th Year Representative'].includes(form.role) && (
                                            <div className="grid gap-2 sm:col-span-2 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                        Officer Access Privileges
                                                    </Label>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                                                    {[
                                                        { id: 'manage_users', label: 'Manage Users' },
                                                        { id: 'events', label: 'Events' },
                                                        { id: 'attendance', label: 'Attendance' },
                                                        { id: 'reports', label: 'Reports' },
                                                        { id: 'lost_found', label: 'Lost and Found' },
                                                        { id: 'incidents', label: 'Incidents/Violations' },
                                                        { id: 'announcements', label: 'Announcements' },
                                                    ].map((feature) => {
                                                        const isChecked = (form.officer_features ?? []).includes(feature.id);
                                                        return (
                                                            <div
                                                                key={feature.id}
                                                                onClick={() => {
                                                                    setForm((p) => {
                                                                        const current = p.officer_features ?? [];
                                                                        return {
                                                                            ...p,
                                                                            officer_features: !isChecked
                                                                                ? [...current, feature.id]
                                                                                : current.filter((f) => f !== feature.id),
                                                                        };
                                                                    });
                                                                }}
                                                                className={`flex items-center space-x-2.5 rounded-xl border p-2.5 transition-all cursor-pointer ${
                                                                    isChecked
                                                                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-200 font-semibold'
                                                                        : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                                                }`}
                                                            >
                                                                <Checkbox
                                                                    id={`feature-${feature.id}`}
                                                                    checked={isChecked}
                                                                    onCheckedChange={() => {}}
                                                                    className="rounded-md"
                                                                />
                                                                <span className="text-xs font-medium leading-none">
                                                                    {feature.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* QR Code Live Preview Sidebar */}
                            {!isEditingProgramHead && (
                                <div className="lg:col-span-4">
                                    <div className="sticky top-0 space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-slate-700/60">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                QR Code Preview
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Live
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-center py-2">
                                            {qrDataUrl ? (
                                                <div className="w-full max-w-[200px] overflow-hidden rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-200 dark:bg-white dark:ring-slate-700 transition-all transform hover:scale-105">
                                                    <img src={qrDataUrl} alt="Student ID QR" className="h-auto w-full rounded-lg" />
                                                </div>
                                            ) : (
                                                <div className="flex h-[200px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-4 text-center dark:border-slate-700 dark:bg-slate-800/50">
                                                    <Hash className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        Type Student ID to generate live QR Code
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {qrText ? (
                                            <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 shadow-xs border border-slate-200/80 dark:bg-slate-800 dark:border-slate-700">
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ID Payload</span>
                                                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{qrText}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dialog Footer Actions */}
                    <DialogFooter className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-4 flex items-center justify-end gap-3">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 px-5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="rounded-xl bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 font-bold text-white shadow-md transition-all hover:brightness-110 hover:shadow-lg"
                            onClick={() => onSubmit(qrDataUrl)}
                        >
                            {editingUser ? 'Update Account' : 'Create User Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}