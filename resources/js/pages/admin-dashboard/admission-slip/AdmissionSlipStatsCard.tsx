import { ClipboardList, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Stats = {
    total: number;
    issuedToday: number;
    validThisWeek: number;
};

type Props = {
    stats: Stats;
};

export default function AdmissionSlipStatsCard({ stats }: Props) {
    return (
        <div className="grid gap-4 lg:grid-cols-3">
            {/* Total Issued */}
            <Card className="overflow-hidden border border-blue-100 bg-blue-50/50 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 group">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 opacity-70">
                                Total Issued
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <div className="text-3xl font-black text-slate-900 dark:text-white">
                                    {stats.total}
                                </div>
                            </div>
                        </div>
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <ClipboardList className="h-6 w-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Issued Today */}
            <Card className="overflow-hidden border border-emerald-100 bg-emerald-50/50 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 group">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 opacity-70">
                                Issued Today
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <div className="text-3xl font-black text-slate-900 dark:text-white">
                                    {stats.issuedToday}
                                </div>
                            </div>
                        </div>
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Valid This Week */}
            <Card className="overflow-hidden border border-purple-100 bg-purple-50/50 shadow-sm dark:border-purple-500/20 dark:bg-purple-500/10 group">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 opacity-70">
                                Valid This Week
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <div className="text-3xl font-black text-slate-900 dark:text-white">
                                    {stats.validThisWeek}
                                </div>
                            </div>
                        </div>
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
