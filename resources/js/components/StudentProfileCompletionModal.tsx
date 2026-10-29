import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ClipboardList,
    Copy,
    GraduationCap,
    HeartHandshake,
    Info,
    Loader2,
    MapPin,
    Phone,
    Shield,
    Sparkles,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
    isOpen: boolean;
    /** Called once the student successfully saves profile */
    onComplete: () => void;
}

const STEPS = [
    {
        label: 'Personal Info',
        shortLabel: 'Personal',
        description: 'Basic contact & details',
        icon: ClipboardList,
        required: true,
    },
    {
        label: 'Academic Background',
        shortLabel: 'Academic',
        description: 'Previous schools history',
        icon: GraduationCap,
        required: true,
    },
    {
        label: 'Family Background',
        shortLabel: 'Family',
        description: 'Parents information',
        icon: Users,
        required: true,
    },
    {
        label: 'Emergency Contact',
        shortLabel: 'Emergency',
        description: 'Person to reach in emergency',
        icon: HeartHandshake,
        required: true,
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
    elementary_year_started: string;
    elementary_year_graduated: string;
    junior_high_school: string;
    junior_high_year_started: string;
    junior_high_year_graduated: string;
    senior_high_school: string;
    senior_high_year_started: string;
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
    nationality: 'Filipino',

    elementary_school: '',
    elementary_year_started: '',
    elementary_year_graduated: '',
    junior_high_school: '',
    junior_high_year_started: '',
    junior_high_year_graduated: '',
    senior_high_school: '',
    senior_high_year_started: '',
    senior_high_year_graduated: '',

    mother_name: '',
    mother_contact: '',
    father_name: '',
    father_contact: '',

    guardian_name: '',
    guardian_relation: '',
    guardian_contact: '',
};

const COMMON_RELATIONSHIPS = [
    'Mother',
    'Father',
    'Guardian',
    'Sibling',
    'Grandparent',
    'Aunt/Uncle',
    'Spouse',
];

const COMMON_RELIGIONS = [
    'Roman Catholic',
    'Christian / Evangelical',
    'Iglesia ni Cristo',
    'Islam',
    'Seventh-day Adventist',
    'Baptist',
    'Born Again Christian',
    'Jehovah’s Witnesses',
    'Church of Christ',
];

/**
 * Enforces typing only:
 * - 11 numbers (e.g. 09123456789)
 * - OR +63 format (e.g. +639123456789)
 */
const formatPhoneNumber = (val: string): string => {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.startsWith('+')) {
        // Keep '+' and allow up to 12 digits after it (+639XXXXXXXXX = 13 chars total)
        const digits = trimmed.slice(1).replace(/\D/g, '');
        return ('+' + digits).slice(0, 13);
    }
    // Clean to digits only, maximum 11 digits (09XXXXXXXXX)
    return trimmed.replace(/\D/g, '').slice(0, 11);
};

/**
 * Validates that number is exactly 11 digits starting with 09, OR +63 format (+639 followed by 9 digits).
 */
const isValidPhilippinePhone = (val: string): boolean => {
    if (!val || !val.trim()) return false;
    const clean = val.trim();
    if (/^09\d{9}$/.test(clean)) return true;
    if (/^\+639\d{9}$/.test(clean)) return true;
    return false;
};

const getStorageKey = (user: any): string => {
    const id = user?.id ?? user?.student_id ?? 'current';
    return `dsams_profile_completion_draft_${id}`;
};

const loadDraftState = (
    key: string,
    authUser: any,
): { form: FormData; step: number; maxStepReached: number } => {
    let savedForm: Partial<FormData> = {};
    let savedStep = 1;
    let savedMaxStep = 1;

    try {
        if (typeof window !== 'undefined') {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.form && typeof parsed.form === 'object') {
                        savedForm = parsed.form;
                    }
                    if (
                        typeof parsed.step === 'number' &&
                        parsed.step >= 1 &&
                        parsed.step <= 4
                    ) {
                        savedStep = parsed.step;
                    }
                    if (
                        typeof parsed.maxStepReached === 'number' &&
                        parsed.maxStepReached >= 1 &&
                        parsed.maxStepReached <= 4
                    ) {
                        savedMaxStep = parsed.maxStepReached;
                    }
                }
            }
        }
    } catch {
        // Fallback gracefully if localStorage is disabled or corrupted
    }

    const mergedForm: FormData = {
        home_address:
            savedForm.home_address ??
            authUser?.home_address ??
            initial.home_address,
        birthday:
            savedForm.birthday ??
            (authUser?.birthday
                ? String(authUser.birthday).split('T')[0]
                : initial.birthday),
        gender: savedForm.gender ?? authUser?.gender ?? initial.gender,
        contact_no:
            savedForm.contact_no ??
            (authUser?.contact_no
                ? formatPhoneNumber(authUser.contact_no)
                : initial.contact_no),
        place_of_birth:
            savedForm.place_of_birth ??
            authUser?.place_of_birth ??
            initial.place_of_birth,
        religion:
            savedForm.religion ?? authUser?.religion ?? initial.religion,
        nationality:
            savedForm.nationality ??
            authUser?.nationality ??
            initial.nationality,

        elementary_school:
            savedForm.elementary_school ??
            authUser?.elementary_school ??
            initial.elementary_school,
        elementary_year_started:
            savedForm.elementary_year_started ??
            (authUser?.elementary_year_started
                ? String(authUser.elementary_year_started)
                : initial.elementary_year_started),
        elementary_year_graduated:
            savedForm.elementary_year_graduated ??
            (authUser?.elementary_year_graduated
                ? String(authUser.elementary_year_graduated)
                : initial.elementary_year_graduated),
        junior_high_school:
            savedForm.junior_high_school ??
            authUser?.junior_high_school ??
            initial.junior_high_school,
        junior_high_year_started:
            savedForm.junior_high_year_started ??
            (authUser?.junior_high_year_started
                ? String(authUser.junior_high_year_started)
                : initial.junior_high_year_started),
        junior_high_year_graduated:
            savedForm.junior_high_year_graduated ??
            (authUser?.junior_high_year_graduated
                ? String(authUser.junior_high_year_graduated)
                : initial.junior_high_year_graduated),
        senior_high_school:
            savedForm.senior_high_school ??
            authUser?.senior_high_school ??
            initial.senior_high_school,
        senior_high_year_started:
            savedForm.senior_high_year_started ??
            (authUser?.senior_high_year_started
                ? String(authUser.senior_high_year_started)
                : initial.senior_high_year_started),
        senior_high_year_graduated:
            savedForm.senior_high_year_graduated ??
            (authUser?.senior_high_year_graduated
                ? String(authUser.senior_high_year_graduated)
                : initial.senior_high_year_graduated),

        mother_name:
            savedForm.mother_name ??
            authUser?.mother_name ??
            initial.mother_name,
        mother_contact:
            savedForm.mother_contact ??
            (authUser?.mother_contact
                ? formatPhoneNumber(authUser.mother_contact)
                : initial.mother_contact),
        father_name:
            savedForm.father_name ??
            authUser?.father_name ??
            initial.father_name,
        father_contact:
            savedForm.father_contact ??
            (authUser?.father_contact
                ? formatPhoneNumber(authUser.father_contact)
                : initial.father_contact),

        guardian_name:
            savedForm.guardian_name ??
            authUser?.guardian_name ??
            initial.guardian_name,
        guardian_relation:
            savedForm.guardian_relation ??
            authUser?.guardian_relation ??
            initial.guardian_relation,
        guardian_contact:
            savedForm.guardian_contact ??
            (authUser?.guardian_contact
                ? formatPhoneNumber(authUser.guardian_contact)
                : initial.guardian_contact),
    };

    return {
        form: mergedForm,
        step: savedStep,
        maxStepReached: Math.max(savedStep, savedMaxStep),
    };
};

