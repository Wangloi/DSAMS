import { Link } from '@inertiajs/react';
import { ArrowRight, Award, Shield, Users } from 'lucide-react';

export default function LandingAbout() {
    return (
        <section
            id="about"
            className="relative bg-gradient-to-br from-white via-[#FBFBFB] to-[#23509A]/5 py-24 lg:py-32"
        >
            <div id="mission" className="absolute -top-16" />
            <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-4 lg:grid-cols-2 lg:px-8">
                {/* Content */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#23509A]/10 px-4 py-2 text-sm font-medium text-[#23509A]">
                            <Shield className="h-4 w-4" />
                            About OSA
                        </div>

                        <h2 className="text-3xl leading-tight font-bold text-[#000D6A] lg:text-5xl">
                            OFFICE OF STUDENT AFFAIRS
                        </h2>

                        <p className="text-lg leading-relaxed text-[#000000]/70 lg:text-xl">
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
                    <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-[#23509A]/10">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-[#23509A]/10 p-3">
                                    <Users className="h-6 w-6 text-[#23509A]" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-[#000D6A]">
                                        2000+
                                    </div>
                                    <div className="text-sm text-[#000000]/70">
                                        Students Served
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-[#23509A]/10">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-[#000D6A]/10 p-3">
                                    <Award className="h-6 w-6 text-[#000D6A]" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-[#000D6A]">
                                        50+
                                    </div>
                                    <div className="text-sm text-[#000000]/70">
                                        Events Managed
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Link
                            href="#features"
                            className="group inline-flex items-center gap-2 rounded-xl bg-[#23509A] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#000D6A] hover:shadow-xl"
                        >
                            Learn More
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Visual */}
                <div className="relative">
                    <div className="relative mx-auto max-w-lg">
                        {/* Main Image Card */}
                        <div className="rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-[#23509A]/10">
                            <div className="space-y-6">
                                <div className="flex items-center justify-center">
                                    <div className="rounded-full bg-gradient-to-br from-[#23509A] to-[#000D6A] p-6">
                                        <img
                                            src="/images/DSA.png"
                                            alt="DSA"
                                            className="h-16 w-16 rounded-full object-cover"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-[#000D6A]">
                                        OSA Office
                                    </h3>
                                    <p className="text-[#000000]/70">
                                        Office of Student Affairs & Welfare
                                        Management
                                    </p>
                                </div>

                                {/* Mission Points */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-[#23509A]"></div>
                                        <span className="text-sm text-[#000000]/80">
                                            Student Welfare
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-[#23509A]"></div>
                                        <span className="text-sm text-[#000000]/80">
                                            Discipline Management
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-[#23509A]"></div>
                                        <span className="text-sm text-[#000000]/80">
                                            Event Coordination
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-6 -left-6 rounded-xl bg-[#000D6A] p-4 text-white shadow-xl">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                    Trusted System
                                </span>
                            </div>
                        </div>

                        <div className="absolute -right-6 -bottom-6 rounded-xl bg-[#23509A] p-4 text-white shadow-xl">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                <span className="text-sm font-medium">
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
