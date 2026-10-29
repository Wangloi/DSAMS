import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    AlertCircle,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Edit3,
    FileText,
    GraduationCap,
    HeartHandshake,
    Info,
    Loader2,
    Lock,
    MapPin,
    Phone,
    ShieldAlert,
    Sparkles,
    User,
    Users,
    X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import StudentLayout from '../components/StudentLayout';
import { studentDashboard, studentInformationSheet, studentInformationSheetUpdate } from '@/routes';
import { getRealAcademicYearInfo } from '@/lib/utils';

interface StudentProps {
    id: number;
    name: string;
    email: string;
    student_id: string;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    course?: string | null;
    program?: string | null;
    major?: string | null;
    year_level?: string | null;
    entry_status?: string | null;
    home_address?: string | null;
    birthday?: string | null;
    place_of_birth?: string | null;
    religion?: string | null;
    gender?: string | null;
    contact_no?: string | null;
    nationality?: string | null;
    elementary_school?: string | null;
    elementary_year_started?: number | string | null;
    elementary_year_graduated?: number | string | null;
    junior_high_school?: string | null;
    junior_high_year_started?: number | string | null;
    junior_high_year_graduated?: number | string | null;
    senior_high_school?: string | null;
    senior_high_year_started?: number | string | null;
    senior_high_year_graduated?: number | string | null;
    mother_name?: string | null;
    mother_contact?: string | null;
    father_name?: string | null;
    father_contact?: string | null;
    guardian_name?: string | null;
    guardian_relation?: string | null;
    guardian_contact?: string | null;
}

interface PageProps {
    student: StudentProps;
    flash?: {
        success?: string;
        error?: string;
        status?: string;
    };
    errors?: Record<string, string>;
}

const SheetCheck = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2">
        <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] font-black transition-colors ${
                checked
                    ? 'border-[#0b2d66] bg-[#0b2d66] text-white'
                    : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'
            }`}
        >
            {checked ? '✓' : ''}
        </span>
        <span className={`text-[11px] sm:text-xs ${checked ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
            {label}
        </span>
    </div>
);

const SheetField = ({ label, value, className = '' }: { label: string; value?: React.ReactNode; className?: string }) => (
    <div className={`flex flex-col sm:flex-row sm:items-end gap-0.5 sm:gap-2 text-xs ${className}`}>
        <span className="font-bold shrink-0 text-[#0b2d66] dark:text-blue-400">{label}</span>
        <div className="min-h-[20px] flex-1 border-b border-slate-300 pb-px font-semibold text-slate-900 dark:border-slate-700 dark:text-white break-words">
            {value || <span className="font-normal italic text-slate-400">Not Provided</span>}
        </div>
    </div>
);

const SheetSection = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-5 mb-3 border-b border-dashed border-[#0b2d66] pb-1 text-center text-[10px] font-bold tracking-widest text-[#0b2d66] uppercase sm:mt-6 dark:border-blue-400 dark:text-blue-400">
        {children}
    </div>
);

