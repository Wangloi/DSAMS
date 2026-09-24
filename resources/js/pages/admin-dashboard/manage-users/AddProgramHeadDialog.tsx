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
    BookOpen,
    Briefcase,
    Building2,
    Check,
    CheckCircle2,
    Copy,
    Eye,
    EyeOff,
    GraduationCap,
    Info,
    KeyRound,
    Laptop,
    Lock,
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
        gradient: 'from-[#800000] to-[#500000]',
        accent: 'bg-[#800000]/10 text-[#800000] border-[#800000]/25 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
    },
    {
        code: 'BSBA',
        name: 'Business Administration',
        department: 'College of Business & Accountancy',
        icon: Briefcase,
        gradient: 'from-yellow-500 to-amber-600',
        accent: 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-700/50',
    },
    {
        code: 'BEED',
        name: 'Elementary Education',
        department: 'College of Teacher Education',
        icon: BookOpen,
        gradient: 'from-blue-600 to-indigo-600',
        accent: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
    },
    {
        code: 'BSED',
        name: 'Secondary Education',
        department: 'College of Teacher Education',
        icon: GraduationCap,
        gradient: 'from-blue-600 to-indigo-600',
        accent: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
    },
    {
        code: 'BSCrim',
        name: 'Criminology',
        department: 'College of Criminal Justice Education',
        icon: Scale,
        gradient: 'from-blue-700 to-indigo-900',
        accent: 'bg-blue-100 text-[#1e40af] border-[#3b82f6]/30 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700/50',
    },
    {
        code: 'BSHM',
        name: 'Hospitality Management',
        department: 'College of Hospitality & Tourism',
        icon: Utensils,
        gradient: 'from-emerald-600 to-green-600',
        accent: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    },
];

const HONORIFICS = ['Dr.', 'Prof.', 'Dean', 'Engr.', 'Atty.', 'Mr.', 'Ms.'];

