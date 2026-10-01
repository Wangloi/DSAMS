import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export function StatsWidgets() {
    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden rounded-xl border-0 shadow-sm sm:rounded-2xl">
                <CardHeader className="p-2.5 pb-1 sm:p-5 sm:pb-2">
                    <CardTitle className="truncate text-[10px] font-bold text-slate-700 sm:text-sm dark:text-slate-200">
                        Admission Slips
                    </CardTitle>
                    <CardDescription className="hidden text-xs sm:block">
                        Requests awaiting review
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-2.5 pt-0 sm:p-5 sm:pt-0">
                    <div className="text-lg font-black text-slate-900 sm:text-2xl dark:text-white">
                        3
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-xl border-0 shadow-sm sm:rounded-2xl">
                <CardHeader className="p-2.5 pb-1 sm:p-5 sm:pb-2">
                    <CardTitle className="truncate text-[10px] font-bold text-slate-700 sm:text-sm dark:text-slate-200">
                        Total Students
                    </CardTitle>
                    <CardDescription className="hidden text-xs sm:block">
                        Active student accounts
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-2.5 pt-0 sm:p-5 sm:pt-0">
                    <div className="text-lg font-black text-slate-900 sm:text-2xl dark:text-white">
                        420
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-xl border-0 shadow-sm sm:rounded-2xl">
                <CardHeader className="p-2.5 pb-1 sm:p-5 sm:pb-2">
                    <CardTitle className="truncate text-[10px] font-bold text-slate-700 sm:text-sm dark:text-slate-200">
                        Open Incidents
                    </CardTitle>
                    <CardDescription className="hidden text-xs sm:block">
                        Unresolved reports
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-2.5 pt-0 sm:p-5 sm:pt-0">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="text-lg font-black text-slate-900 sm:text-2xl dark:text-white">
                            5
                        </div>
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