export default function StudentProfileCompletionModal({
    isOpen,
    onComplete,
}: Props) {
    const page = usePage();
    const authUser = (page.props as any)?.auth?.user || (page.props as any)?.user;
    const storageKey = getStorageKey(authUser);

    // Initial state lazily retrieved from localStorage merged with authUser
    const [initialState] = useState(() => loadDraftState(storageKey, authUser));
    const [step, setStep] = useState(initialState.step);
    const [maxStepReached, setMaxStepReached] = useState(initialState.maxStepReached);
    const [form, setForm] = useState<FormData>(initialState.form);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const totalSteps = 4;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Persist draft whenever form inputs, step, or maxStepReached change
    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify({
                    form,
                    step,
                    maxStepReached,
                    saved_at: new Date().toISOString(),
                }),
            );
        } catch {
            // ignore localStorage quota errors
        }
    }, [form, step, maxStepReached, storageKey, mounted]);

    // Pre-populate any blank fields if authUser updates later, without overwriting user-entered data
    useEffect(() => {
        if (authUser) {
            setForm((prev) => ({
                ...prev,
                home_address: prev.home_address || authUser.home_address || '',
                birthday: prev.birthday || (authUser.birthday ? String(authUser.birthday).split('T')[0] : ''),
                gender: prev.gender || authUser.gender || '',
                contact_no: prev.contact_no || (authUser.contact_no ? formatPhoneNumber(authUser.contact_no) : ''),
                place_of_birth: prev.place_of_birth || authUser.place_of_birth || '',
                religion: prev.religion || authUser.religion || '',
                nationality: prev.nationality || authUser.nationality || 'Filipino',
                elementary_school: prev.elementary_school || authUser.elementary_school || '',
                elementary_year_started: prev.elementary_year_started || (authUser.elementary_year_started ? String(authUser.elementary_year_started) : ''),
                elementary_year_graduated: prev.elementary_year_graduated || (authUser.elementary_year_graduated ? String(authUser.elementary_year_graduated) : ''),
                junior_high_school: prev.junior_high_school || authUser.junior_high_school || '',
                junior_high_year_started: prev.junior_high_year_started || (authUser.junior_high_year_started ? String(authUser.junior_high_year_started) : ''),
                junior_high_year_graduated: prev.junior_high_year_graduated || (authUser.junior_high_year_graduated ? String(authUser.junior_high_year_graduated) : ''),
                senior_high_school: prev.senior_high_school || authUser.senior_high_school || '',
                senior_high_year_started: prev.senior_high_year_started || (authUser.senior_high_year_started ? String(authUser.senior_high_year_started) : ''),
                senior_high_year_graduated: prev.senior_high_year_graduated || (authUser.senior_high_year_graduated ? String(authUser.senior_high_year_graduated) : ''),
                mother_name: prev.mother_name || authUser.mother_name || '',
                mother_contact: prev.mother_contact || (authUser.mother_contact ? formatPhoneNumber(authUser.mother_contact) : ''),
                father_name: prev.father_name || authUser.father_name || '',
                father_contact: prev.father_contact || (authUser.father_contact ? formatPhoneNumber(authUser.father_contact) : ''),
                guardian_name: prev.guardian_name || authUser.guardian_name || '',
                guardian_relation: prev.guardian_relation || authUser.guardian_relation || '',
                guardian_contact: prev.guardian_contact || (authUser.guardian_contact ? formatPhoneNumber(authUser.guardian_contact) : ''),
            }));
        }
    }, [authUser]);

    const set = (key: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        // Clear field error on edit
        if (errors[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    /**
     * Auto-calculate graduation & progression years:
     * - Elementary: Grades 1–6 (6 yrs: Start to End)
     * - Junior High School: Grades 7–10 (4 yrs: Start to End)
     * - Senior High School: Grades 11–12 (2 yrs: Start to End)
     */
    const handleElementaryStartChange = (val: string) => {
        const currentYear = new Date().getFullYear();
        setForm((prev) => {
            const next = { ...prev, elementary_year_started: val };
            const startYr = parseInt(val, 10);
            if (!isNaN(startYr) && val.length === 4 && startYr >= 1950 && startYr <= currentYear) {
                const elemEnd = startYr + 6;
                const jhsStart = elemEnd;
                const jhsEnd = jhsStart + 4;
                const shsStart = jhsEnd;
                const shsEnd = shsStart + 2;

                if (elemEnd <= currentYear) next.elementary_year_graduated = String(elemEnd);
                if (jhsStart <= currentYear) next.junior_high_year_started = String(jhsStart);
                if (jhsEnd <= currentYear) next.junior_high_year_graduated = String(jhsEnd);
                if (shsStart <= currentYear) next.senior_high_year_started = String(shsStart);
                if (shsEnd <= currentYear) next.senior_high_year_graduated = String(shsEnd);
            }
            return next;
        });
        setErrors((prev) => {
            const next = { ...prev };
            delete next.elementary_year_started;
            delete next.elementary_year_graduated;
            delete next.junior_high_year_started;
            delete next.junior_high_year_graduated;
            delete next.senior_high_year_started;
            delete next.senior_high_year_graduated;
            return next;
        });
    };

    const handleElementaryEndChange = (val: string) => {
        const currentYear = new Date().getFullYear();
        setForm((prev) => {
            const next = { ...prev, elementary_year_graduated: val };
            const endYr = parseInt(val, 10);
            if (!isNaN(endYr) && val.length === 4 && endYr >= 1950 && endYr <= currentYear) {
                if (!prev.elementary_year_started) {
                    next.elementary_year_started = String(endYr - 6);
                }
                const jhsStart = endYr;
                const jhsEnd = jhsStart + 4;
                const shsStart = jhsEnd;
                const shsEnd = shsStart + 2;

                if (jhsStart <= currentYear) next.junior_high_year_started = String(jhsStart);
                if (jhsEnd <= currentYear) next.junior_high_year_graduated = String(jhsEnd);
                if (shsStart <= currentYear) next.senior_high_year_started = String(shsStart);
                if (shsEnd <= currentYear) next.senior_high_year_graduated = String(shsEnd);
            }
            return next;
        });
        setErrors((prev) => {
            const next = { ...prev };
            delete next.elementary_year_graduated;
            delete next.junior_high_year_started;
            delete next.junior_high_year_graduated;
            delete next.senior_high_year_started;
            delete next.senior_high_year_graduated;
            return next;
        });
    };

    const handleJuniorStartChange = (val: string) => {
        const currentYear = new Date().getFullYear();
        setForm((prev) => {
            const next = { ...prev, junior_high_year_started: val };
            const startYr = parseInt(val, 10);
            if (!isNaN(startYr) && val.length === 4 && startYr >= 1950 && startYr <= currentYear) {
                const jhsEnd = startYr + 4;
                const shsStart = jhsEnd;
                const shsEnd = shsStart + 2;
                if (jhsEnd <= currentYear) next.junior_high_year_graduated = String(jhsEnd);
                if (shsStart <= currentYear) next.senior_high_year_started = String(shsStart);
                if (shsEnd <= currentYear) next.senior_high_year_graduated = String(shsEnd);
                if (!prev.elementary_year_graduated) next.elementary_year_graduated = String(startYr);
                if (!prev.elementary_year_started) next.elementary_year_started = String(startYr - 6);
            }
            return next;
        });
        setErrors((prev) => {
            const next = { ...prev };
            delete next.junior_high_year_started;
            delete next.junior_high_year_graduated;
            delete next.senior_high_year_started;
            delete next.senior_high_year_graduated;
            return next;
        });
    };

    const handleJuniorEndChange = (val: string) => {
        const currentYear = new Date().getFullYear();
        setForm((prev) => {
            const next = { ...prev, junior_high_year_graduated: val };
            const endYr = parseInt(val, 10);
            if (!isNaN(endYr) && val.length === 4 && endYr >= 1950 && endYr <= currentYear) {
                if (!prev.junior_high_year_started) next.junior_high_year_started = String(endYr - 4);
                const shsStart = endYr;
                const shsEnd = shsStart + 2;
                if (shsStart <= currentYear) next.senior_high_year_started = String(shsStart);
                if (shsEnd <= currentYear) next.senior_high_year_graduated = String(shsEnd);
            }
            return next;
        });
        setErrors((prev) => {
            const next = { ...prev };
            delete next.junior_high_year_graduated;
            delete next.senior_high_year_started;
            delete next.senior_high_year_graduated;
            return next;
        });
    };

    const handleSeniorStartChange = (val: string) => {
        const currentYear = new Date().getFullYear();
        setForm((prev) => {
            const next = { ...prev, senior_high_year_started: val };
            const startYr = parseInt(val, 10);
            if (!isNaN(startYr) && val.length === 4 && startYr >= 1950 && startYr <= currentYear) {
                const shsEnd = startYr + 2;
                if (shsEnd <= currentYear) next.senior_high_year_graduated = String(shsEnd);
                if (!prev.junior_high_year_graduated) next.junior_high_year_graduated = String(startYr);
            }
            return next;
        });
        setErrors((prev) => {
            const next = { ...prev };
            delete next.senior_high_year_started;
            delete next.senior_high_year_graduated;
            return next;
        });
    };

    const handleSeniorEndChange = (val: string) => {
        setForm((prev) => {
            const next = { ...prev, senior_high_year_graduated: val };
            const endYr = parseInt(val, 10);
            if (!isNaN(endYr) && val.length === 4 && endYr >= 1950) {
                if (!prev.senior_high_year_started) next.senior_high_year_started = String(endYr - 2);
            }
            return next;
        });
        setErrors((prev) => {
            const next = { ...prev };
            delete next.senior_high_year_graduated;
            return next;
        });
    };

    // Auto-calculate graduation & progression years from birthday when entering Step 2 if fields are still empty
    useEffect(() => {
        if (step === 2 && form.birthday) {
            const birthYear = new Date(form.birthday).getFullYear();
            const currentYear = new Date().getFullYear();
            if (birthYear && birthYear > 1950 && birthYear < currentYear) {
                const elemStart = birthYear + 6;
                const elemEnd = elemStart + 6;
                const jhsStart = elemEnd;
                const jhsEnd = jhsStart + 4;
                const shsStart = jhsEnd;
                const shsEnd = shsStart + 2;
                setForm((prev) => {
                    if (prev.elementary_year_started || prev.elementary_year_graduated) return prev;
                    return {
                        ...prev,
                        elementary_year_started: elemStart <= currentYear ? String(elemStart) : '',
                        elementary_year_graduated: elemEnd <= currentYear ? String(elemEnd) : '',
                        junior_high_year_started: jhsStart <= currentYear ? String(jhsStart) : '',
                        junior_high_year_graduated: jhsEnd <= currentYear ? String(jhsEnd) : '',
                        senior_high_year_started: shsStart <= currentYear ? String(shsStart) : '',
                        senior_high_year_graduated: shsEnd <= currentYear ? String(shsEnd) : '',
                    };
                });
            }
        }
    }, [step, form.birthday]);

    const validateStep = (currentStep: number): boolean => {
        const e: Record<string, string[]> = {};
        const currentYear = new Date().getFullYear();

        if (currentStep === 1) {
            if (!form.home_address.trim()) {
                e.home_address = ['Home address is required.'];
            }
            if (!form.birthday) {
                e.birthday = ['Birthday is required.'];
            } else {
                const birthDate = new Date(form.birthday);
                const today = new Date();
                if (birthDate >= today) {
                    e.birthday = ['Birthday must be a valid date in the past.'];
                }
            }
            if (!form.place_of_birth.trim()) {
                e.place_of_birth = ['Place of birth is required.'];
            }
            if (!form.contact_no.trim()) {
                e.contact_no = ['Contact number is required.'];
            } else if (!isValidPhilippinePhone(form.contact_no)) {
                e.contact_no = [
                    'Must be 11 digits (e.g., 09123456789) or in +63 format (e.g., +639123456789).',
                ];
            }
            if (!form.gender) {
                e.gender = ['Please select your gender.'];
            }
            if (!form.religion.trim()) {
                e.religion = ['Please select your religion.'];
            }
            if (!form.nationality.trim()) {
                e.nationality = ['Nationality is required.'];
            }
        } else if (currentStep === 2) {
            // Elementary
            if (!form.elementary_school.trim()) {
                e.elementary_school = ['Elementary School name is required.'];
            }
            if (!form.elementary_year_started.trim()) {
                e.elementary_year_started = ['Year started is required.'];
            } else {
                const yr = parseInt(form.elementary_year_started, 10);
                if (isNaN(yr) || yr < 1900 || yr > currentYear) {
                    e.elementary_year_started = [`Enter a valid year (1900-${currentYear}).`];
                }
            }
            if (!form.elementary_year_graduated.trim()) {
                e.elementary_year_graduated = ['Year ended is required.'];
            } else {
                const yr = parseInt(form.elementary_year_graduated, 10);
                const startYr = parseInt(form.elementary_year_started, 10);
                if (isNaN(yr) || yr < 1900 || yr > currentYear) {
                    e.elementary_year_graduated = [`Enter a valid year (1900-${currentYear}).`];
                } else if (!isNaN(startYr) && yr < startYr) {
                    e.elementary_year_graduated = ['Year ended must be after Year started.'];
                }
            }

            // Junior High
            if (!form.junior_high_school.trim()) {
                e.junior_high_school = ['Junior High School name is required.'];
            }
            if (!form.junior_high_year_started.trim()) {
                e.junior_high_year_started = ['Year started is required.'];
            } else {
                const yr = parseInt(form.junior_high_year_started, 10);
                if (isNaN(yr) || yr < 1900 || yr > currentYear) {
                    e.junior_high_year_started = [`Enter a valid year (1900-${currentYear}).`];
                }
            }
            if (!form.junior_high_year_graduated.trim()) {
                e.junior_high_year_graduated = ['Year ended is required.'];
            } else {
                const yr = parseInt(form.junior_high_year_graduated, 10);
                const startYr = parseInt(form.junior_high_year_started, 10);
                if (isNaN(yr) || yr < 1900 || yr > currentYear) {
                    e.junior_high_year_graduated = [`Enter a valid year (1900-${currentYear}).`];
                } else if (!isNaN(startYr) && yr < startYr) {
                    e.junior_high_year_graduated = ['Year ended must be after Year started.'];
                }
            }

            // Senior High
            if (!form.senior_high_school.trim()) {
                e.senior_high_school = ['Senior High School name is required.'];
            }
            if (!form.senior_high_year_started.trim()) {
                e.senior_high_year_started = ['Year started is required.'];
            } else {
                const yr = parseInt(form.senior_high_year_started, 10);
                if (isNaN(yr) || yr < 1900 || yr > currentYear) {
                    e.senior_high_year_started = [`Enter a valid year (1900-${currentYear}).`];
                }
            }
            if (!form.senior_high_year_graduated.trim()) {
                e.senior_high_year_graduated = ['Year ended is required.'];
            } else {
                const yr = parseInt(form.senior_high_year_graduated, 10);
                const startYr = parseInt(form.senior_high_year_started, 10);
                if (isNaN(yr) || yr < 1900 || yr > currentYear) {
                    e.senior_high_year_graduated = [`Enter a valid year (1900-${currentYear}).`];
                } else if (!isNaN(startYr) && yr < startYr) {
                    e.senior_high_year_graduated = ['Year ended must be after Year started.'];
                }
            }
        } else if (currentStep === 3) {
            const hasMotherName = Boolean(form.mother_name.trim());
            const hasMotherContact = Boolean(form.mother_contact.trim());
            const hasFatherName = Boolean(form.father_name.trim());
            const hasFatherContact = Boolean(form.father_contact.trim());

            const hasMother = hasMotherName || hasMotherContact;
            const hasFather = hasFatherName || hasFatherContact;

            if (!hasMother && !hasFather) {
                e.mother_name = ["Please provide details for at least one parent (Mother or Father)."];
                e.father_name = ["Please provide details for at least one parent (Mother or Father)."];
            } else {
                if (hasMother) {
                    if (!hasMotherName) {
                        e.mother_name = ["Mother's full name is required."];
                    }
                    if (!hasMotherContact) {
                        e.mother_contact = ["Mother's contact number is required."];
                    } else if (!isValidPhilippinePhone(form.mother_contact)) {
                        e.mother_contact = [
                            'Must be 11 digits (e.g., 09123456789) or in +63 format (e.g., +639123456789).',
                        ];
                    }
                }

                if (hasFather) {
                    if (!hasFatherName) {
                        e.father_name = ["Father's full name is required."];
                    }
                    if (!hasFatherContact) {
                        e.father_contact = ["Father's contact number is required."];
                    } else if (!isValidPhilippinePhone(form.father_contact)) {
                        e.father_contact = [
                            'Must be 11 digits (e.g., 09123456789) or in +63 format (e.g., +639123456789).',
                        ];
                    }
                }
            }
        } else if (currentStep === 4) {
            if (!form.guardian_name.trim()) {
                e.guardian_name = ['Emergency contact name is required.'];
            }
            if (!form.guardian_relation.trim()) {
                e.guardian_relation = ['Please specify the relationship.'];
            }
            if (!form.guardian_contact.trim()) {
                e.guardian_contact = ['Emergency contact number is required.'];
            } else if (!isValidPhilippinePhone(form.guardian_contact)) {
                e.guardian_contact = [
                    'Must be 11 digits (e.g., 09123456789) or in +63 format (e.g., +639123456789).',
                ];
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const goToStep = (targetStep: number) => {
        if (targetStep < step) {
            setStep(targetStep);
            setErrors({});
            return;
        }
        if (targetStep > step) {
            // Must validate current step before jumping forward
            if (!validateStep(step)) return;
            setStep(targetStep);
            setMaxStepReached((prev) => Math.max(prev, targetStep));
            setErrors({});
        }
    };

    const handleNext = () => {
        if (!validateStep(step)) return;
        if (step < totalSteps) {
            const nextStep = step + 1;
            setStep(nextStep);
            setMaxStepReached((prev) => Math.max(prev, nextStep));
            setErrors({});
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((s) => s - 1);
            setErrors({});
        }
    };

    const copyFromMother = () => {
        if (form.mother_name.trim()) {
            setForm((prev) => ({
                ...prev,
                guardian_name: prev.mother_name,
                guardian_relation: 'Mother',
                guardian_contact: prev.mother_contact || prev.guardian_contact,
            }));
            setErrors((prev) => {
                const next = { ...prev };
                delete next.guardian_name;
                delete next.guardian_relation;
                delete next.guardian_contact;
                return next;
            });
        }
    };

    const copyFromFather = () => {
        if (form.father_name.trim()) {
            setForm((prev) => ({
                ...prev,
                guardian_name: prev.father_name,
                guardian_relation: 'Father',
                guardian_contact: prev.father_contact || prev.guardian_contact,
            }));
            setErrors((prev) => {
                const next = { ...prev };
                delete next.guardian_name;
                delete next.guardian_relation;
                delete next.guardian_contact;
                return next;
            });
        }
    };

    const handleSubmit = () => {
        if (!validateStep(step)) return;
        setLoading(true);
        setErrors({});

        axios
            .post('/student/complete-profile', form)
            .then((res) => {
                if (res.data.success) {
                    try {
                        localStorage.removeItem(storageKey);
                    } catch {
                        // ignore
                    }
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
                        'elementary_year_started',
                        'elementary_year_graduated',
                        'junior_high_school',
                        'junior_high_year_started',
                        'junior_high_year_graduated',
                        'senior_high_school',
                        'senior_high_year_started',
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
                    } else if (errKeys.some((k) => academicFields.includes(k))) {
                        setStep(2);
                    } else if (errKeys.some((k) => familyFields.includes(k))) {
                        setStep(3);
                    } else {
                        setStep(4);
                    }
                } else {
                    alert(res.data.error || 'Failed to save profile. Please try again.');
                }
            })
            .catch((err) => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                } else {
                    alert(err.response?.data?.error || 'An error occurred. Please try again.');
                }
            })
            .finally(() => setLoading(false));
    };

    if (!isOpen || !mounted) return null;

    const progressPercentage = Math.round((step / totalSteps) * 100);
    const todayDateString = new Date().toISOString().split('T')[0];

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/85 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="relative flex flex-col w-full h-[94dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Modern Royal Blue Header */}
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#2563eb] px-4 pt-3.5 pb-3 sm:px-6 sm:py-5 text-white shadow-md">
                    <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-300/15 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-400/10 blur-xl" />

                    {/* Mobile drag bar */}
                    <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/35 sm:hidden" />

                    <div className="relative z-10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-base sm:text-xl font-black tracking-tight text-white">
                                        Complete Your Profile
                                    </h2>
                                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-100 uppercase backdrop-blur-sm">
                                        <Sparkles className="h-3 w-3 text-amber-300" />
                                        1-Time Setup
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs font-medium text-blue-100/85 truncate">
                                    Please provide your student information sheet details to proceed.
                                </p>
                            </div>
                        </div>

                        {/* Progress counter */}
                        <div className="flex shrink-0 flex-col items-end">
                            <span className="text-[10px] font-bold tracking-wider text-blue-200/90 uppercase">
                                Progress
                            </span>
                            <span className="text-sm sm:text-lg font-black text-white">
                                {progressPercentage}%
                            </span>
                        </div>
                    </div>

                    {/* Step Progress Bar */}
                    <div className="mt-3.5 sm:mt-4">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>

                        {/* Desktop Step Navigation Tabs */}
                        <div className="mt-3 hidden grid-cols-4 gap-2 sm:grid">
                            {STEPS.map((s, i) => {
                                const num = i + 1;
                                const isDone = num < step;
                                const isActive = num === step;
                                const canJump = num <= Math.max(step, maxStepReached);

                                return (
                                    <button
                                        key={s.label}
                                        type="button"
                                        onClick={() => canJump && goToStep(num)}
                                        disabled={!canJump}
                                        className={`flex items-center gap-2 rounded-xl p-2 text-left transition-all ${
                                            isActive
                                                ? 'bg-white font-bold text-[#1e3a8a] shadow-md ring-2 ring-white/40'
                                                : isDone
                                                  ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 cursor-pointer'
                                                  : canJump
                                                    ? 'bg-white/10 text-white hover:bg-white/15 cursor-pointer'
                                                    : 'bg-white/5 text-blue-200/50 cursor-not-allowed opacity-60'
                                        }`}
                                    >
                                        <div
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-transform ${
                                                isActive
                                                    ? 'bg-[#1e3a8a] text-white scale-105'
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
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold leading-tight">
                                                {s.shortLabel}
                                            </p>
                                            <p className="truncate text-[10px] font-normal opacity-80">
                                                Required
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mobile Step Header */}
                        <div className="mt-2.5 flex items-center justify-between sm:hidden">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-[11px] font-black text-[#1e3a8a]">
                                    {step}
                                </span>
                                <span className="text-xs font-bold text-white">
                                    {STEPS[step - 1].label}
                                </span>
                                <span className="text-[10px] font-medium text-blue-200/80">
                                    (Required)
                                </span>
                            </div>
                            <span className="text-[11px] font-bold text-white/90">
                                Step {step} of {totalSteps}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Body with Smooth Scroll */}
                <div className="flex-1 min-h-0 space-y-4 sm:space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    
                    {/* Error Banner if any required field is missed */}
                    {Object.keys(errors).length > 0 && (
                        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs font-semibold text-red-700 shadow-sm dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300 animate-in fade-in duration-200">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white">
                                !
                            </span>
                            <div className="flex-1">
                                <p className="font-bold">Please check the required fields:</p>
                                <p className="text-[11px] opacity-90">
                                    {Object.values(errors).flat().join(' • ')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════
                        STEP 1: Personal Info
                    ══════════════════════════════════════════════ */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                        Personal & Contact Information
                                    </h3>
                                </div>
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                    Required fields marked *
                                </span>
                            </div>

                            {/* Home Address */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="pc-home_address"
                                    className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                                >
                                    <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    Home Address <span className="text-red-500">*</span>
                                </Label>
                                <textarea
                                    id="pc-home_address"
                                    value={form.home_address}
                                    onChange={(e) => set('home_address', e.target.value)}
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800"
                                    placeholder="House No., Street, Purok / Barangay, Municipality / City, Province"
                                />
                                <InputError message={errors.home_address?.[0]} />
                            </div>

                            {/* Birthday & Place of Birth */}
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-birthday"
                                        className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                                    >
                                        <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        Date of Birth <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pc-birthday"
                                        type="date"
                                        max={todayDateString}
                                        value={form.birthday}
                                        onChange={(e) => set('birthday', e.target.value)}
                                        className="h-11 rounded-xl border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                                    />
                                    <InputError message={errors.birthday?.[0]} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-place_of_birth"
                                        className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                                    >
                                        <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        Place of Birth <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pc-place_of_birth"
                                        type="text"
                                        value={form.place_of_birth}
                                        onChange={(e) => set('place_of_birth', e.target.value)}
                                        className="h-11 rounded-xl border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                                        placeholder="e.g., Balingasag, Misamis Oriental"
                                    />
                                    <InputError message={errors.place_of_birth?.[0]} />
                                </div>
                            </div>

                            {/* Contact Number & Gender */}
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-contact_no"
                                        className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                                    >
                                        <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        Mobile Contact No. <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pc-contact_no"
                                        type="tel"
                                        maxLength={13}
                                        value={form.contact_no}
                                        onChange={(e) => set('contact_no', formatPhoneNumber(e.target.value))}
                                        className="h-11 rounded-xl border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                                        placeholder="09123456789 or +639123456789"
                                    />
                                    <InputError message={errors.contact_no?.[0]} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
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
                                                     className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all ${
                                                         selected
                                                             ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-sm ring-2 ring-blue-500/20'
                                                             : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700'
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

                            {/* Religion Select Box & Nationality */}
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-religion"
                                        className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                                    >
                                        Religion <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="pc-religion"
                                        value={form.religion}
                                        onChange={(e) => set('religion', e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800"
                                    >
                                        <option value="">Select Religion...</option>
                                        {COMMON_RELIGIONS.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                        {form.religion &&
                                            !COMMON_RELIGIONS.includes(form.religion) &&
                                            form.religion !== 'Other / Prefer not to say' && (
                                                <option value={form.religion}>{form.religion}</option>
                                            )}
                                    </select>
                                    <InputError message={errors.religion?.[0]} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-nationality"
                                        className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                                    >
                                        Nationality <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pc-nationality"
                                        type="text"
                                        value={form.nationality}
                                        onChange={(e) => set('nationality', e.target.value)}
                                        className="h-11 rounded-xl border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                                        placeholder="Filipino"
                                    />
                                    <InputError message={errors.nationality?.[0]} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════
                        STEP 2: Academic Background (Required)
                    ══════════════════════════════════════════════ */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                            Academic Background
                                        </h3>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Type your Elementary start/end year to auto-calculate Year Started & Ended for all 3 levels.
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                    Required
                                </span>
                            </div>

                            {/* Compact 3-School List (All 3 in Full View without Scrolling) */}
                            <div className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-2.5 sm:p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                {/* Table-style header on desktop */}
                                <div className="hidden sm:grid sm:grid-cols-12 sm:gap-2 px-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    <div className="sm:col-span-3">School Level</div>
                                    <div className="sm:col-span-5">School Name <span className="text-red-500">*</span></div>
                                    <div className="sm:col-span-2">Year Started <span className="text-red-500">*</span></div>
                                    <div className="sm:col-span-2 flex items-center justify-between">
                                        <span>Year Ended <span className="text-red-500">*</span></span>
                                        <span className="text-[9px] text-blue-600 font-semibold dark:text-blue-400 lowercase">(auto)</span>
                                    </div>
                                </div>

                                {/* 1. Elementary School */}
                                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-12 sm:gap-2 sm:items-center rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-xs dark:border-slate-700/80 dark:bg-slate-900/60">
                                    <div className="sm:col-span-3 flex items-center gap-2">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-600 text-[10px] font-black text-white shadow-xs">
                                            1
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                Elementary <span className="text-red-500 sm:hidden">*</span>
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">Grades 1–6</span>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-5">
                                        <Input
                                            id="pc-elementary_school"
                                            type="text"
                                            value={form.elementary_school}
                                            onChange={(e) => set('elementary_school', e.target.value)}
                                            className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="Elementary School name"
                                        />
                                        <InputError message={errors.elementary_school?.[0]} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 sm:col-span-4 sm:grid-cols-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase sm:hidden block mb-1">Year Started *</span>
                                            <Input
                                                id="pc-elementary_year_started"
                                                type="number"
                                                min="1900"
                                                max={new Date().getFullYear()}
                                                value={form.elementary_year_started}
                                                onChange={(e) => handleElementaryStartChange(e.target.value)}
                                                className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                placeholder="Start (2012)"
                                            />
                                            <InputError message={errors.elementary_year_started?.[0]} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase sm:hidden block mb-1">Year Ended *</span>
                                            <Input
                                                id="pc-elementary_year_graduated"
                                                type="number"
                                                min="1900"
                                                max={new Date().getFullYear()}
                                                value={form.elementary_year_graduated}
                                                onChange={(e) => handleElementaryEndChange(e.target.value)}
                                                className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                placeholder="End (2018)"
                                            />
                                            <InputError message={errors.elementary_year_graduated?.[0]} />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Junior High School */}
                                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-12 sm:gap-2 sm:items-center rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-xs dark:border-slate-700/80 dark:bg-slate-900/60">
                                    <div className="sm:col-span-3 flex items-center gap-2">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-[10px] font-black text-white shadow-xs">
                                            2
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                Junior High <span className="text-red-500 sm:hidden">*</span>
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">Grades 7–10</span>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-5">
                                        <Input
                                            id="pc-junior_high"
                                            type="text"
                                            value={form.junior_high_school}
                                            onChange={(e) => set('junior_high_school', e.target.value)}
                                            className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="Junior High School name"
                                        />
                                        <InputError message={errors.junior_high_school?.[0]} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 sm:col-span-4 sm:grid-cols-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase sm:hidden block mb-1">Year Started *</span>
                                            <Input
                                                id="pc-junior_year_started"
                                                type="number"
                                                min="1900"
                                                max={new Date().getFullYear()}
                                                value={form.junior_high_year_started}
                                                onChange={(e) => handleJuniorStartChange(e.target.value)}
                                                className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                placeholder="Start (2018)"
                                            />
                                            <InputError message={errors.junior_high_year_started?.[0]} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase sm:hidden block mb-1">Year Ended *</span>
                                            <Input
                                                id="pc-junior_year_graduated"
                                                type="number"
                                                min="1900"
                                                max={new Date().getFullYear()}
                                                value={form.junior_high_year_graduated}
                                                onChange={(e) => handleJuniorEndChange(e.target.value)}
                                                className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                placeholder="End (2022)"
                                            />
                                            <InputError message={errors.junior_high_year_graduated?.[0]} />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Senior High School */}
                                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-12 sm:gap-2 sm:items-center rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-xs dark:border-slate-700/80 dark:bg-slate-900/60">
                                    <div className="sm:col-span-3 flex items-center gap-2">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 text-[10px] font-black text-white shadow-xs">
                                            3
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                Senior High <span className="text-red-500 sm:hidden">*</span>
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">Grades 11–12</span>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-5">
                                        <Input
                                            id="pc-senior_high"
                                            type="text"
                                            value={form.senior_high_school}
                                            onChange={(e) => set('senior_high_school', e.target.value)}
                                            className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="Senior High School name"
                                        />
                                        <InputError message={errors.senior_high_school?.[0]} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 sm:col-span-4 sm:grid-cols-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase sm:hidden block mb-1">Year Started *</span>
                                            <Input
                                                id="pc-senior_year_started"
                                                type="number"
                                                min="1900"
                                                max={new Date().getFullYear()}
                                                value={form.senior_high_year_started}
                                                onChange={(e) => handleSeniorStartChange(e.target.value)}
                                                className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                placeholder="Start (2022)"
                                            />
                                            <InputError message={errors.senior_high_year_started?.[0]} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase sm:hidden block mb-1">Year Ended *</span>
                                            <Input
                                                id="pc-senior_year_graduated"
                                                type="number"
                                                min="1900"
                                                max={new Date().getFullYear()}
                                                value={form.senior_high_year_graduated}
                                                onChange={(e) => handleSeniorEndChange(e.target.value)}
                                                className="h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                placeholder="End (2024)"
                                            />
                                            <InputError message={errors.senior_high_year_graduated?.[0]} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════
                        STEP 3: Family Background (Required)
                    ══════════════════════════════════════════════ */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                        Parents Information
                                    </h3>
                                </div>
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                    Required
                                </span>
                            </div>

                            {/* Helpful Instruction */}
                            <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200">
                                <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <span>
                                    You can provide details for your <strong>Mother</strong>, your <strong>Father</strong>, or <strong>both</strong>. At least one parent's information is required.
                                </span>
                            </div>

                            {/* Mother Information */}
                            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Mother's Details
                                    </h4>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        Fill Mother, Father, or Both
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1">
                                        <Label htmlFor="pc-mother_name" className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                            Mother's Full Name
                                        </Label>
                                        <Input
                                            id="pc-mother_name"
                                            type="text"
                                            value={form.mother_name}
                                            onChange={(e) => set('mother_name', e.target.value)}
                                            className="h-10 rounded-xl border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="e.g., Maria Santos Dela Cruz"
                                        />
                                        <InputError message={errors.mother_name?.[0]} />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="pc-mother_contact" className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                            Mother's Contact Number
                                        </Label>
                                        <Input
                                            id="pc-mother_contact"
                                            type="tel"
                                            maxLength={13}
                                            value={form.mother_contact}
                                            onChange={(e) => set('mother_contact', formatPhoneNumber(e.target.value))}
                                            className="h-10 rounded-xl border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="09123456789 or +639123456789"
                                        />
                                        <InputError message={errors.mother_contact?.[0]} />
                                    </div>
                                </div>
                            </div>

                            {/* Father Information */}
                            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Father's Details
                                    </h4>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        Fill Mother, Father, or Both
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1">
                                        <Label htmlFor="pc-father_name" className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                            Father's Full Name
                                        </Label>
                                        <Input
                                            id="pc-father_name"
                                            type="text"
                                            value={form.father_name}
                                            onChange={(e) => set('father_name', e.target.value)}
                                            className="h-10 rounded-xl border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="e.g., Juan Santos Dela Cruz"
                                        />
                                        <InputError message={errors.father_name?.[0]} />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="pc-father_contact" className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                            Father's Contact Number
                                        </Label>
                                        <Input
                                            id="pc-father_contact"
                                            type="tel"
                                            maxLength={13}
                                            value={form.father_contact}
                                            onChange={(e) => set('father_contact', formatPhoneNumber(e.target.value))}
                                            className="h-10 rounded-xl border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="09123456789 or +639123456789"
                                        />
                                        <InputError message={errors.father_contact?.[0]} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════
                        STEP 4: Emergency Contact (Required)
                    ══════════════════════════════════════════════ */}
                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <HeartHandshake className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                        Emergency Contact Person
                                    </h3>
                                </div>
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                    Required
                                </span>
                            </div>

                            {/* Quick copy buttons if Mother or Father was filled */}
                            {(form.mother_name.trim() || form.father_name.trim()) && (
                                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-blue-50/80 p-3 text-xs dark:bg-blue-950/40">
                                    <span className="font-bold text-blue-950 dark:text-blue-200">
                                        Quick Fill:
                                    </span>
                                    {form.mother_name.trim() && (
                                        <button
                                            type="button"
                                            onClick={copyFromMother}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:bg-slate-800 dark:text-blue-300"
                                        >
                                            <Copy className="h-3 w-3 text-blue-600" />
                                            Use Mother ({form.mother_name})
                                        </button>
                                    )}
                                    {form.father_name.trim() && (
                                        <button
                                            type="button"
                                            onClick={copyFromFather}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:bg-slate-800 dark:text-blue-300"
                                        >
                                            <Copy className="h-3 w-3 text-blue-600" />
                                            Use Father ({form.father_name})
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-800/40">
                                {/* Contact Person Name */}
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-guardian_name"
                                        className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                                    >
                                        <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        Contact Person Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pc-guardian_name"
                                        type="text"
                                        value={form.guardian_name}
                                        onChange={(e) => set('guardian_name', e.target.value)}
                                        className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        placeholder="Full name of parent, legal guardian, or relative"
                                    />
                                    <InputError message={errors.guardian_name?.[0]} />
                                </div>

                                {/* Relationship & Quick Chips */}
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-guardian_relation"
                                        className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                                    >
                                        <HeartHandshake className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        Relationship <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pc-guardian_relation"
                                        type="text"
                                        value={form.guardian_relation}
                                        onChange={(e) => set('guardian_relation', e.target.value)}
                                        className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        placeholder="e.g., Mother, Father, Aunt, Guardian"
                                    />
                                    
                                    {/* Relationship Quick Pills */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                                            Quick pick:
                                        </span>
                                        {COMMON_RELATIONSHIPS.map((rel) => (
                                            <button
                                                key={rel}
                                                type="button"
                                                onClick={() => set('guardian_relation', rel)}
                                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                                    form.guardian_relation.toLowerCase() === rel.toLowerCase()
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                {rel}
                                            </button>
                                        ))}
                                    </div>
                                    <InputError message={errors.guardian_relation?.[0]} />
                                </div>

                                {/* Emergency Contact Number */}
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="pc-guardian_contact"
                                        className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                                    >
                                        <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        Emergency Contact Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pc-guardian_contact"
                                        type="tel"
                                        maxLength={13}
                                        value={form.guardian_contact}
                                        onChange={(e) => set('guardian_contact', formatPhoneNumber(e.target.value))}
                                        className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        placeholder="09123456789 or +639123456789"
                                    />
                                    <InputError message={errors.guardian_contact?.[0]} />
                                </div>
                            </div>

                            {/* Privacy / Safety Notice */}
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
                                <Shield className="h-4 w-4 shrink-0 text-emerald-500" />
                                <span>
                                    Emergency contact details are strictly kept confidential and only accessed by school administration during emergency situations.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dialog Footer Actions */}
                <div className="flex shrink-0 items-center justify-between gap-2.5 border-t border-slate-200/80 bg-slate-50/95 dark:border-slate-800 dark:bg-slate-900/95 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur-sm">
                    {/* Left: Back button */}
                    <div>
                        {step > 1 && (
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={handleBack}
                                disabled={loading}
                                className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 sm:px-5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                Back
                            </Button>
                        )}
                    </div>

                    {/* Right: Next / Submit buttons */}
                    <div className="flex items-center gap-2 sm:gap-3">

                        {step < totalSteps ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={loading}
                                className="h-10 rounded-xl bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#2563eb] px-5 sm:px-6 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.99]"
                            >
                                Next Step
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="h-10 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-5 sm:px-7 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving Profile...
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
        </div>,
        document.body,
    );
}
