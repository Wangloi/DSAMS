import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Check,
    CheckCircle2,
    ClipboardList,
    HeartHandshake,
    Loader2,
    MapPin,
    Phone,
    User,
    UserPlus,
} from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    isOpen: boolean;
    /** Called once the student successfully saves both steps */
    onComplete: () => void;
}

const STEPS = [
    { label: 'Personal Info', description: 'Basic details & contact', icon: ClipboardList },
    { label: 'Emergency Contact', description: 'In case of emergency', icon: HeartHandshake },
];

type FormData = {
    // Personal (Required)
    home_address: string;
    birthday: string;
    gender: string;
    contact_no: string;
    // Family / Emergency Contact (Required)
    guardian_name: string;
    guardian_relation: string;
    guardian_contact: string;
};

const initial: FormData = {
    home_address: '',
    birthday: '',
    gender: '',
    contact_no: '',
    guardian_name: '',
    guardian_relation: '',
    guardian_contact: '',
};

export default function StudentProfileCompletionModal({ isOpen, onComplete }: Props) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>(initial);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const totalSteps = 2;

    const set = (key: keyof FormData, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const validateStep = (): boolean => {
        const e: Record<string, string[]> = {};

        if (step === 1) {
            if (!form.home_address.trim()) e.home_address = ['Home address is required.'];
            if (!form.birthday)            e.birthday     = ['Birthday is required.'];
            if (!form.gender)              e.gender       = ['Please select a gender.'];
            if (!form.contact_no.trim())   e.contact_no   = ['Contact number is required.'];
        } else if (step === 2) {
            if (!form.guardian_name.trim())     e.guardian_name     = ['Emergency contact name is required.'];
            if (!form.guardian_relation.trim()) e.guardian_relation = ['Relationship is required.'];
            if (!form.guardian_contact.trim())  e.guardian_contact  = ['Emergency contact number is required.'];
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (step < totalSteps) {
            setStep(s => s + 1);
            setErrors({});
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(s => s - 1);
            setErrors({});
        }
    };

    const handleSubmit = () => {
        if (!validateStep()) return;
        setLoading(true);
        setErrors({});

        axios.post('/student/complete-profile', form)
            .then(res => {
                if (res.data.success) {
                    onComplete();
                } else if (res.data.errors) {
                    setErrors(res.data.errors);
                    const personalFields = ['home_address', 'birthday', 'gender', 'contact_no'];
                    const errKeys = Object.keys(res.data.errors);
                    if (errKeys.some(k => personalFields.includes(k))) setStep(1);
                } else {
                    alert(res.data.error || 'Failed to save profile. Please try again.');
                }
            })
            .catch(err => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                } else {
                    alert(err.response?.data?.error || 'An error occurred. Please try again.');
                }
            })
            .finally(() => setLoading(false));
    };

    if (!isOpen) return null;

    const progressPercentage = Math.round((step / totalSteps) * 100);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border-0 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

                {/* Hero Gradient Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 py-6 text-white shadow-md shrink-0">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-inner">
                                <UserPlus className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-white animate-pulse">
                                    Complete Your Profile
                                </h2>
                                <p className="mt-0.5 text-xs font-medium text-blue-100/80">
                                    Fill out the essential information below to activate your student account.
                                </p>
                            </div>
                        </div>

                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-blue-200/80 tracking-wider">Completion</span>
                            <span className="text-lg font-black text-white">{progressPercentage}%</span>
                        </div>
                    </div>

                    {/* Step progress pills */}
                    <div className="grid grid-cols-2 gap-2.5 mt-5 pt-3 border-t border-white/10">
                        {STEPS.map((s, i) => {
                            const num = i + 1;
                            const isDone = num < step;
                            const isActive = num === step;
                            const Icon = s.icon;

                            return (
                                <div
                                    key={s.label}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                                        isActive
                                            ? 'bg-white text-[#1e3a8a] shadow-md font-bold'
                                            : isDone
                                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                                            : 'bg-white/10 text-blue-100/60'
                                    }`}
                                >
                                    <div
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                            isActive
                                                ? 'bg-[#1e3a8a] text-white'
                                                : isDone
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-white/20 text-white'
                                        }`}
                                    >
                                        {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : num}
                                    </div>
                                    <div className="hidden sm:block min-w-0">
                                        <p className="text-xs font-bold truncate">
                                            {s.label}
                                        </p>
                                    </div>
                                    <span className="sm:hidden text-xs font-semibold truncate">
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-h-[60vh] scrollbar-thin">
                    {Object.keys(errors).length > 0 && (
                        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-700 shadow-sm dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-black">!</span>
                            Please review and fill in all required fields.
                        </div>
                    )}

                    {/* ── STEP 1: Personal Info ── */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                <ClipboardList className="h-4 w-4 text-[#1e3a8a] dark:text-blue-400" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Step 1: Personal Details
                                </h3>
                            </div>

                            {/* Home Address */}
                            <div className="grid gap-1.5">
                                <Label htmlFor="pc-home_address" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Home Address <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                                    <textarea
                                        id="pc-home_address"
                                        value={form.home_address}
                                        onChange={e => set('home_address', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 pl-10 pt-2.5 pr-3 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                        placeholder="Street, Barangay, City / Municipality, Province"
                                    />
                                </div>
                                <InputError message={errors.home_address?.[0]} />
                            </div>

                            {/* Birthday */}
                            <div className="grid gap-1.5">
                                <Label htmlFor="pc-birthday" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Birthday <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="pc-birthday"
                                        type="date"
                                        value={form.birthday}
                                        onChange={e => set('birthday', e.target.value)}
                                        className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pl-10 text-sm font-medium focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <InputError message={errors.birthday?.[0]} />
                            </div>

                            {/* Contact Number & Gender Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="pc-contact_no" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Mobile Contact Number <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="pc-contact_no"
                                            type="tel"
                                            value={form.contact_no}
                                            onChange={e => set('contact_no', e.target.value)}
                                            className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pl-10 text-sm font-medium focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="e.g., 09123456789"
                                        />
                                    </div>
                                    <InputError message={errors.contact_no?.[0]} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Gender <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Male', 'Female'].map((g) => {
                                            const selected = form.gender === g;
                                            return (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => set('gender', g)}
                                                    className={`flex items-center justify-center gap-2 h-10 rounded-xl border text-xs font-bold transition-all ${
                                                        selected
                                                            ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm'
                                                            : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    <User className={`h-4 w-4 ${selected ? 'text-white' : 'text-slate-400'}`} />
                                                    {g}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.gender?.[0]} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Emergency Contacts ── */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                <HeartHandshake className="h-4 w-4 text-[#1e3a8a] dark:text-blue-400" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Step 2: Emergency Contact Information
                                </h3>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="pc-guardian_name" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Contact Person Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pc-guardian_name"
                                        type="text"
                                        value={form.guardian_name}
                                        onChange={e => set('guardian_name', e.target.value)}
                                        className="h-10 rounded-xl bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                                        placeholder="Full name of parent, guardian, or spouse"
                                    />
                                    <InputError message={errors.guardian_name?.[0]} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pc-guardian_relation" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Relationship <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="pc-guardian_relation"
                                            type="text"
                                            value={form.guardian_relation}
                                            onChange={e => set('guardian_relation', e.target.value)}
                                            className="h-10 rounded-xl bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                                            placeholder="e.g., Mother, Father, Uncle"
                                        />
                                        <InputError message={errors.guardian_relation?.[0]} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="pc-guardian_contact" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Contact Number <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="pc-guardian_contact"
                                                type="tel"
                                                value={form.guardian_contact}
                                                onChange={e => set('guardian_contact', e.target.value)}
                                                className="h-10 rounded-xl bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 pl-10 text-sm font-medium text-slate-900 dark:text-white"
                                                placeholder="e.g., 09123456789"
                                            />
                                        </div>
                                        <InputError message={errors.guardian_contact?.[0]} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dialog Footer Actions */}
                <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
                    <div>
                        {step > 1 && (
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={handleBack}
                                disabled={loading}
                                className="rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 px-5 h-10"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1.5" />
                                Back
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Step {step} of {totalSteps}
                        </span>

                        {step < totalSteps ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={loading}
                                className="rounded-xl bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 font-bold text-white shadow-md transition-all hover:brightness-110 hover:shadow-lg h-10"
                            >
                                Next Step
                                <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 font-bold text-white shadow-md transition-all hover:brightness-110 hover:shadow-lg h-10 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving Details...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                        Complete Profile
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
