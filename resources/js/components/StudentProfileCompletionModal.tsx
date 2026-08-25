import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Check,
    CheckCircle2,
    ClipboardList,
    GraduationCap,
    HeartHandshake,
    Loader2,
    MapPin,
    Phone,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    isOpen: boolean;
    /** Called once the student successfully saves both steps */
    onComplete: () => void;
}

const STEPS = [
    {
        label: 'Personal Info',
        description: 'Basic details & contact',
        icon: ClipboardList,
    },
    {
        label: 'Academic Background',
        description: 'School history details',
        icon: GraduationCap,
    },
    {
        label: 'Family Background',
        description: 'Parents information',
        icon: Users,
    },
    {
        label: 'Emergency Contact',
        description: 'In case of emergency',
        icon: HeartHandshake,
    },
];

type FormData = {
    // Personal Info
    home_address: string;
    birthday: string;
    gender: string;
    contact_no: string;
    place_of_birth: string;
    religion: string;
    nationality: string;

    // Academic Background
    elementary_school: string;
    elementary_year_graduated: string;
    junior_high_school: string;
    junior_high_year_graduated: string;
    senior_high_school: string;
    senior_high_year_graduated: string;

    // Family Background
    mother_name: string;
    mother_contact: string;
    father_name: string;
    father_contact: string;

    // Emergency Contact
    guardian_name: string;
    guardian_relation: string;
    guardian_contact: string;
};

const initial: FormData = {
    home_address: '',
    birthday: '',
    gender: '',
    contact_no: '',
    place_of_birth: '',
    religion: '',
    nationality: '',

    elementary_school: '',
    elementary_year_graduated: '',
    junior_high_school: '',
    junior_high_year_graduated: '',
    senior_high_school: '',
    senior_high_year_graduated: '',

    mother_name: '',
    mother_contact: '',
    father_name: '',
    father_contact: '',

    guardian_name: '',
    guardian_relation: '',
    guardian_contact: '',
};

