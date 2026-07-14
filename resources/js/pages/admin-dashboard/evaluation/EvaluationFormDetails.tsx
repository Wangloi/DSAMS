import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { EventOption, FormState } from './types';

export default function EvaluationFormDetails({
    form,
    onChange,
    events,
}: {
    form: FormState;
    onChange: (patch: Partial<FormState>) => void;
    events: EventOption[];
}) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Form Name *
                </Label>
                <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder="e.g., Leadership Seminar Evaluation"
                    className="text-base"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Description
                </Label>
                <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="Provide additional context or instructions for this evaluation..."
                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-base ring-offset-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="event" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Event *
                </Label>
                <Select value={form.eventId} onValueChange={(v) => onChange({ eventId: v })}>
                    <SelectTrigger className="text-base">
                        <SelectValue placeholder="Select an event for this evaluation" />
                    </SelectTrigger>
                    <SelectContent>
                        {events.map((ev) => (
                            <SelectItem key={ev.id} value={String(ev.id)}>
                                <div className="flex flex-col">
                                    <span className="font-medium">{ev.name}</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {ev.date} at {ev.time}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                New and updated forms are saved as <strong>drafts</strong>. Only <strong>completed events</strong> (past event date) appear in the list.
                Publish from the evaluation list when ready — eligible students (present + matching course/year) will be notified.
            </div>
        </div>
    );
}