const ROLE_OPTIONS = [
    {
        id: 'Program Head',
        title: 'Program Head',
        badge: 'Department Lead',
        description: 'Departmental head with clearance and roster authority.',
        icon: GraduationCap,
        gradient: 'from-amber-500 to-orange-600',
        borderActive: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-400',
        iconBg: 'bg-amber-500 text-white',
    },
    {
        id: 'Instructor',
        title: 'Instructor',
        badge: 'Faculty Staff',
        description: 'Academic instructor & faculty member.',
        icon: BookOpen,
        gradient: 'from-emerald-500 to-teal-600',
        borderActive: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-400',
        iconBg: 'bg-emerald-500 text-white',
    },
    {
        id: 'Offices',
        title: 'Offices',
        badge: 'Campus Unit',
        description: 'Departmental or campus office staff & personnel.',
        icon: Building2,
        gradient: 'from-purple-500 to-indigo-600',
        borderActive: 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 dark:border-purple-400',
        iconBg: 'bg-purple-500 text-white',
    },
];

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

    // Default role fallback to Program Head if not specified
    const activeRole = form.role || 'Program Head';

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

    const activeRoleConfig =
        ROLE_OPTIONS.find((r) => r.id.toLowerCase() === activeRole.toLowerCase()) ||
        ROLE_OPTIONS[0];

    const ActiveIcon = activeRoleConfig.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[88vh] w-[95vw] sm:max-w-3xl flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl dark:bg-slate-950 [&>button]:hidden">
                {/* Hero Header with Deep Blue Gradient & Glassmorphism */}
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#0B4DFF] px-6 py-4.5 text-white shadow-md sm:px-8">
                    {/* Decorative glowing background blobs */}
                    <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />

                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-inner ring-1 ring-white/30 backdrop-blur-md">
                                <ActiveIcon className="h-6 w-6 text-[#8CE4FF] transition-all" />
                                <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#102A83]">
                                    <Sparkles className="h-2.5 w-2.5 text-white" />
                                </span>
                            </div>

                            <DialogHeader className="p-0 text-left">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DialogTitle className="text-lg font-black tracking-tight text-white sm:text-xl">
                                        {editingUser ? 'Edit Personnel' : 'Add New Personnel'}
                                    </DialogTitle>
                                    <span className="rounded-full bg-blue-400/20 px-2.5 py-0.5 text-[10px] font-bold text-[#8CE4FF] uppercase tracking-wider backdrop-blur-sm">
                                        {activeRole} Account
                                    </span>
                                </div>
                                <DialogDescription className="mt-0.5 text-xs font-medium text-blue-100/90">
                                    {editingUser
                                        ? 'Update personnel credentials, role status, and assigned academic department.'
                                        : 'Configure credentials and department affiliation for faculty, program heads, or office staff.'}
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {/* Top Close Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full bg-white/10 p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white active:scale-95"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Form Body Scrollable Area */}
                <div className="scrollbar-thin min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5 sm:px-8">
                    {/* Error Banner */}
                    {hasAnyError && (
                        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-black text-white">
                                !
                            </span>
                            <span>Please review and complete the highlighted required fields below.</span>
                        </div>
                    )}

                    {/* Section 1: Interactive Role Selection Cards */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                <Shield className="h-3.5 w-3.5 text-[#23509A] dark:text-[#8CE4FF]" />
                                <span>1. Select Personnel Role *</span>
                            </Label>
                            <span className="text-xs font-semibold text-[#23509A] dark:text-[#8CE4FF]">
                                Role: {activeRole}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                            {ROLE_OPTIONS.map((opt) => {
                                const isSelected =
                                    activeRole.toLowerCase() === opt.id.toLowerCase();
                                const OptIcon = opt.icon;

                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                role: opt.id,
                                            }))
                                        }
                                        className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                                            isSelected
                                                ? `${opt.borderActive} shadow-md ring-2 ring-[#23509A]/30 dark:ring-blue-400/30`
                                                : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900'
                                        }`}
                                    >
                                        <div className="flex w-full items-center justify-between gap-2">
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                                                    isSelected
                                                        ? opt.iconBg
                                                        : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                <OptIcon className="h-4 w-4" />
                                            </div>

                                            {isSelected ? (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#23509A] text-white shadow dark:bg-[#0B4DFF]">
                                                    <Check className="h-3 w-3" />
                                                </span>
                                            ) : (
                                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
                                                    {opt.badge}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-2.5 space-y-0.5">
                                            <div className="text-xs font-black text-slate-900 dark:text-white">
                                                {opt.title}
                                            </div>
                                            <div className="line-clamp-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                {opt.description}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={(errors as any).role} />
                    </div>

                    {/* Section 2: Department / Academic Program Assignment */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                <Building2 className="h-3.5 w-3.5 text-[#23509A] dark:text-[#8CE4FF]" />
                                <span>2. Assigned Department or Program *</span>
                            </Label>
                            {selectedProgram && (
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
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

                    {/* Section 3: Personnel Profile & Contact Information */}
                    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4.5 dark:border-slate-800 dark:bg-slate-900/40 sm:p-5">
                        <Label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                            <User className="h-3.5 w-3.5 text-[#23509A] dark:text-[#8CE4FF]" />
                            <span>3. Personal Profile & Credentials</span>
                        </Label>

                        {/* Full Name with Honorific Quick Buttons */}
                        <div className="grid gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                                <Label
                                    htmlFor="ph_name"
                                    className="text-xs font-semibold text-slate-600 dark:text-slate-400"
                                >
                                    Full Name & Title *
                                </Label>
                                <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-[10px] text-slate-400 mr-0.5">Quick prefix:</span>
                                    {HONORIFICS.map((h) => (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => handleHonorificClick(h)}
                                            className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
                                        {copiedPassword ? 'Copied to Clipboard!' : 'Auto-Generate'}
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

                    {/* Section 4: Dynamic Role Authority & Capability Information Card */}
                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-4 shadow-xs dark:border-blue-900/30 dark:bg-gradient-to-br dark:from-blue-950/30 dark:to-indigo-950/20">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#23509A] text-white shadow-sm dark:bg-[#0B4DFF]">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <div className="font-bold text-slate-900 dark:text-white">
                                    {activeRole} Capabilities & Privileges
                                </div>
                                <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                                    {activeRole === 'Program Head' && (
                                        <>
                                            Once activated, this personnel can log into the <strong>Personnel Portal</strong> to oversee student rosters, review and approve academic clearances, manage violations, and verify departmental attendance for the <strong>{form.program || 'selected program'}</strong> department.
                                        </>
                                    )}
                                    {activeRole === 'Instructor' && (
                                        <>
                                            Instructors have access to monitor class attendance logs, view student profile rosters, and record or flag session attendance for students under the <strong>{form.program || 'selected program'}</strong> department.
                                        </>
                                    )}
                                    {activeRole === 'Offices' && (
                                        <>
                                            Office personnel can sign off on institutional requirements, issue and verify student service clearances, and process official campus requirements for <strong>{form.program || 'the assigned unit'}</strong>.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dialog Footer Actions */}
                <DialogFooter className="shrink-0 flex items-center justify-between border-t border-slate-100 bg-slate-50/90 px-6 py-3.5 dark:border-slate-800/80 dark:bg-slate-900/90 sm:px-8">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Secure Institutional Authentication</span>
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
                            {editingUser ? 'Save Personnel Changes' : 'Create Personnel Account'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

