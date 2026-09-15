import VideoBackground from '@/components/VideoBackground';
import { login, register } from '@/routes';
import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle } from 'lucide-react';

export interface LastEventStats {
    id: number | null;
    name: string | null;
    date: string | null;
    attendancePercent: number;
    activeEvents: number;
    progressPercent: number;
    scannedCount: number;
    targetAttendees: number;
}

interface Props {
    canRegister: boolean;
    lastEventStats?: LastEventStats;
}

export default function LandingHero({ canRegister, lastEventStats }: Props) {
    const attendanceVal = lastEventStats?.attendancePercent ?? 98;
    const activeEventsVal = lastEventStats?.activeEvents ?? 24;
    const progressVal = lastEventStats?.progressPercent ?? 85;

    return (
        <section
            id="home"
            className="relative flex min-h-[calc(100vh-4rem)] lg:min-h-screen w-full items-center overflow-hidden"
        >
            {/* Video Background */}
            <VideoBackground />

            {/* Dark Overlay - Lighter and less blue */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.05]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, #acb1b9ff 2px, transparent 3px), radial-gradient(circle at 75% 75%, #FFFFFF 2px, transparent 2px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative grid min-h-[80vh] lg:min-h-screen items-center gap-10 py-12 sm:py-16 lg:py-0 lg:grid-cols-2 lg:gap-16">
                    {/* Content */}
                    <div className="order-1 space-y-6 text-white sm:space-y-8 lg:order-1 text-center sm:text-left">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm w-fit mx-auto sm:mx-0">
                                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">
                                    Modern Student Management System
                                </span>
                                <span className="sm:hidden">OSAMS</span>
                            </div>

                            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight">
                                Streamline Student Affairs with
                                <span className="bg-gradient-to-r from-[#8CE4FF] to-[#6da7ff] bg-clip-text text-transparent">
                                    {' '}
                                    OSA Management
                                </span>
                            </h1>

                            <p className="max-w-xl mx-auto sm:mx-0 text-sm leading-relaxed text-white/90 sm:text-base md:text-lg">
                                The Office of Student Affairs (OSA) manages
                                student activities, discipline, and attendance,
                                ensuring student welfare and maintaining campus
                                order through innovative digital solutions.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:pt-4 w-full">
                            <Link
                                href={login()}
                                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#23509A] px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#23509A] hover:shadow-2xl active:translate-y-0"
                            >
                                Get Started
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                            </Link>

                            {canRegister && (
                                <Link
                                    href={register()}
                                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-white bg-transparent px-6 py-3.5 text-sm sm:text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#000D6A] hover:shadow-xl active:translate-y-0"
                                >
                                    Sign Up
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="relative order-2 lg:order-2 px-2 sm:px-4">
                        <div className="relative mx-auto w-full max-w-[300px] xs:max-w-[340px] sm:max-w-sm lg:max-w-lg xl:max-w-xl">
                            {/* Main Card */}
                            <div className="rounded-2xl sm:rounded-3xl bg-white/95 p-4 sm:p-6 lg:p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#23509A] shrink-0 shadow-md">
                                            <img
                                                src="/images/DSA.png"
                                                alt="DSA"
                                                className="h-5 w-5 sm:h-6 sm:w-6 rounded object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xs sm:text-base font-semibold text-[#000D6A] truncate">
                                                OSAMS Dashboard
                                            </h3>
                                            <p
                                                className="text-[10px] sm:text-xs text-[#000000]/60 truncate"
                                                title={
                                                    lastEventStats?.name
                                                        ? `Last Event: ${lastEventStats.name}`
                                                        : 'Real-time monitoring'
                                                }
                                            >
                                                {lastEventStats?.name
                                                    ? `Event: ${lastEventStats.name}`
                                                    : 'Real-time monitoring'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                                        <div className="rounded-lg sm:rounded-xl bg-[#23509A]/10 p-2.5 sm:p-4">
                                            <div className="text-lg font-bold text-[#23509A] sm:text-2xl">
                                                {attendanceVal}%
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-[#000000]/70 font-medium truncate">
                                                Attendance
                                            </div>
                                        </div>
                                        <div className="rounded-lg sm:rounded-xl bg-[#000D6A]/10 p-2.5 sm:p-4">
                                            <div className="text-lg font-bold text-[#000D6A] sm:text-2xl">
                                                {activeEventsVal}
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-[#000000]/70 font-medium truncate">
                                                Active Events
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <div className="flex justify-between text-[11px] sm:text-xs">
                                            <span className="text-[#000000]/70 truncate max-w-[140px] sm:max-w-none">
                                                {lastEventStats?.name
                                                    ? "Event Progress"
                                                    : "Today's Progress"}
                                            </span>
                                            <span className="font-semibold text-[#23509A]">
                                                {progressVal}%
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-[#23509A]/20 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-[#23509A] transition-all duration-700"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, progressVal))}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Cards */}
                            <div className="absolute -top-3 right-0 sm:-top-5 sm:-right-4 rounded-xl bg-[#000D6A] px-2.5 py-1.5 sm:p-3.5 text-white shadow-xl ring-1 ring-white/10">
                                <div className="flex items-center gap-1.5 sm:gap-2.5">
                                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                                    <span className="text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                                        Live Updates
                                    </span>
                                </div>
                            </div>

                            <div className="absolute -bottom-3 left-0 sm:-bottom-5 sm:-left-4 rounded-xl bg-[#23509A] px-2.5 py-1.5 sm:p-3.5 text-white shadow-xl ring-1 ring-white/10">
                                <div className="flex items-center gap-1.5 sm:gap-2.5">
                                    <div className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-white/20">
                                        <span className="text-[10px] sm:text-xs font-bold">
                                            QR
                                        </span>
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                                        Scan Ready
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
