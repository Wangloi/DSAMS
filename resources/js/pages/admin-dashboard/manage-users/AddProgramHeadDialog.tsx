import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import {
    BookOpen,
    Briefcase,
    Building2,
    Check,
    CheckCircle2,
    Copy,
    Eye,
    EyeOff,
    GraduationCap,
    KeyRound,
    Laptop,
    Mail,
    Scale,
    Shield,
    ShieldCheck,
    Sparkles,
    User,
    UserCheck,
    Utensils,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { ProgramRow, UserForm, UserRow } from './types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingUser: UserRow | null;
    hasAnyError: boolean;
    errors: Record<string, string>;
    form: UserForm;
    setForm: React.Dispatch<React.SetStateAction<UserForm>>;
    onClose: () => void;
    onSubmit: () => void;
    programs?: ProgramRow[];
};

interface DefaultProgramInfo {
    code: string;
    name: string;
    department: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    accent: string;
}

const DEFAULT_PROGRAM_CARDS: DefaultProgramInfo[] = [
    {
        code: 'BSIT',
        name: 'Information Technology',
        department: 'College of Computer Studies',
        icon: Laptop,
        gradient: 'from-blue-600 to-indigo-600',
        accent: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    },
    {
        code: 'BSBA',
        name: 'Business Administration',
        department: 'College of Business & Accountancy',
        icon: Briefcase,
        gradient: 'from-amber-600 to-orange-600',
        accent: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
    {
        code: 'BEED',
        name: 'Elementary Education',
        department: 'College of Teacher Education',
        icon: BookOpen,
        gradient: 'from-emerald-600 to-teal-600',
        accent: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    },
    {
        code: 'BSED',
        name: 'Secondary Education',
        department: 'College of Teacher Education',
        icon: GraduationCap,
        gradient: 'from-purple-600 to-pink-600',
        accent: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    },
    {
        code: 'BSCrim',
        name: 'Criminology',
        department: 'College of Criminal Justice Education',
        icon: Scale,
        gradient: 'from-red-600 to-rose-600',
        accent: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    },
    {
        code: 'BSHM',
        name: 'Hospitality Management',
        department: 'College of Hospitality & Tourism',
        icon: Utensils,
        gradient: 'from-cyan-600 to-blue-600',
        accent: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    },
];

const HONORIFICS = ['Dr.', 'Prof.', 'Dean', 'Engr.', 'Mr.', 'Ms.'];

export default function AddProgramHeadDialog({
    open,
    onOpenChange,
    editingUser,
    hasAnyError,
    errors,
    form,
    setForm,
    onClose,
    onSubmit,
    programs = [],
}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // Merge system programs with default cards
    const programCards = useMemo(() => {
        if (!programs || programs.length === 0) {
            return DEFAULT_PROGRAM_CARDS;
        }

        const map = new Map<string, DefaultProgramInfo>();
        DEFAULT_PROGRAM_CARDS.forEach((card) => map.set(card.code.toUpperCase(), card));

        // Add any additional dynamic programs from DB
        programs.forEach((prog) => {
            const code = prog.code.toUpperCase();
            if (!map.has(code)) {
                map.set(code, {
                    code: prog.code,
                    name: prog.name,
                    department: prog.department || 'Academic Department',
                    icon: Building2,
                    gradient: 'from-indigo-600 to-violet-600',
                    accent: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
                });
            }
        });

        return Array.from(map.values());
    }, [programs]);

    const handleGeneratePassword = () => {
        const charset = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
        let generated = '';
        for (let i = 0; i < 10; i++) {
            generated += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setForm((prev) => ({ ...prev, password: generated }));
        setShowPassword(true);
        navigator.clipboard.writeText(generated);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2500);
    };

    const handleHonorificClick = (prefix: string) => {
        const currentName = String(form.name ?? '').trim();
        // Remove existing prefix if any
        let cleanName = currentName;
        for (const h of HONORIFICS) {
            if (cleanName.startsWith(h)) {
                cleanName = cleanName.slice(h.length).trim();
                break;
            }
        }
        setForm((prev) => ({
            ...prev,
            name: `${prefix} ${cleanName}`.trim(),
        }));
    };

    const selectedProgram = programCards.find(
        (p) => p.code.toUpperCase() === String(form.program || '').toUpperCase(),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl sm:max-w-3xl dark:bg-slate-950 [&>button]:hidden">
                {/* Hero Header with Deep Blue Gradient & Glassmorphism */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#0B4DFF] px-6 py-6 text-white shadow-lg sm:px-8">
                    {/* Decorative glowing blobs */}
                    <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />

                    <div className="relative z-10 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-inner ring-1 ring-white/30 backdrop-blur-md">
                                <GraduationCap className="h-7 w-7 text-[#8CE4FF]" />
                                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#102A83]">
                                    <Sparkles className="h-3 w-3 text-white" />
                                </span>
                            </div>

                            <DialogHeader className="p-0 text-left">
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                        {editingUser
                                            ? 'Edit Program Head'
                                            : 'Add Program Head'}
                                    </DialogTitle>
                                    <span className="rounded-full bg-blue-400/20 px-2.5 py-0.5 text-[11px] font-bold text-[#8CE4FF] uppercase tracking-wider backdrop-blur-sm">
                                        Department Lead
                                    </span>
                                </div>
                                <DialogDescription className="mt-1 text-xs font-medium text-blue-100/90 sm:text-sm">
                                    {editingUser
                                        ? 'Update leadership credentials and assigned academic department.'
                                        : 'Assign a designated academic program head to oversee departmental student records & clearances.'}
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {/* Top Close Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Form Body Scrollable Area */}
                <div className="scrollbar-thin max-h-[72vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    {/* Error Banner */}
                    {hasAnyError && (
                        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-black text-white">
                                !
                            </span>
                            <span>Please review and complete the highlighted required fields below.</span>
                        </div>
                    )}

                    {/* Section 1: Academic Department Assignment */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-[#23509A] dark:text-[#8CE4FF]" />
                                <span>1. Assigned Academic Program & Department *</span>
                            </Label>
                            {selectedProgram && (
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Selected: {selectedProgram.code}
                                </span>
                            )}
                        </div>

                        {/* Visual Program Selector Grid */}
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                            {programCards.map((card) => {
                                const isSelected =
                                    String(form.program || '').toUpperCase() ===
                                    card.code.toUpperCase();
                                const IconComponent = card.icon;

                                return (
                                    <button
                                        key={card.code}
                                        type="button"
                                        onClick={() =>
                                            setForm((p) => ({
                                                ...p,
                                                program: card.code,
                                            }))
                                        }
                                        className={`group relative flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                                            isSelected
                                                ? 'border-[#23509A] bg-blue-50/70 shadow-md ring-2 ring-[#23509A]/30 dark:border-[#8CE4FF] dark:bg-blue-950/40 dark:ring-[#8CE4FF]/30'
                                                : 'border-slate-200/90 bg-slate-50/50 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900'
                                        }`}
                                    >
                                        <div className="flex w-full items-center justify-between gap-2">
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                                                    isSelected
                                                        ? 'bg-gradient-to-br from-[#000D6A] to-[#0B4DFF] text-white shadow-sm'
                                                        : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                <IconComponent className="h-4 w-4" />
                                            </div>

                                            {isSelected && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#23509A] text-white shadow dark:bg-[#0B4DFF]">
                                                    <Check className="h-3 w-3" />
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-2.5 space-y-0.5">
                                            <div className="text-xs font-black text-slate-900 dark:text-white">
                                                {card.code}
                                            </div>
                                            <div className="line-clamp-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                {card.name}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={(errors as any).program} />
                    </div>

                    {/* Section 2: Personal Profile & Contact */}
                    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4.5 dark:border-slate-800 dark:bg-slate-900/40 sm:p-5">
                        <Label className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-[#23509A] dark:text-[#8CE4FF]" />
                            <span>2. Leadership Profile & Credentials</span>
                        </Label>

                        {/* Full Name with Honorific Quick Buttons */}
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="ph_name"
                                    className="text-xs font-semibold text-slate-600 dark:text-slate-400"
                                >
                                    Full Name & Title *
                                </Label>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400 mr-1">Quick title:</span>
                                    {HONORIFICS.slice(0, 4).map((h) => (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => handleHonorificClick(h)}
                                            className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="ph_name"
                                    placeholder="e.g. Dr. Maria Clara Santos"
                                    value={String(form.name ?? '')}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            name: e.target.value,
                                        }))
                                    }
                                    className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm font-medium shadow-xs focus:border-[#23509A] focus:ring-2 focus:ring-[#23509A]/20 dark:border-slate-700 dark:bg-slate-900"
                                />
                            </div>
                            <InputError message={(errors as any).name} />
                        </div>

                        {/* Email Address & Password row */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Institutional Email */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="ph_email"
                                    className="text-xs font-semibold text-slate-600 dark:text-slate-400"
                                >
                                    Institutional Email Address *
                                </Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="ph_email"
                                        type="email"
                                        placeholder="e.g. msantos@srcb.edu.ph"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                email: e.target.value,
                                            }))
                                        }
                                        className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm font-medium shadow-xs focus:border-[#23509A] focus:ring-2 focus:ring-[#23509A]/20 dark:border-slate-700 dark:bg-slate-900"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            {/* Password with Show/Hide & Auto-generate */}
                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="ph_password"
                                        className="text-xs font-semibold text-slate-600 dark:text-slate-400"
                                    >
                                        Password {editingUser ? '(Optional)' : '*'}
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={handleGeneratePassword}
                                        className="flex items-center gap-1 text-[11px] font-semibold text-[#23509A] hover:underline dark:text-[#8CE4FF]"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        {copiedPassword ? 'Copied!' : 'Auto-Generate'}
                                    </button>
                                </div>
                                <div className="relative">
                                    <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="ph_password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={
                                            editingUser
                                                ? 'Leave blank to keep password'
                                                : 'Min. 8 characters'
                                        }
                                        value={form.password}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                password: e.target.value,
                                            }))
                                        }
                                        className="h-11 rounded-xl border-slate-200 bg-white pr-10 pl-10 text-sm font-medium shadow-xs focus:border-[#23509A] focus:ring-2 focus:ring-[#23509A]/20 dark:border-slate-700 dark:bg-slate-900"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Program Head Role Authority Information Card */}
                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-4 shadow-xs dark:border-blue-900/30 dark:bg-gradient-to-br dark:from-blue-950/30 dark:to-indigo-950/20">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#23509A] text-white shadow-sm dark:bg-[#0B4DFF]">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <div className="font-bold text-slate-900 dark:text-white">
                                    Program Head Capabilities & Privileges
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
                                    Once created, this user can log into the <strong>Program Head Portal</strong> with their assigned credentials. They will have direct authority to manage student rosters, endorse and clear course violations, and monitor event attendance for the <strong>{form.program || 'selected program'}</strong> department.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dialog Footer Actions */}
                <DialogFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/90 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-900/90 sm:px-8">
                    <div className="text-[11px] font-medium text-slate-400">
                        * Required departmental fields
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-xl border-slate-200 bg-white px-5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="h-10 rounded-xl bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#0B4DFF] px-6 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-98"
                            onClick={onSubmit}
                        >
                            {editingUser ? 'Update Program Head' : 'Create Program Head Account'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
