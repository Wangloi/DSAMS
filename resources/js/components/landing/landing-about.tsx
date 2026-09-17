import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Award, Shield, Users } from 'lucide-react';

interface Props {
    stats?: {
        totalStudents: number;
        totalEvents: number;
    };
}

export default function LandingAbout({ stats: propStats }: Props) {
    const { props } = usePage();
    const stats = propStats || (props.stats as any);
    const studentsCount = stats?.totalStudents !== undefined ? `${stats.totalStudents}` : '2000+';
    const eventsCount = stats?.totalEvents !== undefined ? `${stats.totalEvents}` : '50+';

    return (
        <section
            id="about"
            className="relative overflow-hidden bg-gradient-to-br from-[#23509A]/15 via-blue-50/40 to-slate-50 py-14 sm:py-20 lg:py-32"
        >
            {/* Background grid mesh in soft blue */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#23509a0f_1px,transparent_1px),linear-gradient(to_bottom,#23509a0f_1px,transparent_1px)] bg-[size:16px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Glowing background orbs */}
            <div className="absolute top-1/4 -left-10 -z-10 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-10 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

            <div id="mission" className="absolute -top-16" />
            
            <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                {/* Content */}
                <div className="space-y-6 sm:space-y-8">
                    <div className="space-y-4 sm:space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#23509A]/10 bg-gradient-to-r from-[#23509A]/10 to-transparent px-3.5 py-1.5 text-xs font-semibold tracking-wider text-[#23509A] uppercase shadow-xs">
                            <Shield className="h-3.5 w-3.5 animate-pulse" />
                            About OSA
                        </div>

                        <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#000D6A] via-[#0b2d66] to-[#23509A]">
                            OFFICE OF STUDENT AFFAIRS
                        </h2>

                        <p className="text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
                            The Office of Student Affairs (OSA) is the office
                            responsible for student activities, discipline, and
                            welfare. It monitors event attendance, manages
                            student violations and incident reports, issues
                            slips and clearances, and oversees lost-and-found
                            items to maintain order and support students on
                            campus.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3.5 sm:gap-6">
                        <div className="group rounded-2xl border border-slate-150 bg-white/70 p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#23509A]/20 hover:bg-white hover:shadow-[0_20px_40px_rgba(35,80,154,0.08)]">
                            <div className="flex items-center gap-3.5 sm:gap-4">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 text-[#23509A] transition-colors group-hover:bg-[#23509A] group-hover:text-white">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xl sm:text-2xl font-black tracking-tight text-[#000D6A] truncate">
                                        {studentsCount}
                                    </div>
                                    <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                        Students Served
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group rounded-2xl border border-slate-150 bg-white/70 p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#000D6A]/20 hover:bg-white hover:shadow-[0_20px_40px_rgba(0,13,106,0.08)]">
                            <div className="flex items-center gap-3.5 sm:gap-4">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 text-[#000D6A] transition-colors group-hover:bg-[#000D6A] group-hover:text-white">
                                    <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xl sm:text-2xl font-black tracking-tight text-[#000D6A] truncate">
                                        {eventsCount}
                                    </div>
                                    <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                        Events Managed
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Link
                            href="#features"
                            className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#23509A] to-[#000D6A] px-6 sm:px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/20 active:translate-y-0"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Learn More
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </span>
                            <span className="absolute inset-0 z-0 bg-gradient-to-r from-[#000D6A] to-[#23509A] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </Link>
                    </div>
                </div>

                {/* Visual */}
                <div className="relative px-2 sm:px-4">
                    <div className="relative mx-auto w-full max-w-[320px] xs:max-w-[360px] sm:max-w-md lg:max-w-lg">
                        {/* Decorative glow ring background */}
                        <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-[#23509A]/20 to-[#000D6A]/20 opacity-30 blur-2xl" />

                        {/* Main Image Card */}
                        <div className="relative rounded-2xl sm:rounded-3xl border border-slate-100 bg-white/90 p-5 sm:p-8 shadow-[0_30px_70px_rgba(35,80,154,0.08)] backdrop-blur-md">
                            <div className="space-y-5 sm:space-y-6">
                                <div className="flex items-center justify-center">
                                    <div className="relative">
                                        <div className="absolute -inset-1.5 animate-pulse rounded-full bg-gradient-to-br from-[#23509A]/50 to-[#000D6A]/50 opacity-40 blur-xs" />
                                        <div className="relative rounded-full bg-gradient-to-br from-[#23509A] to-[#000D6A] p-4 sm:p-6 shadow-inner ring-4 ring-white">
                                            <img
                                                src="/images/DSA.png"
                                                alt="DSA Logo"
                                                className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover shadow-md"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 sm:space-y-2 text-center">
                                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#000D6A]">
                                        OSA Office
                                    </h3>
                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Office of Student Affairs & Welfare Management
                                    </p>
                                </div>

                                {/* Mission Points */}
                                <div className="rounded-xl sm:rounded-2xl bg-slate-50/50 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-slate-700">
                                            Student Welfare
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-slate-700">
                                            Discipline Management
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-slate-700">
                                            Event Coordination
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-3 left-0 sm:-top-5 sm:-left-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#000D6A] to-[#103875] px-3 py-2 sm:p-3.5 text-white shadow-xl shadow-blue-900/10 ring-1 ring-white/10">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-white/10 p-1 sm:p-1.5">
                                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                                    Trusted System
                                </span>
                            </div>
                        </div>

                        <div className="absolute -bottom-3 right-0 sm:-bottom-5 sm:-right-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#23509A] to-[#0b2d66] px-3 py-2 sm:p-3.5 text-white shadow-xl shadow-blue-500/10 ring-1 ring-white/10">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-white/10 p-1 sm:p-1.5">
                                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                                    Student-Centric
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