export default function StudentInformationSheetIndex({ student }: PageProps) {
    const page = usePage();
    const flash = (page.props as any)?.flash;
    const academicYear = getRealAcademicYearInfo().currentAY;

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeEditTab, setActiveEditTab] = useState<'personal' | 'academic' | 'family' | 'emergency'>('personal');

    // Edit form state initialized with student's current values
    const [formData, setFormData] = useState({
        // Personal
        home_address: student.home_address || '',
        birthday: student.birthday || '',
        place_of_birth: student.place_of_birth || '',
        religion: student.religion || '',
        gender: student.gender || 'Male',
        contact_no: student.contact_no || '',
        nationality: student.nationality || 'Filipino',
        middle_name: student.middle_name || '',
        major: student.major || '',

        // Academic
        elementary_school: student.elementary_school || '',
        elementary_year_started: student.elementary_year_started ? String(student.elementary_year_started) : '',
        elementary_year_graduated: student.elementary_year_graduated ? String(student.elementary_year_graduated) : '',
        junior_high_school: student.junior_high_school || '',
        junior_high_year_started: student.junior_high_year_started ? String(student.junior_high_year_started) : '',
        junior_high_year_graduated: student.junior_high_year_graduated ? String(student.junior_high_year_graduated) : '',
        senior_high_school: student.senior_high_school || '',
        senior_high_year_started: student.senior_high_year_started ? String(student.senior_high_year_started) : '',
        senior_high_year_graduated: student.senior_high_year_graduated ? String(student.senior_high_year_graduated) : '',

        // Family
        mother_name: student.mother_name || '',
        mother_contact: student.mother_contact || '',
        father_name: student.father_name || '',
        father_contact: student.father_contact || '',

        // Emergency
        guardian_name: student.guardian_name || '',
        guardian_relation: student.guardian_relation || '',
        guardian_contact: student.guardian_contact || '',
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Keep form data synced when student prop changes
    useEffect(() => {
        setFormData({
            home_address: student.home_address || '',
            birthday: student.birthday || '',
            place_of_birth: student.place_of_birth || '',
            religion: student.religion || '',
            gender: student.gender || 'Male',
            contact_no: student.contact_no || '',
            nationality: student.nationality || 'Filipino',
            middle_name: student.middle_name || '',
            major: student.major || '',

            elementary_school: student.elementary_school || '',
            elementary_year_started: student.elementary_year_started ? String(student.elementary_year_started) : '',
            elementary_year_graduated: student.elementary_year_graduated ? String(student.elementary_year_graduated) : '',
            junior_high_school: student.junior_high_school || '',
            junior_high_year_started: student.junior_high_year_started ? String(student.junior_high_year_started) : '',
            junior_high_year_graduated: student.junior_high_year_graduated ? String(student.junior_high_year_graduated) : '',
            senior_high_school: student.senior_high_school || '',
            senior_high_year_started: student.senior_high_year_started ? String(student.senior_high_year_started) : '',
            senior_high_year_graduated: student.senior_high_year_graduated ? String(student.senior_high_year_graduated) : '',

            mother_name: student.mother_name || '',
            mother_contact: student.mother_contact || '',
            father_name: student.father_name || '',
            father_contact: student.father_contact || '',

            guardian_name: student.guardian_name || '',
            guardian_relation: student.guardian_relation || '',
            guardian_contact: student.guardian_contact || '',
        });
    }, [student]);

    // SweetAlert on flash success or error
    useEffect(() => {
        if (flash?.success || flash?.status) {
            Swal.fire({
                title: 'Success!',
                text: flash.success || flash.status,
                icon: 'success',
                confirmButtonColor: '#0b2d66',
            });
        }
        if (flash?.error) {
            Swal.fire({
                title: 'Notice',
                text: flash.error,
                icon: 'error',
                confirmButtonColor: '#0b2d66',
            });
        }
    }, [flash]);

    // Block printing attempts: Ctrl+P / Cmd+P and beforeprint event
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                showPrintRestrictedAlert();
            }
        };

        const handleBeforePrint = (e: Event) => {
            e.preventDefault();
            showPrintRestrictedAlert();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('beforeprint', handleBeforePrint);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('beforeprint', handleBeforePrint);
        };
    }, []);

    const showPrintRestrictedAlert = () => {
        Swal.fire({
            icon: 'warning',
            title: 'Official Document — Printing Restricted',
            html: `
                <div class="text-left text-xs leading-relaxed text-slate-600">
                    <p class="mb-2"><strong>Notice:</strong> Physical hardcopies of the <strong>Student Information Sheet</strong> bearing the official college dry seal, OSA signature, and PAASCU accreditation are issued exclusively by the <strong>Office of Student Affairs (OSA)</strong>.</p>
                    <p>To acquire an official certified copy for scholarships, board exams, or transfer credentials, please visit the OSA office.</p>
                </div>
            `,
            confirmButtonColor: '#0b2d66',
            confirmButtonText: 'Understood',
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        const phoneRegex = /^(09\d{9}|\+639\d{9})$/;

        // Personal
        if (!formData.home_address.trim()) errors.home_address = 'Home address is required.';
        if (!formData.birthday) errors.birthday = 'Birthday is required.';
        if (!formData.place_of_birth.trim()) errors.place_of_birth = 'Place of birth is required.';
        if (!formData.religion.trim()) errors.religion = 'Religion is required.';
        if (!formData.contact_no.trim()) {
            errors.contact_no = 'Contact number is required.';
        } else if (!phoneRegex.test(formData.contact_no.trim())) {
            errors.contact_no = 'Must be 11 digits (09XXXXXXXXX) or +63 format.';
        }
        if (!formData.nationality.trim()) errors.nationality = 'Nationality is required.';

        // Academic
        if (!formData.elementary_school.trim()) errors.elementary_school = 'Elementary school is required.';
        if (!formData.elementary_year_started) errors.elementary_year_started = 'Start year is required.';
        if (!formData.elementary_year_graduated) {
            errors.elementary_year_graduated = 'Graduation year is required.';
        } else if (Number(formData.elementary_year_graduated) < Number(formData.elementary_year_started)) {
            errors.elementary_year_graduated = 'End year must be ≥ start year.';
        }

        if (!formData.junior_high_school.trim()) errors.junior_high_school = 'Junior high school is required.';
        if (!formData.junior_high_year_started) errors.junior_high_year_started = 'Start year is required.';
        if (!formData.junior_high_year_graduated) {
            errors.junior_high_year_graduated = 'Graduation year is required.';
        } else if (Number(formData.junior_high_year_graduated) < Number(formData.junior_high_year_started)) {
            errors.junior_high_year_graduated = 'End year must be ≥ start year.';
        }

        if (!formData.senior_high_school.trim()) errors.senior_high_school = 'Senior high school is required.';
        if (!formData.senior_high_year_started) errors.senior_high_year_started = 'Start year is required.';
        if (!formData.senior_high_year_graduated) {
            errors.senior_high_year_graduated = 'Graduation year is required.';
        } else if (Number(formData.senior_high_year_graduated) < Number(formData.senior_high_year_started)) {
            errors.senior_high_year_graduated = 'End year must be ≥ start year.';
        }

        // Family Background (At least one parent)
        const hasMother = formData.mother_name.trim() !== '' || formData.mother_contact.trim() !== '';
        const hasFather = formData.father_name.trim() !== '' || formData.father_contact.trim() !== '';

        if (!hasMother && !hasFather) {
            errors.mother_name = 'Please provide details for at least one parent.';
            errors.father_name = 'Please provide details for at least one parent.';
        } else {
            if (hasMother) {
                if (!formData.mother_name.trim()) errors.mother_name = "Mother's name is required.";
                if (!formData.mother_contact.trim()) {
                    errors.mother_contact = "Mother's contact is required.";
                } else if (!phoneRegex.test(formData.mother_contact.trim())) {
                    errors.mother_contact = 'Must be 11 digits (09XXXXXXXXX).';
                }
            }
            if (hasFather) {
                if (!formData.father_name.trim()) errors.father_name = "Father's name is required.";
                if (!formData.father_contact.trim()) {
                    errors.father_contact = "Father's contact is required.";
                } else if (!phoneRegex.test(formData.father_contact.trim())) {
                    errors.father_contact = 'Must be 11 digits (09XXXXXXXXX).';
                }
            }
        }

        // Emergency
        if (!formData.guardian_name.trim()) errors.guardian_name = 'Guardian name is required.';
        if (!formData.guardian_relation.trim()) errors.guardian_relation = 'Relationship is required.';
        if (!formData.guardian_contact.trim()) {
            errors.guardian_contact = 'Emergency contact is required.';
        } else if (!phoneRegex.test(formData.guardian_contact.trim())) {
            errors.guardian_contact = 'Must be 11 digits (09XXXXXXXXX).';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Fields',
                text: 'Please review and fill in all required fields highlighted in red.',
                confirmButtonColor: '#0b2d66',
            });
            return;
        }

        setIsSubmitting(true);

        router.post(studentInformationSheetUpdate(), formData as any, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                setIsEditDialogOpen(false);
                Swal.fire({
                    icon: 'success',
                    title: 'Information Sheet Updated!',
                    text: 'Your student profile information has been successfully updated on your institutional record.',
                    confirmButtonColor: '#0b2d66',
                    timer: 3000,
                });
            },
            onError: (errs) => {
                setIsSubmitting(false);
                setFormErrors(errs);
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: 'Could not update your information sheet. Please verify your entries.',
                    confirmButtonColor: '#0b2d66',
                });
            },
        });
    };

    return (
        <StudentLayout
            breadcrumbs={[
                { title: 'Dashboard', href: studentDashboard() },
                { title: 'Information Sheet', href: studentInformationSheet() },
            ]}
        >
            <Head title="Student Information Sheet" />

            {/* Anti-Print Style: completely hides document content when printing */}
            <style>{`
                @media print {
                    body {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="mx-auto max-w-5xl space-y-4 px-2 sm:space-y-6 sm:px-4 lg:px-6">
                {/* ── TOP HEADER / ACTIONS ── */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0b2d66] dark:bg-blue-900/40 dark:text-blue-300">
                                <FileText className="h-4 w-4" />
                            </span>
                            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl md:text-2xl">
                                Student Information Sheet
                            </h1>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Official institutional student profile on record with the Office of Student Affairs.
                        </p>
                    </div>

                    <div className="flex items-center">
                        <Button
                            type="button"
                            onClick={() => setIsEditDialogOpen(true)}
                            className="w-full cursor-pointer gap-1.5 rounded-xl bg-[#0b2d66] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#08204a] sm:w-auto sm:gap-2"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Update Profile</span>
                        </Button>
                    </div>
                </div>

                {/* ── OFFICIAL ADVISORY NOTICE BANNER ── */}
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs sm:p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 sm:h-5 sm:w-5 dark:text-amber-400" />
                    <div className="space-y-1">
                        <h4 className="font-bold text-amber-900 dark:text-amber-200">
                            Official Document &amp; Hardcopy Advisory
                        </h4>
                        <p className="leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                            This digital record is for viewing and updating your student profile details. 
                            <strong> Official, certified physical copies with the college dry seal and PAASCU accreditation are issued exclusively by the Office of Student Affairs (OSA).</strong> Direct printing and downloading from student accounts is disabled.
                        </p>
                    </div>
                </div>

                {/* ── THE OFFICIAL INFORMATION SHEET CARD ── */}
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 md:p-8 lg:p-10 dark:border-slate-800 dark:bg-slate-900">
                    {/* Institutional Header — Fully Responsive for Mobile, Tablet, and Desktop */}
                    <div className="mb-5 border-b-2 border-[#0b2d66] pb-4 sm:mb-6 sm:pb-5 dark:border-blue-400">
                        <div className="flex items-center justify-between gap-2 sm:gap-4">
                            <img
                                src="/images/SRCB.png"
                                className="h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16 md:h-20 md:w-20"
                                alt="SRCB Logo"
                            />
                            <div className="flex-1 text-center px-1 sm:px-2">
                                <h2 className="text-xs font-black tracking-wide text-[#0b2d66] uppercase sm:text-base md:text-lg dark:text-blue-400">
                                    ST. RITA'S COLLEGE OF BALINGASAG, INC.
                                </h2>
                                <p className="text-[10px] font-bold text-slate-700 sm:text-xs dark:text-slate-300">
                                    Balingasag, Misamis Oriental
                                </p>
                                <p className="text-[9px] text-slate-500 sm:text-[11px]">
                                    Email: ritarian@srcb.edu.ph &bull; Website: www.srcb.edu.ph
                                </p>
                                <p className="mt-0.5 hidden text-[8px] font-semibold text-slate-400 sm:block sm:text-[10px]">
                                    PAASCU Level II Re-Accredited: Junior High School &bull; PAASCU Level I: Teacher Education &amp; Business Admin
                                </p>
                            </div>
                            <img
                                src="/images/DSA.png"
                                className="h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16 md:h-20 md:w-20"
                                alt="DSA Logo"
                            />
                        </div>
                        <p className="mt-1.5 text-center text-[8px] font-medium text-slate-400 sm:hidden">
                            PAASCU Level II Re-Accredited &bull; PAASCU Level I
                        </p>
                    </div>

                    {/* Sheet Title */}
                    <div className="my-4 text-center sm:my-6">
                        <h1 className="text-base font-black tracking-widest text-[#0b2d66] uppercase sm:text-lg md:text-xl dark:text-blue-400">
                            STUDENT INFORMATION SHEET
                        </h1>
                        <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">
                            Academic Year {academicYear}
                        </p>
                    </div>

                    {/* Entry Status, Program & Major Block — Responsive Stacking on Mobile */}
                    <div className="overflow-hidden rounded-xl border border-blue-200 dark:border-slate-700">
                        <div className="flex flex-col border-b border-blue-200 sm:grid sm:grid-cols-[150px_1fr] md:grid-cols-[170px_1fr] dark:border-slate-700">
                            <div className="bg-blue-50/80 p-2.5 text-[10px] font-bold text-[#0b2d66] sm:p-3 sm:text-[11px] dark:bg-slate-800 dark:text-blue-400">
                                ENTRY STATUS
                                <span className="block text-[8px] font-normal text-slate-500 sm:text-[9px]">
                                    (on file)
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-2.5 sm:grid-cols-4 sm:p-3">
                                <SheetCheck
                                    checked={student.year_level === '1st Year'}
                                    label="1st Year"
                                />
                                <SheetCheck
                                    checked={student.year_level === '2nd Year'}
                                    label="2nd Year"
                                />
                                <SheetCheck
                                    checked={student.year_level === '3rd Year'}
                                    label="3rd Year"
                                />
                                <SheetCheck
                                    checked={student.year_level === '4th Year'}
                                    label="4th Year"
                                />
                                <SheetCheck
                                    checked={student.entry_status === 'Freshman'}
                                    label="Freshman"
                                />
                                <SheetCheck
                                    checked={student.entry_status === 'Returnee'}
                                    label="Returnee"
                                />
                                <SheetCheck
                                    checked={student.entry_status === 'Transferee'}
                                    label="Transferee"
                                />
                                <SheetCheck
                                    checked={student.entry_status === 'Old Student'}
                                    label="Old Student"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col border-b border-blue-200 sm:grid sm:grid-cols-[150px_1fr] md:grid-cols-[170px_1fr] dark:border-slate-700">
                            <div className="bg-blue-50/80 p-2.5 text-[10px] font-bold text-[#0b2d66] sm:p-3 sm:text-[11px] dark:bg-slate-800 dark:text-blue-400">
                                PROGRAM
                                <span className="block text-[8px] font-normal text-slate-500 sm:text-[9px]">
                                    (enrolled)
                                </span>
                            </div>
                            <div className="p-2.5 text-xs font-bold text-slate-900 sm:p-3 dark:text-white">
                                {student.program || student.course || 'N/A'}
                            </div>
                        </div>

                        <div className="flex flex-col sm:grid sm:grid-cols-[150px_1fr] md:grid-cols-[170px_1fr]">
                            <div className="bg-blue-50/80 p-2.5 text-[10px] font-bold text-[#0b2d66] sm:p-3 sm:text-[11px] dark:bg-slate-800 dark:text-blue-400">
                                MAJOR
                                <span className="block text-[8px] font-normal text-slate-500 sm:text-[9px]">
                                    (if applicable)
                                </span>
                            </div>
                            <div className="p-2.5 text-xs font-bold text-slate-900 sm:p-3 dark:text-white">
                                {student.major || 'None / General'}
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <SheetSection>Personal Information</SheetSection>
                    <div className="space-y-3 sm:space-y-4">
                        {/* Name Block */}
                        <div>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-2">
                                <span className="text-xs font-bold text-[#0b2d66] dark:text-blue-400">
                                    Name:
                                </span>
                                <div className="grid flex-1 grid-cols-1 gap-2 border-b border-slate-400 pb-1 text-center text-xs font-black text-slate-900 uppercase sm:grid-cols-3 dark:border-slate-600 dark:text-white">
                                    <div>
                                        {student.last_name || 'N/A'}
                                        <span className="block text-[8px] font-normal text-slate-400 lowercase sm:hidden">(surname)</span>
                                    </div>
                                    <div>
                                        {student.first_name || 'N/A'}
                                        <span className="block text-[8px] font-normal text-slate-400 lowercase sm:hidden">(given name)</span>
                                    </div>
                                    <div>
                                        {student.middle_name || '—'}
                                        <span className="block text-[8px] font-normal text-slate-400 lowercase sm:hidden">(middle name)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-0.5 ml-14 hidden grid-cols-3 text-center text-[9px] text-slate-400 sm:grid">
                                <div>(Surname)</div>
                                <div>(Given Name)</div>
                                <div>(Middle Name)</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                            <SheetField label="Student ID:" value={student.student_id} />
                            <SheetField label="Institutional E-mail:" value={student.email} />
                        </div>

                        <SheetField label="Home Address:" value={student.home_address} />

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                            <SheetField label="Birthday:" value={student.birthday} />
                            <SheetField label="Place of Birth:" value={student.place_of_birth} />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
                            <SheetField label="Religion:" value={student.religion} />
                            <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-2 text-xs">
                                <span className="font-bold shrink-0 text-[#0b2d66] dark:text-blue-400">
                                    Gender:
                                </span>
                                <div className="flex flex-1 items-center gap-4 border-b border-slate-300 pb-px dark:border-slate-700">
                                    <SheetCheck
                                        checked={student.gender?.toLowerCase() === 'male'}
                                        label="Male"
                                    />
                                    <SheetCheck
                                        checked={student.gender?.toLowerCase() === 'female'}
                                        label="Female"
                                    />
                                </div>
                            </div>
                            <SheetField label="Contact No.:" value={student.contact_no} />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                            <SheetField
                                label="Nationality:"
                                value={student.nationality || 'Filipino'}
                            />
                            <SheetField
                                label="Verification Status:"
                                value={
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        Approved &amp; Verified
                                    </span>
                                }
                            />
                        </div>
                    </div>

                    {/* Academic Background */}
                    <SheetSection>Academic Background</SheetSection>

                    {/* Desktop & Tablet Table (>= 640px) */}
                    <div className="hidden sm:block overflow-hidden rounded-xl border border-blue-200 dark:border-slate-700">
                        <div className="grid grid-cols-[140px_1fr_140px] md:grid-cols-[170px_1fr_160px] bg-blue-50/80 text-center text-[10px] font-bold text-[#0b2d66] dark:bg-slate-800 dark:text-blue-400">
                            <div className="p-2.5">LEVEL</div>
                            <div className="border-l border-blue-200 p-2.5 dark:border-slate-700">
                                SCHOOL ATTENDED
                            </div>
                            <div className="border-l border-blue-200 p-2.5 dark:border-slate-700">
                                YEARS (ATTENDED &ndash; ENDED)
                            </div>
                        </div>
                        {[
                            {
                                level: 'Elementary',
                                school: student.elementary_school,
                                start: student.elementary_year_started,
                                end: student.elementary_year_graduated,
                            },
                            {
                                level: 'Junior High School',
                                school: student.junior_high_school,
                                start: student.junior_high_year_started,
                                end: student.junior_high_year_graduated,
                            },
                            {
                                level: 'Senior High School',
                                school: student.senior_high_school,
                                start: student.senior_high_year_started,
                                end: student.senior_high_year_graduated,
                            },
                        ].map(({ level, school, start, end }) => (
                            <div
                                key={level}
                                className="grid grid-cols-[140px_1fr_140px] md:grid-cols-[170px_1fr_160px] border-t border-blue-200 text-xs dark:border-slate-700"
                            >
                                <div className="bg-blue-50/50 p-2.5 font-bold text-[#0b2d66] dark:bg-slate-800/60 dark:text-blue-400">
                                    {level}
                                </div>
                                <div className="border-l border-blue-200 p-2.5 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                                    {school || <span className="italic text-slate-400">Not Provided</span>}
                                </div>
                                <div className="border-l border-blue-200 p-2.5 text-center font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                                    {start && end ? `${start} – ${end}` : (end || 'N/A')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile Card List (< 640px) */}
                    <div className="space-y-2.5 sm:hidden">
                        {[
                            {
                                level: 'Elementary School',
                                school: student.elementary_school,
                                start: student.elementary_year_started,
                                end: student.elementary_year_graduated,
                            },
                            {
                                level: 'Junior High School',
                                school: student.junior_high_school,
                                start: student.junior_high_year_started,
                                end: student.junior_high_year_graduated,
                            },
                            {
                                level: 'Senior High School',
                                school: student.senior_high_school,
                                start: student.senior_high_year_started,
                                end: student.senior_high_year_graduated,
                            },
                        ].map(({ level, school, start, end }) => (
                            <div
                                key={level}
                                className="rounded-xl border border-blue-100 bg-blue-50/30 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#0b2d66] dark:text-blue-400">{level}</span>
                                    <span className="rounded-md bg-blue-100/70 px-2 py-0.5 text-[10px] font-bold text-blue-900 dark:bg-slate-700 dark:text-blue-300">
                                        {start && end ? `${start} – ${end}` : (end || 'N/A')}
                                    </span>
                                </div>
                                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                    {school || <span className="font-normal italic text-slate-400">Not Provided</span>}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Family Background */}
                    <SheetSection>Family Background</SheetSection>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                            <SheetField label="Mother's Name:" value={student.mother_name} />
                            <SheetField
                                label="Mother's Contact:"
                                value={student.mother_contact}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                            <SheetField label="Father's Name:" value={student.father_name} />
                            <SheetField
                                label="Father's Contact:"
                                value={student.father_contact}
                            />
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <SheetSection>Emergency Contact</SheetSection>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
                            <SheetField
                                label="Guardian Name:"
                                value={student.guardian_name}
                            />
                            <SheetField
                                label="Relationship:"
                                value={student.guardian_relation}
                            />
                            <SheetField
                                label="Contact Number:"
                                value={student.guardian_contact}
                            />
                        </div>
                    </div>

                    {/* Signature */}
                    <div className="mt-8 text-center sm:mt-12">
                        <div className="mx-auto max-w-[280px] border-b-2 border-slate-400 pb-1 text-xs font-black text-[#0b2d66] uppercase sm:max-w-xs sm:text-sm dark:border-slate-500 dark:text-blue-400">
                            {student.name}
                        </div>
                        <div className="mt-1.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase sm:text-[10px]">
                            Student Digital Signature / Record Authentication
                        </div>
                        <div className="mt-0.5 text-[8px] text-slate-400 sm:text-[9px]">
                            SRCB Office of Student Affairs &bull; Secure Digital Archive
                        </div>
                    </div>
                </div>
            </div>

            {/* ── UPDATE INFORMATION SHEET MODAL — Fully Responsive ── */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent size="xl" className="max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-black text-[#0b2d66] sm:text-lg dark:text-blue-400">
                            <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
                            Update Student Information Sheet
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Keep your personal contact, educational history, and guardian records up to date.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tab Selector — Horizontally scrollable on mobile */}
                    <div className="flex overflow-x-auto border-b border-slate-200 no-scrollbar dark:border-slate-800">
                        {[
                            { key: 'personal', label: 'Personal', fullLabel: 'Personal Info', icon: User },
                            { key: 'academic', label: 'Academic', fullLabel: 'Academic History', icon: GraduationCap },
                            { key: 'family', label: 'Parents', fullLabel: 'Family Background', icon: Users },
                            { key: 'emergency', label: 'Emergency', fullLabel: 'Emergency Contact', icon: HeartHandshake },
                        ].map(({ key, label, fullLabel, icon: TabIcon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveEditTab(key as any)}
                                className={`flex shrink-0 flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold transition-colors ${
                                    activeEditTab === key
                                        ? 'border-[#0b2d66] text-[#0b2d66] dark:border-blue-400 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <TabIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="sm:hidden">{label}</span>
                                <span className="hidden sm:inline">{fullLabel}</span>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmitEdit} className="space-y-4 pt-2">
                        {/* ── TAB 1: PERSONAL INFO ── */}
                        {activeEditTab === 'personal' && (
                            <div className="space-y-3.5">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-xs font-semibold">Middle Name (Optional)</Label>
                                        <Input
                                            value={formData.middle_name}
                                            onChange={(e) => handleInputChange('middle_name', e.target.value)}
                                            placeholder="e.g. Dela Cruz"
                                            className="mt-1 text-sm sm:text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">Major (if applicable)</Label>
                                        <Input
                                            value={formData.major}
                                            onChange={(e) => handleInputChange('major', e.target.value)}
                                            placeholder="e.g. Financial Management"
                                            className="mt-1 text-sm sm:text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold">
                                        Home Address <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        value={formData.home_address}
                                        onChange={(e) => handleInputChange('home_address', e.target.value)}
                                        placeholder="Purok, Barangay, Municipality, Province"
                                        className={`mt-1 text-sm sm:text-xs ${formErrors.home_address ? 'border-rose-500' : ''}`}
                                    />
                                    {formErrors.home_address && (
                                        <p className="mt-1 text-[11px] text-rose-500">{formErrors.home_address}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-xs font-semibold">
                                            Birthday <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            type="date"
                                            value={formData.birthday}
                                            onChange={(e) => handleInputChange('birthday', e.target.value)}
                                            className={`mt-1 text-sm sm:text-xs ${formErrors.birthday ? 'border-rose-500' : ''}`}
                                        />
                                        {formErrors.birthday && (
                                            <p className="mt-1 text-[11px] text-rose-500">{formErrors.birthday}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold">
                                            Place of Birth <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            value={formData.place_of_birth}
                                            onChange={(e) => handleInputChange('place_of_birth', e.target.value)}
                                            placeholder="City / Municipality"
                                            className={`mt-1 text-sm sm:text-xs ${formErrors.place_of_birth ? 'border-rose-500' : ''}`}
                                        />
                                        {formErrors.place_of_birth && (
                                            <p className="mt-1 text-[11px] text-rose-500">{formErrors.place_of_birth}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div>
                                        <Label className="text-xs font-semibold">
                                            Gender <span className="text-rose-500">*</span>
                                        </Label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:text-xs font-medium dark:border-slate-700 dark:bg-slate-900"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold">
                                            Religion <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            value={formData.religion}
                                            onChange={(e) => handleInputChange('religion', e.target.value)}
                                            placeholder="e.g. Roman Catholic"
                                            className={`mt-1 text-sm sm:text-xs ${formErrors.religion ? 'border-rose-500' : ''}`}
                                        />
                                        {formErrors.religion && (
                                            <p className="mt-1 text-[11px] text-rose-500">{formErrors.religion}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold">
                                            Contact No. <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            value={formData.contact_no}
                                            onChange={(e) => handleInputChange('contact_no', e.target.value)}
                                            placeholder="09XXXXXXXXX"
                                            className={`mt-1 text-sm sm:text-xs ${formErrors.contact_no ? 'border-rose-500' : ''}`}
                                        />
                                        {formErrors.contact_no && (
                                            <p className="mt-1 text-[11px] text-rose-500">{formErrors.contact_no}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold">
                                        Nationality <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        value={formData.nationality}
                                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                                        placeholder="e.g. Filipino"
                                        className={`mt-1 text-sm sm:text-xs ${formErrors.nationality ? 'border-rose-500' : ''}`}
                                    />
                                    {formErrors.nationality && (
                                        <p className="mt-1 text-[11px] text-rose-500">{formErrors.nationality}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── TAB 2: ACADEMIC BACKGROUND ── */}
                        {activeEditTab === 'academic' && (
                            <div className="space-y-4">
                                {/* Elementary */}
                                <div className="rounded-xl border border-slate-200 p-3 sm:p-3.5 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-[#0b2d66] dark:text-blue-400">
                                        Elementary School
                                    </h4>
                                    <div className="mt-2 space-y-2">
                                        <div>
                                            <Label className="text-[11px]">School Name</Label>
                                            <Input
                                                value={formData.elementary_school}
                                                onChange={(e) => handleInputChange('elementary_school', e.target.value)}
                                                placeholder="Elementary school name"
                                                className={`mt-1 text-sm sm:text-xs ${formErrors.elementary_school ? 'border-rose-500' : ''}`}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                                            <div>
                                                <Label className="text-[11px]">Year Started</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.elementary_year_started}
                                                    onChange={(e) => handleInputChange('elementary_year_started', e.target.value)}
                                                    placeholder="e.g. 2010"
                                                    className={`mt-1 text-sm sm:text-xs ${formErrors.elementary_year_started ? 'border-rose-500' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[11px]">Year Graduated</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.elementary_year_graduated}
                                                    onChange={(e) => handleInputChange('elementary_year_graduated', e.target.value)}
                                                    placeholder="e.g. 2016"
                                                    className={`mt-1 text-sm sm:text-xs ${formErrors.elementary_year_graduated ? 'border-rose-500' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Junior High */}
                                <div className="rounded-xl border border-slate-200 p-3 sm:p-3.5 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-[#0b2d66] dark:text-blue-400">
                                        Junior High School
                                    </h4>
                                    <div className="mt-2 space-y-2">
                                        <div>
                                            <Label className="text-[11px]">School Name</Label>
                                            <Input
                                                value={formData.junior_high_school}
                                                onChange={(e) => handleInputChange('junior_high_school', e.target.value)}
                                                placeholder="Junior high school name"
                                                className={`mt-1 text-sm sm:text-xs ${formErrors.junior_high_school ? 'border-rose-500' : ''}`}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                                            <div>
                                                <Label className="text-[11px]">Year Started</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.junior_high_year_started}
                                                    onChange={(e) => handleInputChange('junior_high_year_started', e.target.value)}
                                                    placeholder="e.g. 2016"
                                                    className={`mt-1 text-sm sm:text-xs ${formErrors.junior_high_year_started ? 'border-rose-500' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[11px]">Year Graduated</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.junior_high_year_graduated}
                                                    onChange={(e) => handleInputChange('junior_high_year_graduated', e.target.value)}
                                                    placeholder="e.g. 2020"
                                                    className={`mt-1 text-sm sm:text-xs ${formErrors.junior_high_year_graduated ? 'border-rose-500' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Senior High */}
                                <div className="rounded-xl border border-slate-200 p-3 sm:p-3.5 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-[#0b2d66] dark:text-blue-400">
                                        Senior High School
                                    </h4>
                                    <div className="mt-2 space-y-2">
                                        <div>
                                            <Label className="text-[11px]">School Name</Label>
                                            <Input
                                                value={formData.senior_high_school}
                                                onChange={(e) => handleInputChange('senior_high_school', e.target.value)}
                                                placeholder="Senior high school name"
                                                className={`mt-1 text-sm sm:text-xs ${formErrors.senior_high_school ? 'border-rose-500' : ''}`}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                                            <div>
                                                <Label className="text-[11px]">Year Started</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.senior_high_year_started}
                                                    onChange={(e) => handleInputChange('senior_high_year_started', e.target.value)}
                                                    placeholder="e.g. 2020"
                                                    className={`mt-1 text-sm sm:text-xs ${formErrors.senior_high_year_started ? 'border-rose-500' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[11px]">Year Graduated</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.senior_high_year_graduated}
                                                    onChange={(e) => handleInputChange('senior_high_year_graduated', e.target.value)}
                                                    placeholder="e.g. 2022"
                                                    className={`mt-1 text-sm sm:text-xs ${formErrors.senior_high_year_graduated ? 'border-rose-500' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 3: FAMILY BACKGROUND ── */}
                        {activeEditTab === 'family' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-500">
                                    Please provide information for at least one parent (Mother or Father).
                                </p>

                                {/* Mother */}
                                <div className="rounded-xl border border-slate-200 p-3 sm:p-3.5 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-[#0b2d66] dark:text-blue-400">
                                        Mother's Information
                                    </h4>
                                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <Label className="text-[11px]">Full Name</Label>
                                            <Input
                                                value={formData.mother_name}
                                                onChange={(e) => handleInputChange('mother_name', e.target.value)}
                                                placeholder="Mother's full name"
                                                className={`mt-1 text-sm sm:text-xs ${formErrors.mother_name ? 'border-rose-500' : ''}`}
                                            />
                                            {formErrors.mother_name && (
                                                <p className="mt-1 text-[11px] text-rose-500">{formErrors.mother_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-[11px]">Contact Number</Label>
                                            <Input
                                                value={formData.mother_contact}
                                                onChange={(e) => handleInputChange('mother_contact', e.target.value)}
                                                placeholder="09XXXXXXXXX"
                                                className={`mt-1 text-sm sm:text-xs ${formErrors.mother_contact ? 'border-rose-500' : ''}`}
                                            />
                                            {formErrors.mother_contact && (
                                                <p className="mt-1 text-[11px] text-rose-500">{formErrors.mother_contact}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Father */}
                                <div className="rounded-xl border border-slate-200 p-3 sm:p-3.5 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-[#0b2d66] dark:text-blue-400">
                                        Father's Information
                                    </h4>
                                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <Label className="text-[11px]">Full Name</Label>
                                            <Input
                                                value={formData.father_name}
                                                onChange={(e) => handleInputChange('father_name', e.target.value)}
                                                placeholder="Father's full name"
                                                className={`mt-1 text-sm sm:text-xs ${formErrors.father_name ? 'border-rose-500' : ''}`}
                                            />
                                            {formErrors.father_name && (
                                                <p className="mt-1 text-[11px] text-rose-500">{formErrors.father_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-[11px]">Contact Number</Label>
                                            <Input
                                                value={formData.father_contact}
                                                onChange={(e) => handleInputChange('father_contact', e.target.value)}
                                                placeholder="09XXXXXXXXX"
                                                className={`mt-1 text-sm sm:text-xs ${formErrors.father_contact ? 'border-rose-500' : ''}`}
                                            />
                                            {formErrors.father_contact && (
                                                <p className="mt-1 text-[11px] text-rose-500">{formErrors.father_contact}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 4: EMERGENCY CONTACT ── */}
                        {activeEditTab === 'emergency' && (
                            <div className="space-y-3.5">
                                <p className="text-xs text-slate-500">
                                    Designated guardian or family member to notify in case of institutional emergency or injury.
                                </p>

                                <div>
                                    <Label className="text-xs font-semibold">
                                        Guardian / Emergency Contact Name <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        value={formData.guardian_name}
                                        onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                                        placeholder="Full name of emergency guardian"
                                        className={`mt-1 text-sm sm:text-xs ${formErrors.guardian_name ? 'border-rose-500' : ''}`}
                                    />
                                    {formErrors.guardian_name && (
                                        <p className="mt-1 text-[11px] text-rose-500">{formErrors.guardian_name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-xs font-semibold">
                                            Relationship <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            value={formData.guardian_relation}
                                            onChange={(e) => handleInputChange('guardian_relation', e.target.value)}
                                            placeholder="e.g. Mother, Uncle, Grandparent"
                                            className={`mt-1 text-sm sm:text-xs ${formErrors.guardian_relation ? 'border-rose-500' : ''}`}
                                        />
                                        {formErrors.guardian_relation && (
                                            <p className="mt-1 text-[11px] text-rose-500">{formErrors.guardian_relation}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold">
                                            Contact Number <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            value={formData.guardian_contact}
                                            onChange={(e) => handleInputChange('guardian_contact', e.target.value)}
                                            placeholder="09XXXXXXXXX"
                                            className={`mt-1 text-sm sm:text-xs ${formErrors.guardian_contact ? 'border-rose-500' : ''}`}
                                        />
                                        {formErrors.guardian_contact && (
                                            <p className="mt-1 text-[11px] text-rose-500">{formErrors.guardian_contact}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                disabled={isSubmitting}
                                className="w-full cursor-pointer sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full cursor-pointer gap-2 bg-[#0b2d66] text-white hover:bg-[#08204a] sm:w-auto"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Save &amp; Update Record
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </StudentLayout>
    );
}
