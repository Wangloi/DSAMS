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
import type { IncidentReportPayload, Violation } from './types';

type Props = {
    form: IncidentReportPayload;
    onChange: (patch: Partial<IncidentReportPayload>) => void;
    isViewMode: boolean;
    violations: Violation[];
};

const placeOptions = [
    'Main Gate',
    'Gate 1',
    'Back Gate',
    'Cafeteria',
    'Canteen',
    'Gymnasium',
    'Back of Gym',
    'Outer Ground',
    'Inner Ground',
    'Parents Lounge',
    'Chapel',
    'College Library',
    'Dean of Students Affairs',
    'Registrar',
    'Finance - Cashier',
    'School Clinic',
    'Guidance Office',
    'IT Laboratory',
    'Computer Laboratory',
    'Speech Laboratory',
    'Audio Visual Room',
    'Lecture Room 101',
    'Room 101',
    'Room 205',
    'Room 302',
    'CR Room 302',
];



export default function IncidentReportDialogDetails({ form, onChange, isViewMode, violations }: Props) {
    const hasCustomPlace = Boolean(form.location) && !placeOptions.includes(form.location);

    // Handle violation selection
    const handleViolationChange = (violationId: string) => {
        const selectedViolation = violations.find(v => v.id === Number(violationId));
        if (selectedViolation) {
            onChange({
                violationId: selectedViolation.id,
                incidentType: selectedViolation.name,
                classification: selectedViolation.section,
            });
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">
                    Violation <span className="text-red-500">*</span>
                </Label>
                <Select 
                    value={form.violationId ? String(form.violationId) : ''} 
                    onValueChange={handleViolationChange} 
                    disabled={isViewMode}
                    required
                >
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                        <SelectValue placeholder="Select violation" />
                    </SelectTrigger>
                    <SelectContent>
                        {['Warning', 'Suspension', 'Exclusion', 'Expulsion'].map((section, idx, arr) => {
                            const sectionViolations = violations.filter((v) => v.section === section);
                            if (sectionViolations.length === 0) return null;
                            return (
                                <SelectGroup key={section}>
                                    <SelectLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{section} Infractions</SelectLabel>
                                    {sectionViolations.map((violation) => (
                                        <SelectItem key={violation.id} value={String(violation.id)} className="pl-4">
                                            {violation.name}
                                        </SelectItem>
                                    ))}
                                    {idx < arr.length - 1 && <SelectSeparator />}
                                </SelectGroup>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">
                    Classification <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={form.classification}
                    onValueChange={(v) => onChange({ classification: v as IncidentReportPayload['classification'] })}
                    disabled={true}
                    required
                >
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                        <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Warning">Warning</SelectItem>
                        <SelectItem value="Suspension">Suspension</SelectItem>
                        <SelectItem value="Exclusion">Exclusion</SelectItem>
                        <SelectItem value="Expulsion">Expulsion</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="incidentDate" className="text-slate-700 dark:text-slate-300">
                    Date of Incident <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="incidentDate"
                    type="date"
                    value={form.date}
                    onChange={(e) => onChange({ date: e.target.value })}
                    disabled={isViewMode}
                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="incidentTime" className="text-slate-700 dark:text-slate-300">
                    Time of Incident <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="incidentTime"
                    type="time"
                    value={form.time}
                    onChange={(e) => onChange({ time: e.target.value })}
                    disabled={isViewMode}
                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="incidentLocation" className="text-slate-700 dark:text-slate-300">
                    Place <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={form.location}
                    onValueChange={(v) => onChange({ location: v })}
                    disabled={isViewMode}
                    required
                >
                    <SelectTrigger
                        id="incidentLocation"
                        className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                    >
                        <SelectValue placeholder="Select place" />
                    </SelectTrigger>
                    <SelectContent>
                        {hasCustomPlace && (
                            <SelectItem value={form.location}>{form.location}</SelectItem>
                        )}
                        {placeOptions.map((place) => (
                            <SelectItem key={place} value={place}>
                                {place}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
