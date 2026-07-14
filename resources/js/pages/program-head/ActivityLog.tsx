import { Head } from '@inertiajs/react';
import { History, Search, Filter, ArrowRight, LayoutGrid, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProgramHeadLayout from './components/ProgramHeadLayout';

export default function ActivityLog() {
    return (
        <ProgramHeadLayout>
            <Head title="Activity Log - Program Head" />
            
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500">
                {/* Visual Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-500/10" />
                    <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
                </div>

                <div className="relative mx-auto w-full max-w-[1400px] flex flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
                    
                    {/* Premium Hero Header */}
                    <div className="group relative overflow-hidden rounded-[2.5rem] bg-[#0b2d66] p-8 text-white shadow-2xl dark:bg-[#051139] border border-white/5 transition-all duration-500">
                        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
                        
                        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20 shadow-inner group-hover:rotate-3 transition-transform duration-500">
                                    <History className="h-8 w-8 text-blue-100" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                                        Activity Log
                                    </h1>
                                    <p className="mt-1 flex items-center gap-2 text-blue-100/70 font-medium">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                        Monitor system changes and user actions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Empty State */}
                    <Card className="overflow-hidden border-none bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[3rem] py-24">
                        <CardContent className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/40 ring-4 ring-white dark:ring-slate-800">
                                    <Clock className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-lg ring-2 ring-blue-500/20">
                                    <Search className="h-4 w-4 text-blue-500" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                                No Activity Recorded Yet
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
                                Your activity trail is currently empty. System logs and user interactions will appear here once the system captures new events.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                                <Button className="h-12 w-full sm:flex-1 gap-2 rounded-2xl bg-[#0b2d66] dark:bg-blue-600 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all">
                                    Refresh Logs
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="h-12 w-full sm:flex-1 gap-2 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                                    <LayoutGrid className="h-4 w-4" />
                                    System Status
                                </Button>
                            </div>

                            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600">
                                Last checked: Just now
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProgramHeadLayout>
    );
}

