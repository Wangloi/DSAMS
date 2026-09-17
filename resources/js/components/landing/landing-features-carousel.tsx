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
import { useCallback, useEffect, useRef, useState } from 'react';

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
    const [activeIndex, setActiveIndex] = useState(0);

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

    const updateActiveIndexFromScroll = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        const firstCard = el.querySelector('article');
        if (!firstCard) return;
        const cardWidth = firstCard.clientWidth + 16;
        const scrollLeft = el.scrollLeft;
        const idx = Math.round(scrollLeft / cardWidth);
        setActiveIndex(Math.max(0, Math.min(features.length - 1, idx)));
    }, [features.length]);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateActiveIndexFromScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [updateActiveIndexFromScroll]);

    const scrollToSlide = (index: number) => {
        const el = trackRef.current;
        if (!el) return;
        const firstCard = el.querySelector('article');
        if (!firstCard) return;
        const cardWidth = firstCard.clientWidth + 16;
        el.scrollTo({
            left: index * cardWidth,
            behavior: 'smooth',
        });
        setActiveIndex(index);
    };

    const scrollByAmount = (dir: -1 | 1) => {
        const el = trackRef.current;
        if (!el) return;
        const amount = Math.max(280, Math.floor(el.clientWidth * 0.85));
        el.scrollBy({ left: dir * amount, behavior: 'smooth' });
    };

    return (
        <section id="features" className="relative overflow-hidden bg-gradient-to-bl from-slate-50 via-blue-50/50 to-[#000D6A]/12 py-14 sm:py-20 lg:py-32 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Background grid mesh in soft blue */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#23509a0d_1px,transparent_1px),linear-gradient(to_bottom,#23509a0d_1px,transparent_1px)] bg-[size:20px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none" />

            {/* Ambient background glows */}
            <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-blue-500/15 to-indigo-600/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-500/15 to-blue-600/15 blur-3xl pointer-events-none" />

            <div id="services" className="absolute -top-16" />
            <div className="relative mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-10 sm:mb-16 space-y-4 sm:space-y-6 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#23509A]/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#23509A] dark:bg-blue-500/20 dark:text-blue-300">
                        <span className="h-2 w-2 rounded-full bg-[#23509A] dark:bg-blue-400 animate-pulse" />
                        Services & Capabilities
                    </div>
                    <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#000D6A] dark:text-white">
                        Key Features of OSAMS
                    </h2>
                    <p className="mx-auto max-w-2xl text-sm sm:text-base lg:text-lg text-slate-500 dark:text-slate-400">
                        Discover the powerful tools that streamline student
                        affairs management and enhance campus efficiency
                        with our all-in-one unified solution.
                    </p>
                </div>

                <div className="relative mt-8 sm:mt-16">
                    {/* Navigation Buttons */}
                    <button
                        type="button"
                        onClick={() => scrollByAmount(-1)}
                        className="absolute top-1/2 left-0 z-10 hidden -translate-y-1/2 items-center justify-center rounded-2xl bg-white p-4 text-[#000D6A] shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-[#23509A]/10 transition-all duration-300 hover:-translate-x-1 hover:bg-[#23509A] hover:text-white hover:shadow-xl active:scale-95 lg:flex cursor-pointer dark:bg-slate-800 dark:text-white dark:ring-slate-700 dark:hover:bg-blue-600"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <div
                        ref={trackRef}
                        className="flex snap-x snap-mandatory gap-4 sm:gap-6 lg:gap-8 overflow-x-auto px-2 sm:px-4 pb-6 sm:pb-8 [-ms-overflow-style:none] [scrollbar-width:none] lg:px-12 [&::-webkit-scrollbar]:hidden scroll-smooth"
                    >
                        {features.map((feature, index) => (
                            <article
                                key={feature.title}
                                className="group relative w-[82vw] xs:w-[300px] sm:w-[340px] md:w-[360px] max-w-[360px] shrink-0 snap-center overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-[0_10px_35px_rgba(35,80,154,0.05)] border border-[#23509A]/5 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(35,80,154,0.12)] flex flex-col justify-between dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-black/20"
                            >
                                {/* Image and Floating Badge */}
                                <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                                    <img
                                        src={feature.imageSrc}
                                        alt={feature.title}
                                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                                    
                                    {/* Category Pill */}
                                    <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6 flex items-center gap-2">
                                        <div className="rounded-full bg-white/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold text-white backdrop-blur-md border border-white/10">
                                            Feature {index + 1}
                                        </div>
                                    </div>

                                    {/* Icon Badge */}
                                    <div
                                        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                                        style={{
                                            background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`,
                                            boxShadow: `0 8px 20px -6px ${feature.color}`,
                                        }}
                                    >
                                        <div className="scale-75 sm:scale-100">{feature.icon}</div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
                                    <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-extrabold tracking-tight text-[#000D6A] transition-colors duration-300 group-hover:text-[#23509A] dark:text-white dark:group-hover:text-blue-400">
                                        {feature.title}
                                    </h3>
                                    <p className="mb-4 sm:mb-6 flex-1 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                        {feature.description}
                                    </p>

                                    {/* Capabilities tag grid */}
                                    <div className="mt-auto">
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {feature.capabilities.map((capability, capIndex) => (
                                                <span
                                                    key={capIndex}
                                                    className="inline-flex items-center rounded-md sm:rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold transition-all duration-300"
                                                    style={{
                                                        backgroundColor: `${feature.color}0c`,
                                                        color: feature.color,
                                                        border: `1px solid ${feature.color}15`,
                                                    }}
                                                >
                                                    <CheckCircle className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" style={{ color: feature.color }} />
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
                        className="absolute top-1/2 right-0 z-10 hidden -translate-y-1/2 items-center justify-center rounded-2xl bg-white p-4 text-[#000D6A] shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-[#23509A]/10 transition-all duration-300 hover:translate-x-1 hover:bg-[#23509A] hover:text-white hover:shadow-xl active:scale-95 lg:flex cursor-pointer dark:bg-slate-800 dark:text-white dark:ring-slate-700 dark:hover:bg-blue-600"
                        aria-label="Next"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>

                {/* High-Contrast Interactive Slide Indicator */}
                <div className="mt-8 flex items-center justify-center gap-2 sm:gap-2.5">
                    {features.map((feature, index) => {
                        const isActive = activeIndex === index;
                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => scrollToSlide(index)}
                                className={`group relative transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000D6A] focus-visible:ring-offset-2 ${
                                    isActive
                                        ? 'h-3 w-8 sm:w-10 rounded-full bg-[#000D6A] shadow-md shadow-[#000D6A]/30 dark:bg-blue-500 dark:shadow-blue-500/30 ring-2 ring-[#000D6A]/20 dark:ring-blue-400/30'
                                        : 'h-3 w-3 rounded-full bg-slate-300 hover:bg-[#23509A]/70 dark:bg-slate-700 dark:hover:bg-slate-500 ring-1 ring-slate-400/30 dark:ring-slate-600/30'
                                }`}
                                aria-label={`Go to feature ${index + 1}: ${feature.title}`}
                                aria-current={isActive ? 'true' : 'false'}
                            />
                        );
                    })}
                </div>

                {/* Bottom CTA Card */}
                <div className="mt-12 sm:mt-20">
                    <div className="mx-auto max-w-4xl rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white to-[#FBFBFB] p-5 sm:p-8 md:p-12 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-[#23509A]/10 text-center relative overflow-hidden dark:from-slate-900 dark:to-slate-900/80 dark:border-slate-800">
                        {/* Gradient background glows inside card */}
                        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#23509A]/5 blur-2xl" />
                        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#000D6A]/5 blur-2xl" />
                        
                        <div className="relative z-10 space-y-4 sm:space-y-6">
                            <div className="inline-flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#23509A] to-[#000D6A] text-white shadow-lg">
                                <Database className="h-6 w-6 sm:h-8 sm:w-8" />
                            </div>
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#000D6A] dark:text-white">
                                All-in-One Integrated Solution
                            </h3>
                            <p className="mx-auto max-w-2xl text-xs sm:text-base md:text-lg leading-relaxed text-slate-500 dark:text-slate-400">
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
