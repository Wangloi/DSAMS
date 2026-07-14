import { PlusCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    onNewIncident: () => void;
};

export default function IncidentTableHeader({ onNewIncident }: Props) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                    <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#000D6A] dark:text-white">
                        Violation Registry & History
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Registry and history tracker for student behavioral incidents and disciplinary actions
                    </p>
                </div>
            </div>
            <Button
                type="button"
                className="h-11 shrink-0 gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700"
                onClick={onNewIncident}
            >
                <PlusCircle className="h-5 w-5" />
                New Incident Report
            </Button>
        </div>
    );
}
