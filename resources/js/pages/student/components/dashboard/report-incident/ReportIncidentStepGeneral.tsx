import React from 'react';
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
import { placeOptions, type ViolationOption } from '../types';
import type { ReportIncidentFormData } from './types';

interface ReportIncidentStepGeneralProps {
    reportForm: ReportIncidentFormData;
    setReportForm: React.Dispatch<React.SetStateAction<ReportIncidentFormData>>;
    violations: ViolationOption[];
    reportErrors: Record<string, string>;
    hasCustomPlace: boolean;
}

export function ReportIncidentStepGeneral({
    reportForm,
    setReportForm,
    violations,
    reportErrors,
    hasCustomPlace,
}: ReportIncidentStepGeneralProps) {
    const sections = ['Warning', 'Suspension', 'Exclusion', 'Expulsion'] as const;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                    <Label className="text-slate-700 dark:text-slate-300">
                        Violation <span className="text-red-500">*</span>
                    </Label>
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
                        }}
                        required
                    >
                        <SelectTrigger className="border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700">
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
                    {reportErrors.violation_id && (
                        <p className="text-xs text-red-500">
                            {reportErrors.violation_id}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="incident_date"
                        className="text-slate-700 dark:text-slate-300"
                    >
                        Date of Incident <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="incident_date"
                        type="date"
                        value={reportForm.incident_date}
                        onChange={(e) =>
                            setReportForm((prev) => ({
                                ...prev,
                                incident_date: e.target.value,
                            }))
                        }
                        className="border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        required
                    />
                    {reportErrors.incident_date && (
                        <p className="text-xs text-red-500">
                            {reportErrors.incident_date}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="incident_time"
                        className="text-slate-700 dark:text-slate-300"
                    >
                        Time of Incident <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="incident_time"
                        type="time"
                        value={reportForm.incident_time}
                        onChange={(e) =>
                            setReportForm((prev) => ({
                                ...prev,
                                incident_time: e.target.value,
                            }))
                        }
                        className="border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        required
                    />
                    {reportErrors.incident_time && (
                        <p className="text-xs text-red-500">
                            {reportErrors.incident_time}
                        </p>
                    )}
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label
                        htmlFor="location"
                        className="text-slate-700 dark:text-slate-300"
                    >
                        Location <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={reportForm.location}
                        onValueChange={(v) =>
                            setReportForm((prev) => ({
                                ...prev,
                                location: v,
                            }))
                        }
                        required
                    >
                        <SelectTrigger
                            id="location"
                            className="h-11 rounded-xl border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
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
                    {reportErrors.location && (
                        <p className="text-xs text-red-500">
                            {reportErrors.location}
                        </p>
                    )}
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label
                        htmlFor="reported_by"
                        className="text-slate-700 dark:text-slate-300"
                    >
                        Reported By (Name/Position){' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="reported_by"
                        value={reportForm.reported_by}
                        onChange={(e) =>
                            setReportForm((prev) => ({
                                ...prev,
                                reported_by: e.target.value,
                            }))
                        }
                        placeholder="Your name and position"
                        className="border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        required
                    />
                    {reportErrors.reported_by && (
                        <p className="text-xs text-red-500">
                            {reportErrors.reported_by}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
