import React, { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { FormRequiredNotice } from '@/components/ui/form-required-notice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Lock,
    MapPin,
    Shield,
    ShieldAlert,
    ShieldCheck,
    UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { placeOptions, type ViolationOption } from '../types';
import type { ReportIncidentFormData } from './types';

interface ReportIncidentStepGeneralProps {
    reportForm: ReportIncidentFormData;
    setReportForm: React.Dispatch<React.SetStateAction<ReportIncidentFormData>>;
    violations: ViolationOption[];
    reportErrors: Record<string, string>;
    hasCustomPlace: boolean;
    clearFieldError?: (key: string) => void;
    setFieldError?: (key: string, error: string) => void;
}

export function ReportIncidentStepGeneral({
    reportForm,
    setReportForm,
    violations,
    reportErrors,
    hasCustomPlace,
    clearFieldError,
    setFieldError,
}: ReportIncidentStepGeneralProps) {
    const page = usePage();
    const authUser = (page.props as any)?.auth?.user;

    const authReporterIdentity = useMemo(() => {
        if (!authUser?.name) return 'Authenticated Student';
        return authUser.student_id
            ? `${authUser.name} (${authUser.student_id})`
            : authUser.name;
    }, [authUser]);

    const isAnonymous = Boolean(reportForm.is_anonymous);
    const displayReportedBy = isAnonymous
        ? 'Anonymous Student'
        : reportForm.reported_by || authReporterIdentity;

    const sections = ['Warning', 'Suspension', 'Exclusion', 'Expulsion'] as const;

    return (
        <div className="space-y-4">
            <FormRequiredNotice message="Fields marked with * or Required must be completed." />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-1.5 md:col-span-2">
                    <Label
                        htmlFor="violation_select"
                        required
                        showRequiredBadge
                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                    >
                        Violation
                    </Label>
                    <div className="relative">
                        <ShieldAlert className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
                        <Select
                            value={
                                reportForm.violation_id
                                    ? String(reportForm.violation_id)
                                    : ''
                            }
                            onValueChange={(v) => {
                                const violation = violations.find(
                                    (x) => x.id === Number(v),
                                );
                                setReportForm((prev) => ({
                                    ...prev,
                                    violation_id: violation ? violation.id : null,
                                    incident_type: violation
                                        ? violation.name
                                        : prev.incident_type,
                                    classification: violation
                                        ? (violation.section as any)
                                        : prev.classification,
                                }));
                                clearFieldError?.('violation_id');
                            }}
                            required
                        >
                            <SelectTrigger
                                id="violation_select"
                                hasError={!!reportErrors.violation_id}
                                aria-describedby={reportErrors.violation_id ? "violation_select-error" : undefined}
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                            >
                                <SelectValue placeholder="Select violation" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map((section, idx, arr) => {
                                    const sectionViolations = violations.filter(
                                        (v) => v.section === section,
                                    );
                                    if (sectionViolations.length === 0) return null;
                                    return (
                                        <React.Fragment key={section}>
                                            <SelectGroup key={section}>
                                                <SelectLabel className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                    {section} Infractions
                                                </SelectLabel>
                                                {sectionViolations.map((violation) => (
                                                    <SelectItem
                                                        key={violation.id}
                                                        value={String(violation.id)}
                                                        className="pl-4"
                                                    >
                                                        {violation.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                            {idx < arr.length - 1 && (
                                                <SelectSeparator
                                                    key={`sep-${section}`}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <InputError id="violation_select-error" message={reportErrors.violation_id} />
                </div>

                <div className="grid gap-1.5">
                    <Label
                        htmlFor="incident_date"
                        required
                        showRequiredBadge
                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                    >
                        Date of Incident
                    </Label>
                    <div className="relative">
                        <Calendar className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            id="incident_date"
                            type="date"
                            value={reportForm.incident_date}
                            hasError={!!reportErrors.incident_date}
                            aria-describedby={reportErrors.incident_date ? "incident_date-error" : undefined}
                            onChange={(e) => {
                                setReportForm((prev) => ({
                                    ...prev,
                                    incident_date: e.target.value,
                                }));
                                clearFieldError?.('incident_date');
                            }}
                            onBlur={() => {
                                if (!reportForm.incident_date) {
                                    setFieldError?.(
                                        'incident_date',
                                        'Date of incident is required.',
                                    );
                                }
                            }}
                            className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-semibold tracking-wide text-slate-800 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                            required
                        />
                    </div>
                    <InputError id="incident_date-error" message={reportErrors.incident_date} />
                </div>

                <div className="grid gap-1.5">
                    <Label
                        htmlFor="incident_time"
                        required
                        showRequiredBadge
                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                    >
                        Time of Incident
                    </Label>
                    <div className="relative">
                        <Clock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            id="incident_time"
                            type="time"
                            value={reportForm.incident_time}
                            hasError={!!reportErrors.incident_time}
                            aria-describedby={reportErrors.incident_time ? "incident_time-error" : undefined}
                            onChange={(e) => {
                                setReportForm((prev) => ({
                                    ...prev,
                                    incident_time: e.target.value,
                                }));
                                clearFieldError?.('incident_time');
                            }}
                            onBlur={() => {
                                if (!reportForm.incident_time) {
                                    setFieldError?.(
                                        'incident_time',
                                        'Time of incident is required.',
                                    );
                                }
                            }}
                            className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-semibold tracking-wide text-slate-800 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                            required
                        />
                    </div>
                    <InputError id="incident_time-error" message={reportErrors.incident_time} />
                </div>

                <div className="grid gap-1.5 md:col-span-2">
                    <Label
                        htmlFor="location"
                        required
                        showRequiredBadge
                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                    >
                        Location
                    </Label>
                    <div className="relative">
                        <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
                        <Select
                            value={reportForm.location}
                            onValueChange={(v) => {
                                setReportForm((prev) => ({
                                    ...prev,
                                    location: v,
                                }));
                                clearFieldError?.('location');
                            }}
                            required
                        >
                            <SelectTrigger
                                id="location"
                                hasError={!!reportErrors.location}
                                aria-describedby={reportErrors.location ? "location-error" : undefined}
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                            >
                                <SelectValue placeholder="Select place" />
                            </SelectTrigger>
                            <SelectContent>
                                {hasCustomPlace && (
                                    <SelectItem value={reportForm.location}>
                                        {reportForm.location}
                                    </SelectItem>
                                )}
                                {placeOptions.map((place) => (
                                    <SelectItem key={place} value={place}>
                                        {place}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <InputError id="location-error" message={reportErrors.location} />
                </div>

                {/* Reporting Mode Selection (Identified vs Anonymous) */}
                <div className="grid gap-2.5 md:col-span-2">
                    <Label
                        required
                        showRequiredBadge
                        className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                        <span>Reporting Mode</span>
                        <span className="text-[10px] font-semibold text-slate-400">
                            Choose between identified or anonymous submission
                        </span>
                    </Label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* Identified Option Card */}
                        <button
                            type="button"
                            onClick={() => {
                                setReportForm((prev) => ({
                                    ...prev,
                                    is_anonymous: false,
                                    reported_by: authReporterIdentity,
                                }));
                            }}
                            className={cn(
                                'relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3.5 text-left transition-all duration-200 select-none',
                                !isAnonymous
                                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800',
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            'flex h-7 w-7 items-center justify-center rounded-lg',
                                            !isAnonymous
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                                        )}
                                    >
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        Standard Identified Report
                                    </span>
                                </div>
                                {!isAnonymous ? (
                                    <Badge className="border-blue-300 bg-blue-100 text-[9px] font-bold text-blue-800 dark:border-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Active
                                    </Badge>
                                ) : (
                                    <span className="text-[10px] font-medium text-slate-400">
                                        Standard
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                                Submits with your verified student name and student ID attached to the official incident docket.
                            </p>
                        </button>

                        {/* Submit Anonymously Option Card */}
                        <button
                            type="button"
                            onClick={() => {
                                setReportForm((prev) => ({
                                    ...prev,
                                    is_anonymous: true,
                                    reported_by: 'Anonymous Student',
                                }));
                            }}
                            className={cn(
                                'relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3.5 text-left transition-all duration-200 select-none',
                                isAnonymous
                                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/40'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800',
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            'flex h-7 w-7 items-center justify-center rounded-lg',
                                            isAnonymous
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                                        )}
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        Submit Anonymously
                                    </span>
                                </div>
                                {isAnonymous ? (
                                    <Badge className="border-emerald-300 bg-emerald-100 text-[9px] font-black uppercase text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                        <ShieldCheck className="mr-1 h-3 w-3" />
                                        Protected
                                    </Badge>
                                ) : (
                                    <span className="text-[10px] font-medium text-slate-400">
                                        Mask Identity
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                                Conceals your personal identity from report viewers and public summaries under strict student privacy rules.
                            </p>
                        </button>
                    </div>
                </div>

                {/* Populated & Locked Reported By Field */}
                <div className="grid gap-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="reported_by"
                            required
                            showRequiredBadge
                            className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                        >
                            Reported By
                        </Label>
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                            {isAnonymous ? (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <Shield className="h-3 w-3" />
                                    Masked Under Privacy Policy
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                    <Lock className="h-3 w-3" />
                                    Locked to Authenticated Account
                                </span>
                            )}
                        </span>
                    </div>

                    <div className="relative">
                        {isAnonymous ? (
                            <ShieldCheck className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <UserCheck className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-blue-600 dark:text-blue-400" />
                        )}
                        <Input
                            id="reported_by"
                            name="reported_by"
                            value={displayReportedBy}
                            readOnly
                            disabled
                            aria-readonly="true"
                            className={cn(
                                'h-10 cursor-not-allowed rounded-xl pl-10 text-sm font-semibold tracking-wide select-none transition-colors',
                                isAnonymous
                                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                                    : 'border-slate-200 bg-slate-100/90 text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200',
                            )}
                        />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {isAnonymous
                            ? 'Identity protected: Displayed as Anonymous Student on administrative dockets and reports. Secure audit accountability is maintained in restricted system logs.'
                            : 'Automatically populated from your authenticated session. Entering another person\'s identity is prohibited to prevent false claims.'}
                    </p>
                    {reportErrors.reported_by && (
                        <p className="text-xs font-medium text-red-500">
                            {reportErrors.reported_by}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
