import { ShieldAlert, PlusCircle, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    onNewIncident: () => void;
};

export default function IncidentTableHeader({ onNewIncident }: Props) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20 mb-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner backdrop-blur-sm ring-1 ring-white/20">
                        <ShieldAlert className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white">
                            Violation Registry & History
                        </h1>
                        <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                            Registry and history tracker for student behavioral incidents and disciplinary actions
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 ring-1 ring-white/20 text-white">
                        <CalendarDays className="h-4 w-4 text-blue-200" />
                        <div className="text-xs font-semibold tracking-wide uppercase text-white/90">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <Button
                        type="button"
                        className="h-11 gap-2 rounded-xl bg-white px-5 font-bold text-[#1e3a8a] shadow-md transition-all duration-200 hover:bg-blue-50 hover:shadow-lg self-start sm:self-auto"
                        onClick={onNewIncident}
                    >
                        <PlusCircle className="h-5 w-5" />
                        New Incident Report
                    </Button>
                </div>
            </div>
        </div>
    );
}
