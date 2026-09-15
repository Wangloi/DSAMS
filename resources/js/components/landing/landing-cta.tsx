import { Link } from '@inertiajs/react';
import { ArrowRight, Award, CheckCircle, Shield, Users } from 'lucide-react';

interface Props {
    canRegister: boolean;
    stats?: {
        totalStudents: number;
        totalEvents: number;
        totalAdmissionSlips: number;
        totalPrograms: number;
    };
}

export default function LandingCta({ canRegister, stats }: Props) {
    const studentsCount = stats?.totalStudents ?? 0;
    const eventsCount = stats?.totalEvents ?? 0;
    const slipsCount = stats?.totalAdmissionSlips ?? 0;
    const programsCount = stats?.totalPrograms ?? 0;

    return (
        <section
            id="get-started"
            className="relative overflow-hidden bg-[#000D6A] py-14 sm:py-20 lg:py-32"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, #23509A 2px, transparent 2px), radial-gradient(circle at 75% 75%, #FBFBFB 2px, transparent 2px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="space-y-6 sm:space-y-8 text-center">
                    {/* Header */}
                    <div className="space-y-3 sm:space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white backdrop-blur-sm">
                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                            Ready to Get Started?
                        </div>

                        <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
                            Empowering Student Services
                        </h2>

                        <p className="mx-auto max-w-2xl text-sm sm:text-base lg:text-lg leading-relaxed text-white/80">
                            Streamline student affairs management with a
                            centralized platform designed to improve
                            communication, attendance tracking, disciplinary
                            management, and student support services.
                        </p>
                    </div>

                    {/* Cards Grid */}
                    <div className="mx-auto grid max-w-4xl grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 py-4 sm:py-8">
                        <div className="rounded-2xl border border-white/20 bg-white/10 p-5 sm:p-6 text-left backdrop-blur-sm">
                            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <h3 className="mb-1.5 sm:mb-2 text-base sm:text-lg font-semibold text-white">
                                Student Management
                            </h3>
                            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                                Manage student profiles, admission slips,
                                disciplinary records, and welfare services in
                                one secure and organized system.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/20 bg-white/10 p-5 sm:p-6 text-left backdrop-blur-sm">
                            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20">
                                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <h3 className="mb-1.5 sm:mb-2 text-base sm:text-lg font-semibold text-white">
                                Secure & Reliable
                            </h3>
                            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                                Protect sensitive student information with
                                advanced security measures and reliable access
                                controls.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/20 bg-white/10 p-5 sm:p-6 text-left backdrop-blur-sm">
                            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20">
                                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <h3 className="mb-1.5 sm:mb-2 text-base sm:text-lg font-semibold text-white">
                                Event & Attendance
                            </h3>
                            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                                Track event participation and manage attendance
                                through dynamic QR technology.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 w-full">
                        <Link
                            href="/login"
                            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#23509A] px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#000D6A] hover:shadow-2xl active:translate-y-0"
                        >
                            Student Portal
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <Link
                            href="/program-head-login"
                            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#FBFBFB] px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-[#000D6A] shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#23509A] hover:text-white hover:shadow-2xl active:translate-y-0"
                        >
                            Program Head Portal
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <Link
                            href="/admin-login"
                            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#FBFBFB] px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-[#000D6A] shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#23509A] hover:text-white hover:shadow-2xl active:translate-y-0"
                        >
                            Admin Portal
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    {/* Real Dynamic System Stats */}
                    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:gap-8 border-t border-white/20 pt-6 sm:pt-8 md:grid-cols-4">
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                                {studentsCount}
                            </div>
                            <div className="text-xs sm:text-sm text-white/70">
                                Enrolled Students
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                                {eventsCount}
                            </div>
                            <div className="text-xs sm:text-sm text-white/70">
                                Events Managed
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                                {slipsCount}
                            </div>
                            <div className="text-xs sm:text-sm text-white/70">
                                Admission Slips
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                                24/7
                            </div>
                            <div className="text-xs sm:text-sm text-white/70">Support</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
