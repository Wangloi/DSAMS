import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { ArrowRight, Clock, History, LayoutGrid, Search } from 'lucide-react';
import ProgramHeadLayout from './components/ProgramHeadLayout';

export default function ActivityLog() {
    return (
        <ProgramHeadLayout>
            <Head title="Activity Log - Program Head" />

            <div className="min-h-screen bg-[#f8fafc] transition-colors duration-500 dark:bg-[#020617]">
                {/* Visual Background Elements */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -top-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-500/10" />
                    <div className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
                </div>

                <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
                    {/* Premium Hero Header */}
                    <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0b2d66] p-8 text-white shadow-2xl transition-all duration-500 dark:bg-[#051139]">
                        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl transition-transform duration-1000 group-hover:scale-110" />

                        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-xl transition-transform duration-500 group-hover:rotate-3">
                                    <History className="h-8 w-8 text-blue-100" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                                        Activity Log
                                    </h1>
                                    <p className="mt-1 flex items-center gap-2 font-medium text-blue-100/70">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                                        Monitor system changes and user actions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Empty State */}
                    <Card className="overflow-hidden rounded-[3rem] border-none bg-white/80 py-24 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/40 dark:shadow-none">
                        <CardContent className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 scale-150 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl ring-4 shadow-blue-500/40 ring-white dark:ring-slate-800">
                                    <Clock className="h-10 w-10 animate-pulse text-white" />
                                </div>
                                <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-blue-500/20 dark:bg-slate-800">
                                    <Search className="h-4 w-4 text-blue-500" />
                                </div>
                            </div>

                            <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                No Activity Recorded Yet
                            </h2>
                            <p className="mb-10 leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                Your activity trail is currently empty. System
                                logs and user interactions will appear here once
                                the system captures new events.
                            </p>

                            <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
                                <Button className="h-12 w-full gap-2 rounded-2xl bg-[#0b2d66] text-[10px] font-black tracking-widest uppercase shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] sm:flex-1 dark:bg-blue-600">
                                    Refresh Logs
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 w-full gap-2 rounded-2xl border-slate-200 bg-white text-[10px] font-black tracking-widest uppercase transition-all hover:bg-slate-50 sm:flex-1 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    System Status
                                </Button>
                            </div>

                            <p className="mt-8 text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase dark:text-slate-600">
                                Last checked: Just now
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProgramHeadLayout>
    );
}
