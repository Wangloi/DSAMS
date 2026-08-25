import VideoBackground from '@/components/VideoBackground';
import { login, register } from '@/routes';
import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingHero({ canRegister }: { canRegister: boolean }) {
    return (
        <section
            id="home"
            className="relative flex min-h-screen items-center overflow-hidden"
        >
            {/* Badge positioned at section level - completely isolated */}
            <div className="absolute top-28 left-1/2 z-30 translate-x-1/2 transform lg:left-1/10 lg:translate-x-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">
                        Modern Student Management System
                    </span>
                    <span className="sm:hidden">OSAMS</span>
                </div>
            </div>

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
                <div className="relative grid min-h-[80vh] items-center gap-8 sm:min-h-screen sm:gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Content */}
                    <div className="order-2 space-y-6 text-white sm:space-y-8 lg:order-1">
                        <div className="space-y-3 sm:space-y-4">
                            <div className="text-lg font-semibold text-white/95 sm:text-xl md:text-2xl"></div>

                            <h1 className="text-2xl leading-tight font-bold sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                                Streamline Student Affairs with
                                <span className="bg-gradient-to-r from-[#8CE4FF] to-[#261CC1] bg-clip-text text-transparent">
                                    {' '}
                                    OSA Management
                                </span>
                            </h1>

                            <p className="max-w-xl text-sm leading-relaxed text-white/90 sm:text-base md:text-lg lg:text-xl">
                                The Office of Student Affairs (OSA) manages
                                student activities, discipline, and attendance,
                                ensuring student welfare and maintaining campus
                                order through innovative digital solutions.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:pt-4">
                            <Link
                                href={login()}
                                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#23509A] px-6 py-3 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#23509A] hover:shadow-2xl sm:px-8 sm:py-4 sm:text-lg"
                            >
                                Get Started
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                            </Link>

                            {canRegister && (
                                <Link
                                    href={register()}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white bg-transparent px-6 py-3 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#000D6A] hover:shadow-xl sm:px-8 sm:py-4 sm:text-lg"
                                >
                                    Sign Up
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="relative order-1 lg:order-2">
                        <div className="relative mx-auto max-w-xs sm:max-w-sm lg:max-w-lg xl:max-w-xl">
                            {/* Main Card */}
                            <div className="rounded-2xl bg-white/95 p-6 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm sm:p-8">
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#23509A] sm:h-12 sm:w-12">
                                            <img
                                                src="/images/DSA.png"
                                                alt="DSA"
                                                className="h-5 w-5 rounded object-cover sm:h-6 sm:w-6"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-[#000D6A] sm:text-base">
                                                OSAMS Dashboard
                                            </h3>
                                            <p className="text-xs text-[#000000]/60 sm:text-sm">
                                                Real-time monitoring
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div className="rounded-lg bg-[#23509A]/10 p-3 sm:p-4">
                                            <div className="text-xl font-bold text-[#23509A] sm:text-2xl">
                                                98%
                                            </div>
                                            <div className="text-xs text-[#000000]/70 sm:text-sm">
                                                Attendance
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-[#000D6A]/10 p-3 sm:p-4">
                                            <div className="text-xl font-bold text-[#000D6A] sm:text-2xl">
                                                24
                                            </div>
                                            <div className="text-xs text-[#000000]/70 sm:text-sm">
                                                Active Events
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-[#000000]/70">
                                                Today's Progress
                                            </span>
                                            <span className="font-medium text-[#23509A]">
                                                85%
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-[#23509A]/20">
                                            <div className="h-full w-[85%] rounded-full bg-[#23509A]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Cards */}
                            <div className="absolute -top-4 -right-4 rounded-xl bg-[#000D6A] p-3 text-white shadow-xl sm:-top-6 sm:-right-6 sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-sm font-medium">
                                        Live Updates
                                    </span>
                                </div>
                            </div>

                            <div className="absolute -bottom-4 -left-4 rounded-xl bg-[#23509A] p-3 text-white shadow-xl sm:-bottom-6 sm:-left-6 sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 sm:h-8 sm:w-8">
                                        <span className="text-xs font-bold sm:text-sm">
                                            QR
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium">
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
