import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Calendar,
    Check,
    ClipboardList,
    GraduationCap,
    MapPin,
    Phone,
    Users,
} from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    isOpen: boolean;
    /** Called once the student successfully saves all 3 steps */
    onComplete: () => void;
}

const STEPS = [
    { label: 'Personal Info', icon: ClipboardList },
    { label: 'Academic',      icon: GraduationCap },
    { label: 'Family',        icon: Users },
];

type FormData = {
    // Personal
    home_address: string;
    birthday: string;
    place_of_birth: string;
    religion: string;
    gender: string;
    contact_no: string;
    nationality: string;
    // Academic
    elementary_school: string;
    elementary_year_graduated: string;
    junior_high_school: string;
    junior_high_year_graduated: string;
    senior_high_school: string;
    senior_high_year_graduated: string;
    // Family
    mother_name: string;
    mother_contact: string;
    father_name: string;
    father_contact: string;
    guardian_name: string;
    guardian_relation: string;
    guardian_contact: string;
};

const initial: FormData = {
    home_address: '',
    birthday: '',
    place_of_birth: '',
    religion: '',
    gender: '',
    contact_no: '',
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

export default function StudentProfileCompletionModal({ isOpen, onComplete }: Props) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>(initial);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const totalSteps = 3;

    const set = (key: keyof FormData, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    /**
     * Client-side validation per step before allowing advancement.
     * Returns true if valid.
     */
    const validateStep = (): boolean => {
        const e: Record<string, string[]> = {};

        if (step === 1) {
            if (!form.home_address.trim())   e.home_address   = ['Home address is required.'];
            if (!form.birthday)              e.birthday       = ['Birthday is required.'];
            if (!form.place_of_birth.trim()) e.place_of_birth = ['Place of birth is required.'];
            if (!form.religion.trim())       e.religion       = ['Religion is required.'];
            if (!form.gender)                e.gender         = ['Please select a gender.'];
            if (!form.contact_no.trim())     e.contact_no     = ['Contact number is required.'];
            if (!form.nationality.trim())    e.nationality    = ['Nationality is required.'];
        } else if (step === 2) {
            if (!form.elementary_school.trim())            e.elementary_school            = ['Required.'];
            if (!form.elementary_year_graduated.trim())    e.elementary_year_graduated    = ['Required.'];
            if (!form.junior_high_school.trim())           e.junior_high_school           = ['Required.'];
            if (!form.junior_high_year_graduated.trim())   e.junior_high_year_graduated   = ['Required.'];
            if (!form.senior_high_school.trim())           e.senior_high_school           = ['Required.'];
            if (!form.senior_high_year_graduated.trim())   e.senior_high_year_graduated   = ['Required.'];
        } else if (step === 3) {
            if (!form.mother_name.trim())    e.mother_name    = ['Mother\'s name is required.'];
            if (!form.mother_contact.trim()) e.mother_contact = ['Mother\'s contact is required.'];
            if (!form.father_name.trim())    e.father_name    = ['Father\'s name is required.'];
            if (!form.father_contact.trim()) e.father_contact = ['Father\'s contact is required.'];
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
        if (step > 1) { setStep(s => s - 1); setErrors({}); }
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
                    const personalFields = ['home_address','birthday','place_of_birth','religion','gender','contact_no','nationality'];
                    const academicFields = ['elementary_school','elementary_year_graduated','junior_high_school','junior_high_year_graduated','senior_high_school','senior_high_year_graduated'];
                    const errKeys = Object.keys(res.data.errors);
                    if (errKeys.some(k => personalFields.includes(k))) setStep(1);
                    else if (errKeys.some(k => academicFields.includes(k))) setStep(2);
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

    return (
        /* Non-dismissible overlay — covers the entire dashboard */
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-gradient-to-b from-[#1b2f8a] to-[#0b1c5c] shadow-2xl flex flex-col">

                {/* ── Header ── */}
                <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">Complete Your Profile</h2>
                            <p className="text-xs text-white/60">This information is required before you can access your dashboard.</p>
                        </div>
                    </div>

                    {/* Step progress */}
                    <div className="mt-4">
                        <div className="flex items-center gap-0">
                            {STEPS.map((s, i) => {
                                const num = i + 1;
                                const isDone = num < step;
                                const isActive = num === step;
                                return (
                                    <div key={s.label} className="flex items-center flex-1 last:flex-none">
                                        <div className="flex flex-col items-center gap-1">
                                            <div
                                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                                    isDone
                                                        ? 'bg-green-500 text-white'
                                                        : isActive
                                                        ? 'bg-white text-blue-700'
                                                        : 'bg-white/20 text-white/50'
                                                }`}
                                            >
                                                {isDone ? <Check className="h-3.5 w-3.5" /> : num}
                                            </div>
                                            <span className={`text-[10px] font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>
                                                {s.label}
                                            </span>
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${isDone ? 'bg-green-500' : 'bg-white/20'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                    {/* ─── STEP 1: Personal Info ─── */}
                    {step === 1 && (
                        <>
                            <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 opacity-70" /> Personal Information
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="pc-home_address" className="text-sm text-white/90">Home Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                                    <textarea
                                        id="pc-home_address"
                                        value={form.home_address}
                                        onChange={e => set('home_address', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 pl-10 pt-2 pr-3 resize-none focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                                        placeholder="Street, Barangay, City/Municipality, Province, Postal Code"
                                    />
                                </div>
                                <InputError message={errors.home_address?.[0]} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="pc-birthday" className="text-sm text-white/90">Birthday</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                        <Input
                                            id="pc-birthday"
                                            type="date"
                                            value={form.birthday}
                                            onChange={e => set('birthday', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white pl-10"
                                        />
                                    </div>
                                    <InputError message={errors.birthday?.[0]} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pc-place_of_birth" className="text-sm text-white/90">Place of Birth</Label>
                                    <Input
                                        id="pc-place_of_birth"
                                        type="text"
                                        value={form.place_of_birth}
                                        onChange={e => set('place_of_birth', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                        placeholder="City, Province"
                                    />
                                    <InputError message={errors.place_of_birth?.[0]} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="pc-religion" className="text-sm text-white/90">Religion</Label>
                                    <Input
                                        id="pc-religion"
                                        type="text"
                                        value={form.religion}
                                        onChange={e => set('religion', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                        placeholder="e.g., Roman Catholic"
                                    />
                                    <InputError message={errors.religion?.[0]} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pc-nationality" className="text-sm text-white/90">Nationality</Label>
                                    <Input
                                        id="pc-nationality"
                                        type="text"
                                        value={form.nationality}
                                        onChange={e => set('nationality', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                        placeholder="e.g., Filipino"
                                    />
                                    <InputError message={errors.nationality?.[0]} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="pc-contact_no" className="text-sm text-white/90">Contact Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                        <Input
                                            id="pc-contact_no"
                                            type="tel"
                                            value={form.contact_no}
                                            onChange={e => set('contact_no', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40 pl-10"
                                            placeholder="09123456789"
                                        />
                                    </div>
                                    <InputError message={errors.contact_no?.[0]} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-white/90">Gender</Label>
                                    <div className="flex items-center gap-5 pt-2">
                                        {['Male', 'Female'].map(g => (
                                            <label key={g} className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                                                <Checkbox
                                                    checked={form.gender === g}
                                                    onCheckedChange={checked => { if (checked) set('gender', g); }}
                                                    className="border-white/30"
                                                />
                                                {g}
                                            </label>
                                        ))}
                                    </div>
                                    <InputError message={errors.gender?.[0]} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ─── STEP 2: Academic Background ─── */}
                    {step === 2 && (
                        <>
                            <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 opacity-70" /> Academic Background
                            </h3>

                            {[
                                {
                                    label: 'Elementary Education',
                                    schoolKey: 'elementary_school' as keyof FormData,
                                    yearKey: 'elementary_year_graduated' as keyof FormData,
                                    yearPlaceholder: 'e.g., 2018',
                                },
                                {
                                    label: 'Junior High School',
                                    schoolKey: 'junior_high_school' as keyof FormData,
                                    yearKey: 'junior_high_year_graduated' as keyof FormData,
                                    yearPlaceholder: 'e.g., 2022',
                                },
                                {
                                    label: 'Senior High School',
                                    schoolKey: 'senior_high_school' as keyof FormData,
                                    yearKey: 'senior_high_year_graduated' as keyof FormData,
                                    yearPlaceholder: 'e.g., 2024',
                                },
                            ].map(row => (
                                <div key={row.label} className="space-y-2">
                                    <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">{row.label}</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor={`pc-${row.schoolKey}`} className="text-xs text-white/80">School Name</Label>
                                            <Input
                                                id={`pc-${row.schoolKey}`}
                                                type="text"
                                                value={form[row.schoolKey]}
                                                onChange={e => set(row.schoolKey, e.target.value)}
                                                className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                                placeholder="School name"
                                            />
                                            <InputError message={errors[row.schoolKey]?.[0]} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`pc-${row.yearKey}`} className="text-xs text-white/80">Year Graduated</Label>
                                            <Input
                                                id={`pc-${row.yearKey}`}
                                                type="number"
                                                value={form[row.yearKey]}
                                                onChange={e => set(row.yearKey, e.target.value)}
                                                className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                                placeholder={row.yearPlaceholder}
                                                min={1900}
                                                max={new Date().getFullYear()}
                                            />
                                            <InputError message={errors[row.yearKey]?.[0]} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* ─── STEP 3: Family Background ─── */}
                    {step === 3 && (
                        <>
                            <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                <Users className="h-4 w-4 opacity-70" /> Family Background
                            </h3>

                            {/* Mother */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Mother's Information</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="pc-mother_name" className="text-xs text-white/80">Full Name</Label>
                                        <Input
                                            id="pc-mother_name"
                                            type="text"
                                            value={form.mother_name}
                                            onChange={e => set('mother_name', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                            placeholder="Full name"
                                        />
                                        <InputError message={errors.mother_name?.[0]} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="pc-mother_contact" className="text-xs text-white/80">Contact Number</Label>
                                        <Input
                                            id="pc-mother_contact"
                                            type="tel"
                                            value={form.mother_contact}
                                            onChange={e => set('mother_contact', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                            placeholder="09123456789"
                                        />
                                        <InputError message={errors.mother_contact?.[0]} />
                                    </div>
                                </div>
                            </div>

                            {/* Father */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Father's Information</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="pc-father_name" className="text-xs text-white/80">Full Name</Label>
                                        <Input
                                            id="pc-father_name"
                                            type="text"
                                            value={form.father_name}
                                            onChange={e => set('father_name', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                            placeholder="Full name"
                                        />
                                        <InputError message={errors.father_name?.[0]} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="pc-father_contact" className="text-xs text-white/80">Contact Number</Label>
                                        <Input
                                            id="pc-father_contact"
                                            type="tel"
                                            value={form.father_contact}
                                            onChange={e => set('father_contact', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                            placeholder="09123456789"
                                        />
                                        <InputError message={errors.father_contact?.[0]} />
                                    </div>
                                </div>
                            </div>

                            {/* Guardian (optional) */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Guardian Information <span className="normal-case font-normal opacity-60">(optional)</span></h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="pc-guardian_name" className="text-xs text-white/80">Name</Label>
                                        <Input
                                            id="pc-guardian_name"
                                            type="text"
                                            value={form.guardian_name}
                                            onChange={e => set('guardian_name', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                            placeholder="Full name"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="pc-guardian_relation" className="text-xs text-white/80">Relationship</Label>
                                        <Input
                                            id="pc-guardian_relation"
                                            type="text"
                                            value={form.guardian_relation}
                                            onChange={e => set('guardian_relation', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                            placeholder="e.g., Aunt"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="pc-guardian_contact" className="text-xs text-white/80">Contact</Label>
                                        <Input
                                            id="pc-guardian_contact"
                                            type="tel"
                                            value={form.guardian_contact}
                                            onChange={e => set('guardian_contact', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/40"
                                            placeholder="09123456789"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-white/10 shrink-0">
                    <div className="flex items-center justify-between">
                        {/* Back button */}
                        <div>
                            {step > 1 && (
                                <Button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={loading}
                                    className="h-10 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                                    Back
                                </Button>
                            )}
                        </div>

                        {/* Step indicator text */}
                        <span className="text-xs text-white/40">
                            Step {step} of {totalSteps}
                        </span>

                        {/* Next / Submit button */}
                        {step < totalSteps ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={loading}
                                className="h-10 rounded-lg bg-white text-blue-700 hover:bg-gray-100 transition-colors font-semibold"
                            >
                                Next
                                <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="h-10 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors font-semibold disabled:opacity-50"
                            >
                                {loading ? 'Saving…' : 'Save Profile'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
