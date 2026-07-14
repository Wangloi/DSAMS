import { Calendar } from 'lucide-react';

export default function AttendanceHeader() {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                    <Calendar className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Attendance Management
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Monitor attendance logs, active event scans, and student participation
                    </p>
                </div>
            </div>
        </div>
    );
}

