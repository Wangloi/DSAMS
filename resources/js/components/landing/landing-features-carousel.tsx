import {
    Archive,
    BarChart3,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Database,
    FileText,
    QrCode,
    Shield,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useRef } from 'react';

type Feature = {
    title: string;
    description: string;
    imageSrc: string;
    icon: React.ReactNode;
    color: string;
    capabilities: string[];
};

export default function LandingFeaturesCarousel() {
    const trackRef = useRef<HTMLDivElement | null>(null);

    const features: Feature[] = [
        {
            title: 'Attendance Management',
            description:
                'Real-time attendance tracking with QR code scanning for events, seminars, and activities. Automated check-in/out with comprehensive attendance analytics.',
            imageSrc: '/images/qr-code-attendance.jpeg',
            icon: <Calendar className="h-8 w-8" />,
            color: '#23509A',
            capabilities: [
                'QR Code Scanning',
                'Real-time Tracking',
                'Event Management',
                'Attendance Reports',
            ],
        },

        {
            title: 'User Management',
            description:
                'Comprehensive user administration for students, CSG representatives, program heads, and administrators with role-based access control.',
            imageSrc:
                '/images/N1-0319-End-User-Management-blog-image-qfpi39udjowh7wlpwlidr3vdn08ym015a6d8nzql6u.webp',
            icon: <Users className="h-8 w-8" />,
            color: '#000D6A',

            capabilities: [
                'Student Profiles',
                'Role Management',
                'Access Control',
                'User Analytics',
            ],
        },
        {
            title: 'Admission Slip System',
            description:
                'Digital admission slip creation and management for disciplinary cases, appointments, and special permissions with automated approval workflows.',
            imageSrc: '/images/Admission Slip.png',
            icon: <FileText className="h-8 w-8" />,
            color: '#23509A',

            capabilities: [
                'Digital Slips',
                'Case Tracking',
                'Approval Workflow',
                'Print Integration',
            ],
        },
        {
            title: 'Incidents & Violations',
            description:
                'Comprehensive tracking of student disciplinary incidents, violations, and behavioral records with detailed case management and follow-up tracking.',

            imageSrc: '/images/Incident_Report.jpg',
            icon: <Shield className="h-8 w-8" />,
            color: '#000D6A',
            capabilities: [
                'Incident Logging',
                'Case Management',
                'Violation Tracking',
                'Behavioral Analytics',
            ],
        },

        {
            title: 'Student Evaluations',
            description:
                'QR code-based evaluation forms for events and seminars with instant feedback collection and comprehensive survey analytics.',
            imageSrc: '/images/Evaluation.webp',
            icon: <QrCode className="h-8 w-8" />,
            color: '#23509A',
            capabilities: [
                'QR Evaluation',
                'Instant Feedback',
                'Survey Analytics',
                'Event Assessment',
            ],
        },
        {
            title: 'Analytics & Reports',
            description:
                'Advanced analytics dashboard with real-time statistics, trend analysis, and comprehensive reporting for data-driven decision making.',
            imageSrc: '/images/analytics and report.webp',
            icon: <BarChart3 className="h-8 w-8" />,
            color: '#000D6A',
            capabilities: [
                'Real-time Stats',
                'Trend Analysis',
                'Custom Reports',
                'Data Visualization',
            ],
        },
        {
            title: 'Archive System',
            description:
                'Secure data archiving with automated backup, retention policies, and easy retrieval for historical records and compliance requirements.',
            imageSrc: '/images/archive.avif',
            icon: <Archive className="h-8 w-8" />,
            color: '#23509A',
            capabilities: [
                'Automated Backup',
                'Retention Policies',
                'Secure Storage',
                'Quick Retrieval',
            ],
        },
        {
            title: 'Performance Monitoring',
            description:
                'Comprehensive performance tracking with KPI monitoring, system health checks, and efficiency metrics for continuous improvement.',
            imageSrc: '/images/Performance-Monitoring.jpg',
            icon: <TrendingUp className="h-8 w-8" />,
            color: '#000D6A',
            capabilities: [
                'KPI Tracking',
                'System Health',
                'Efficiency Metrics',
                'Performance Reports',
            ],
        },
    ];

    const scrollByAmount = (dir: -1 | 1) => {
        const el = trackRef.current;
        if (!el) return;
        const amount = Math.max(360, Math.floor(el.clientWidth * 0.9));
        el.scrollBy({ left: dir * amount, behavior: 'smooth' });
    };

    return (
        <section id="features" className="relative overflow-hidden bg-gradient-to-bl from-slate-50 via-blue-50/50 to-[#000D6A]/12 py-24 lg:py-32">
            {/* Background grid mesh in soft blue */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#23509a0d_1px,transparent_1px),linear-gradient(to_bottom,#23509a0d_1px,transparent_1px)] bg-[size:20px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none" />

            {/* Ambient background glows */}
            <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-blue-500/15 to-indigo-600/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-500/15 to-blue-600/15 blur-3xl pointer-events-none" />

            <div id="services" className="absolute -top-16" />
            <div className="relative mx-auto w-full max-w-7xl px-4 lg:px-8">
                {/* Header Section */}
                <div className="mb-16 space-y-6 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#23509A]/10 px-4 py-2 text-sm font-semibold text-[#23509A]">
                        <span className="h-2 w-2 rounded-full bg-[#23509A] animate-pulse" />
                        Services & Capabilities
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-[#000D6A] sm:text-4xl lg:text-5xl">
                        Key Features of OSAMS
                    </h2>
                    <p className="mx-auto max-w-2xl text-base text-slate-500 sm:text-lg">
                        Discover the powerful tools that streamline student
                        affairs management and enhance campus efficiency
                        with our all-in-one unified solution.
                    </p>
                </div>

                <div className="relative mt-16">
                    {/* Navigation Buttons */}
                    <button
                        type="button"
                        onClick={() => scrollByAmount(-1)}
                        className="absolute top-1/2 left-0 z-10 hidden -translate-y-1/2 items-center justify-center rounded-2xl bg-white p-4 text-[#000D6A] shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-[#23509A]/10 transition-all duration-300 hover:-translate-x-1 hover:bg-[#23509A] hover:text-white hover:shadow-xl active:scale-95 lg:flex cursor-pointer"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <div
                        ref={trackRef}
                        className="flex snap-x snap-mandatory gap-8 overflow-x-auto px-4 pb-8 [-ms-overflow-style:none] [scrollbar-width:none] lg:px-12 [&::-webkit-scrollbar]:hidden"
                    >
                        {features.map((feature, index) => (
                            <article
                                key={feature.title}
                                className="group relative w-[310px] sm:w-[350px] shrink-0 snap-center overflow-hidden rounded-3xl bg-white shadow-[0_10px_35px_rgba(35,80,154,0.05)] border border-[#23509A]/5 transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(35,80,154,0.12)] flex flex-col justify-between"
                            >
                                {/* Image and Floating Badge */}
                                <div className="relative h-52 w-full overflow-hidden">
                                    <img
                                        src={feature.imageSrc}
                                        alt={feature.title}
                                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                                    
                                    {/* Category Pill */}
                                    <div className="absolute bottom-4 left-6 flex items-center gap-2">
                                        <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
                                            Feature {index + 1}
                                        </div>
                                    </div>

                                    {/* Icon Badge */}
                                    <div
                                        className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                                        style={{
                                            background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`,
                                            boxShadow: `0 8px 20px -6px ${feature.color}`,
                                        }}
                                    >
                                        {feature.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col p-6 sm:p-8">
                                    <h3 className="mb-3 text-xl font-extrabold tracking-tight text-[#000D6A] transition-colors duration-300 group-hover:text-[#23509A]">
                                        {feature.title}
                                    </h3>
                                    <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-500">
                                        {feature.description}
                                    </p>

                                    {/* Capabilities tag grid */}
                                    <div className="mt-auto">
                                        <div className="flex flex-wrap gap-2">
                                            {feature.capabilities.map((capability, capIndex) => (
                                                <span
                                                    key={capIndex}
                                                    className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-300"
                                                    style={{
                                                        backgroundColor: `${feature.color}0c`,
                                                        color: feature.color,
                                                        border: `1px solid ${feature.color}15`,
                                                    }}
                                                >
                                                    <CheckCircle className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: feature.color }} />
                                                    {capability}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => scrollByAmount(1)}
                        className="absolute top-1/2 right-0 z-10 hidden -translate-y-1/2 items-center justify-center rounded-2xl bg-white p-4 text-[#000D6A] shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-[#23509A]/10 transition-all duration-300 hover:translate-x-1 hover:bg-[#23509A] hover:text-white hover:shadow-xl active:scale-95 lg:flex cursor-pointer"
                        aria-label="Next"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>

                {/* Dots Indicator */}
                <div className="mt-8 flex justify-center gap-3 lg:hidden">
                    {features.map((_, index) => (
                        <button
                            key={index}
                            className="h-2 w-2 rounded-full bg-[#23509A]/20 transition-all duration-300 hover:bg-[#23509A]"
                            onClick={() => {
                                const el = trackRef.current;
                                if (!el) return;
                                const cardWidth = 350 + 32; // card width + gap
                                el.scrollTo({
                                    left: index * cardWidth,
                                    behavior: 'smooth',
                                });
                            }}
                        />
                    ))}
                </div>

                {/* Bottom CTA Card */}
                <div className="mt-20">
                    <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-white to-[#FBFBFB] p-8 md:p-12 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-[#23509A]/10 text-center relative overflow-hidden">
                        {/* Gradient background glows inside card */}
                        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#23509A]/5 blur-2xl" />
                        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#000D6A]/5 blur-2xl" />
                        
                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#23509A] to-[#000D6A] text-white shadow-lg">
                                <Database className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-[#000D6A] sm:text-3xl">
                                All-in-One Integrated Solution
                            </h3>
                            <p className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-slate-500">
                                OSAMS integrates all student affairs operations into a unified,
                                real-time database. Say goodbye to scattered files and manual coordination,
                                and embrace automated workflows built for modern education.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