export default function StudentProfileCompletionModal({
    isOpen,
    onComplete,
}: Props) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>(initial);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const totalSteps = 4;

    const set = (key: keyof FormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const validateStep = (): boolean => {
        const e: Record<string, string[]> = {};

        if (step === 1) {
            if (!form.home_address.trim())
                e.home_address = ['Home address is required.'];
            if (!form.birthday) e.birthday = ['Birthday is required.'];
            if (!form.gender) e.gender = ['Please select a gender.'];
            if (!form.contact_no.trim())
                e.contact_no = ['Contact number is required.'];
        } else if (step === 4) {
            if (!form.guardian_name.trim())
                e.guardian_name = ['Emergency contact name is required.'];
            if (!form.guardian_relation.trim())
                e.guardian_relation = ['Relationship is required.'];
            if (!form.guardian_contact.trim())
                e.guardian_contact = ['Emergency contact number is required.'];
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (step < totalSteps) {
            setStep((s) => s + 1);
            setErrors({});
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((s) => s - 1);
            setErrors({});
        }
    };

    const handleSubmit = () => {
        if (!validateStep()) return;
        setLoading(true);
        setErrors({});

        axios
            .post('/student/complete-profile', form)
            .then((res) => {
                if (res.data.success) {
                    onComplete();
                } else if (res.data.errors) {
                    setErrors(res.data.errors);
                    const personalFields = [
                        'home_address',
                        'birthday',
                        'gender',
                        'contact_no',
                        'place_of_birth',
                        'religion',
                        'nationality',
                    ];
                    const academicFields = [
                        'elementary_school',
                        'elementary_year_graduated',
                        'junior_high_school',
                        'junior_high_year_graduated',
                        'senior_high_school',
                        'senior_high_year_graduated',
                    ];
                    const familyFields = [
                        'mother_name',
                        'mother_contact',
                        'father_name',
                        'father_contact',
                    ];
                    const errKeys = Object.keys(res.data.errors);
                    if (errKeys.some((k) => personalFields.includes(k))) {
                        setStep(1);
                    } else if (
                        errKeys.some((k) => academicFields.includes(k))
                    ) {
                        setStep(2);
                    } else if (errKeys.some((k) => familyFields.includes(k))) {
                        setStep(3);
                    } else {
                        setStep(4);
                    }
                } else {
                    alert(
                        res.data.error ||
                            'Failed to save profile. Please try again.',
                    );
                }
            })
            .catch((err) => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                } else {
                    alert(
                        err.response?.data?.error ||
                            'An error occurred. Please try again.',
                    );
                }
            })
            .finally(() => setLoading(false));
    };

    if (!isOpen) return null;

    const progressPercentage = Math.round((step / totalSteps) * 100);

    return (
        <div className="fixed inset-0 z-[100] flex animate-in items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm duration-200 fade-in">
            <div className="relative flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-2xl border-0 bg-white shadow-2xl duration-200 zoom-in-95 dark:bg-slate-900">
                {/* Hero Gradient Header */}
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 py-6 text-white shadow-md">
                    <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                                <UserPlus className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="animate-pulse text-xl font-black tracking-tight text-white">
                                    Complete Your Profile
                                </h2>
                                <p className="mt-0.5 text-xs font-medium text-blue-100/80">
                                    Fill out the essential information below to
                                    activate your student account.
                                </p>
                            </div>
                        </div>

                        <div className="hidden flex-col items-end sm:flex">
                            <span className="text-[10px] font-bold tracking-wider text-blue-200/80 uppercase">
                                Completion
                            </span>
                            <span className="text-lg font-black text-white">
                                {progressPercentage}%
                            </span>
                        </div>
                    </div>

                    {/* Step progress pills */}
                    <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-3 sm:grid-cols-4">
                        {STEPS.map((s, i) => {
                            const num = i + 1;
                            const isDone = num < step;
                            const isActive = num === step;
                            const Icon = s.icon;

                            return (
                                <div
                                    key={s.label}
                                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all ${
                                        isActive
                                            ? 'bg-white font-bold text-[#1e3a8a] shadow-md'
                                            : isDone
                                              ? 'border border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
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
                                        {isDone ? (
                                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                                        ) : (
                                            num
                                        )}
                                    </div>
                                    <div className="hidden min-w-0 sm:block">
                                        <p className="truncate text-xs font-bold">
                                            {s.label}
                                        </p>
                                    </div>
                                    <span className="truncate text-xs font-semibold sm:hidden">
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Body */}
                <div className="scrollbar-thin max-h-[60vh] flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    {Object.keys(errors).length > 0 && (
                        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-700 shadow-sm dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                                !
                            </span>
                            Please review and fill in all required fields.
                        </div>
                    )}

                    {/* ── STEP 1: Personal Info ── */}
                    {step === 1 && (
                        <div className="animate-in space-y-4 duration-200 fade-in">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                                <ClipboardList className="h-4 w-4 text-[#1e3a8a] dark:text-blue-400" />
                                <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Step 1: Personal Details
                                </h3>
                            </div>

                            {/* Home Address */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="pc-home_address"
                                    className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                >
                                    Home Address{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
                                    <textarea
                                        id="pc-home_address"
                                        value={form.home_address}
                                        onChange={(e) =>
                                            set('home_address', e.target.value)
                                        }
                                        rows={2}
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 pt-2.5 pr-3 pl-10 text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                        placeholder="Street, Barangay, City / Municipality, Province"
                                    />
                                </div>
                                <InputError
                                    message={errors.home_address?.[0]}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Birthday */}
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-birthday"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Birthday{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Calendar className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="pc-birthday"
                                            type="date"
                                            value={form.birthday}
                                            onChange={(e) =>
                                                set('birthday', e.target.value)
                                            }
                                            className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                        />
                                    </div>
                                    <InputError
                                        message={errors.birthday?.[0]}
                                    />
                                </div>

                                {/* Place of Birth */}
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-place_of_birth"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Place of Birth
                                    </Label>
                                    <div className="relative">
                                        <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="pc-place_of_birth"
                                            type="text"
                                            value={form.place_of_birth}
                                            onChange={(e) =>
                                                set(
                                                    'place_of_birth',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                            placeholder="e.g., Balingasag, Misamis Oriental"
                                        />
                                    </div>
                                    <InputError
                                        message={errors.place_of_birth?.[0]}
                                    />
                                </div>
                            </div>

                            {/* Contact Number & Gender Selection */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-contact_no"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Mobile Contact Number{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Phone className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="pc-contact_no"
                                            type="tel"
                                            value={form.contact_no}
                                            onChange={(e) =>
                                                set(
                                                    'contact_no',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                            placeholder="e.g., 09123456789"
                                        />
                                    </div>
                                    <InputError
                                        message={errors.contact_no?.[0]}
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                                        Gender{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Male', 'Female'].map((g) => {
                                            const selected = form.gender === g;
                                            return (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() =>
                                                        set('gender', g)
                                                    }
                                                    className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all ${
                                                        selected
                                                            ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-sm'
                                                            : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    <User
                                                        className={`h-4 w-4 ${selected ? 'text-white' : 'text-slate-400'}`}
                                                    />
                                                    {g}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.gender?.[0]} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Religion */}
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-religion"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Religion
                                    </Label>
                                    <div className="relative">
                                        <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="pc-religion"
                                            type="text"
                                            value={form.religion}
                                            onChange={(e) =>
                                                set('religion', e.target.value)
                                            }
                                            className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                            placeholder="e.g., Roman Catholic"
                                        />
                                    </div>
                                    <InputError
                                        message={errors.religion?.[0]}
                                    />
                                </div>

                                {/* Nationality */}
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-nationality"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Nationality
                                    </Label>
                                    <div className="relative">
                                        <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="pc-nationality"
                                            type="text"
                                            value={form.nationality}
                                            onChange={(e) =>
                                                set(
                                                    'nationality',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                            placeholder="e.g., Filipino"
                                        />
                                    </div>
                                    <InputError
                                        message={errors.nationality?.[0]}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Academic Background ── */}
                    {step === 2 && (
                        <div className="animate-in space-y-4 duration-200 fade-in">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                                <GraduationCap className="h-4 w-4 text-[#1e3a8a] dark:text-blue-400" />
                                <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Step 2: Academic Background
                                </h3>
                            </div>

                            {/* Elementary School */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label
                                        htmlFor="pc-elementary_school"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Elementary School
                                    </Label>
                                    <Input
                                        id="pc-elementary_school"
                                        type="text"
                                        value={form.elementary_school}
                                        onChange={(e) =>
                                            set(
                                                'elementary_school',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                        placeholder="Elementary School Name"
                                    />
                                    <InputError
                                        message={errors.elementary_school?.[0]}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-elementary_year"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Year Graduated
                                    </Label>
                                    <Input
                                        id="pc-elementary_year"
                                        type="number"
                                        value={form.elementary_year_graduated}
                                        onChange={(e) =>
                                            set(
                                                'elementary_year_graduated',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                        placeholder="e.g., 2018"
                                    />
                                    <InputError
                                        message={
                                            errors
                                                .elementary_year_graduated?.[0]
                                        }
                                    />
                                </div>
                            </div>

                            {/* Junior High School */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label
                                        htmlFor="pc-junior_high"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Junior High School
                                    </Label>
                                    <Input
                                        id="pc-junior_high"
                                        type="text"
                                        value={form.junior_high_school}
                                        onChange={(e) =>
                                            set(
                                                'junior_high_school',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                        placeholder="Junior High School Name"
                                    />
                                    <InputError
                                        message={errors.junior_high_school?.[0]}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-junior_year"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Year Graduated
                                    </Label>
                                    <Input
                                        id="pc-junior_year"
                                        type="number"
                                        value={form.junior_high_year_graduated}
                                        onChange={(e) =>
                                            set(
                                                'junior_high_year_graduated',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                        placeholder="e.g., 2022"
                                    />
                                    <InputError
                                        message={
                                            errors
                                                .junior_high_year_graduated?.[0]
                                        }
                                    />
                                </div>
                            </div>

                            {/* Senior High School */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label
                                        htmlFor="pc-senior_high"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Senior High School
                                    </Label>
                                    <Input
                                        id="pc-senior_high"
                                        type="text"
                                        value={form.senior_high_school}
                                        onChange={(e) =>
                                            set(
                                                'senior_high_school',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                        placeholder="Senior High School Name"
                                    />
                                    <InputError
                                        message={errors.senior_high_school?.[0]}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-senior_year"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Year Graduated
                                    </Label>
                                    <Input
                                        id="pc-senior_year"
                                        type="number"
                                        value={form.senior_high_year_graduated}
                                        onChange={(e) =>
                                            set(
                                                'senior_high_year_graduated',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                        placeholder="e.g., 2024"
                                    />
                                    <InputError
                                        message={
                                            errors
                                                .senior_high_year_graduated?.[0]
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Family Background ── */}
                    {step === 3 && (
                        <div className="animate-in space-y-4 duration-200 fade-in">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                                <Users className="h-4 w-4 text-[#1e3a8a] dark:text-blue-400" />
                                <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Step 3: Family Background
                                </h3>
                            </div>

                            {/* Mother Information */}
                            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Mother Details
                                </h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="pc-mother_name"
                                            className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                        >
                                            Mother's Name
                                        </Label>
                                        <Input
                                            id="pc-mother_name"
                                            type="text"
                                            value={form.mother_name}
                                            onChange={(e) =>
                                                set(
                                                    'mother_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="dark:bg-slate-850 h-10 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-900 dark:border-slate-700 dark:text-white"
                                            placeholder="Mother's Full Name"
                                        />
                                        <InputError
                                            message={errors.mother_name?.[0]}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="pc-mother_contact"
                                            className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                        >
                                            Mother's Contact
                                        </Label>
                                        <Input
                                            id="pc-mother_contact"
                                            type="tel"
                                            value={form.mother_contact}
                                            onChange={(e) =>
                                                set(
                                                    'mother_contact',
                                                    e.target.value,
                                                )
                                            }
                                            className="dark:bg-slate-850 h-10 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-900 dark:border-slate-700 dark:text-white"
                                            placeholder="Contact Number"
                                        />
                                        <InputError
                                            message={errors.mother_contact?.[0]}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Father Information */}
                            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Father Details
                                </h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="pc-father_name"
                                            className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                        >
                                            Father's Name
                                        </Label>
                                        <Input
                                            id="pc-father_name"
                                            type="text"
                                            value={form.father_name}
                                            onChange={(e) =>
                                                set(
                                                    'father_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="dark:bg-slate-850 h-10 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-900 dark:border-slate-700 dark:text-white"
                                            placeholder="Father's Full Name"
                                        />
                                        <InputError
                                            message={errors.father_name?.[0]}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="pc-father_contact"
                                            className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                        >
                                            Father's Contact
                                        </Label>
                                        <Input
                                            id="pc-father_contact"
                                            type="tel"
                                            value={form.father_contact}
                                            onChange={(e) =>
                                                set(
                                                    'father_contact',
                                                    e.target.value,
                                                )
                                            }
                                            className="dark:bg-slate-850 h-10 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-900 dark:border-slate-700 dark:text-white"
                                            placeholder="Contact Number"
                                        />
                                        <InputError
                                            message={errors.father_contact?.[0]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: Emergency Contacts ── */}
                    {step === 4 && (
                        <div className="animate-in space-y-4 duration-200 fade-in">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                                <HeartHandshake className="h-4 w-4 text-[#1e3a8a] dark:text-blue-400" />
                                <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Step 4: Emergency Contact Information
                                </h3>
                            </div>

                            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-guardian_name"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                    >
                                        Contact Person Name{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pc-guardian_name"
                                        type="text"
                                        value={form.guardian_name}
                                        onChange={(e) =>
                                            set('guardian_name', e.target.value)
                                        }
                                        className="dark:bg-slate-850 h-10 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-900 dark:border-slate-700 dark:text-white"
                                        placeholder="Full name of parent, guardian, or spouse"
                                    />
                                    <InputError
                                        message={errors.guardian_name?.[0]}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="pc-guardian_relation"
                                            className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                        >
                                            Relationship{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="pc-guardian_relation"
                                            type="text"
                                            value={form.guardian_relation}
                                            onChange={(e) =>
                                                set(
                                                    'guardian_relation',
                                                    e.target.value,
                                                )
                                            }
                                            className="dark:bg-slate-850 h-10 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-900 dark:border-slate-700 dark:text-white"
                                            placeholder="e.g., Mother, Father, Uncle"
                                        />
                                        <InputError
                                            message={
                                                errors.guardian_relation?.[0]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="pc-guardian_contact"
                                            className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                        >
                                            Contact Number{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Phone className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="pc-guardian_contact"
                                                type="tel"
                                                value={form.guardian_contact}
                                                onChange={(e) =>
                                                    set(
                                                        'guardian_contact',
                                                        e.target.value,
                                                    )
                                                }
                                                className="dark:bg-slate-850 h-10 rounded-xl border-slate-200 bg-white pl-10 text-sm font-medium text-slate-900 dark:border-slate-700 dark:text-white"
                                                placeholder="e.g., 09123456789"
                                            />
                                        </div>
                                        <InputError
                                            message={
                                                errors.guardian_contact?.[0]
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dialog Footer Actions */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
                    <div>
                        {step > 1 && (
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={handleBack}
                                disabled={loading}
                                className="h-10 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
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
                                className="h-10 rounded-xl bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
                            >
                                Next Step
                                <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving Details...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
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
