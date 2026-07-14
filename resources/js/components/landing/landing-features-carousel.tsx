import {
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  FileText,
  QrCode,
  BarChart3,
  Archive,
  Shield,
  TrendingUp,
  CheckCircle,
  Database
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
      description: 'Real-time attendance tracking with QR code scanning for events, seminars, and activities. Automated check-in/out with comprehensive attendance analytics.',
      imageSrc: '/images/qr-code-attendance.jpeg',
      icon: <Calendar className="h-8 w-8" />,
      color: '#23509A',
      capabilities: ['QR Code Scanning', 'Real-time Tracking', 'Event Management', 'Attendance Reports']
    },


    {
      title: 'User Management',
      description: 'Comprehensive user administration for students, CSG representatives, program heads, and administrators with role-based access control.',
      imageSrc: '/images/N1-0319-End-User-Management-blog-image-qfpi39udjowh7wlpwlidr3vdn08ym015a6d8nzql6u.webp',
      icon: <Users className="h-8 w-8" />,
      color: '#000D6A',


      capabilities: ['Student Profiles', 'Role Management', 'Access Control', 'User Analytics']
    },
    {
      title: 'Admission Slip System',
      description: 'Digital admission slip creation and management for disciplinary cases, appointments, and special permissions with automated approval workflows.',
      imageSrc: '/images/Admission Slip.png',
      icon: <FileText className="h-8 w-8" />,
      color: '#23509A',


      capabilities: ['Digital Slips', 'Case Tracking', 'Approval Workflow', 'Print Integration']
    },
    {
      title: 'Incidents & Violations',
      description: 'Comprehensive tracking of student disciplinary incidents, violations, and behavioral records with detailed case management and follow-up tracking.',

      imageSrc: '/images/Incident_Report.jpg',
      icon: <Shield className="h-8 w-8" />,
      color: '#000D6A',
      capabilities: ['Incident Logging', 'Case Management', 'Violation Tracking', 'Behavioral Analytics']
    },




    {
      title: 'Student Evaluations',
      description: 'QR code-based evaluation forms for events and seminars with instant feedback collection and comprehensive survey analytics.',
      imageSrc: '/images/Evaluation.webp',
      icon: <QrCode className="h-8 w-8" />,
      color: '#23509A',
      capabilities: ['QR Evaluation', 'Instant Feedback', 'Survey Analytics', 'Event Assessment']
    },
    {
      title: 'Analytics & Reports',
      description: 'Advanced analytics dashboard with real-time statistics, trend analysis, and comprehensive reporting for data-driven decision making.',
      imageSrc: '/images/analytics and report.webp',
      icon: <BarChart3 className="h-8 w-8" />,
      color: '#000D6A',
      capabilities: ['Real-time Stats', 'Trend Analysis', 'Custom Reports', 'Data Visualization']
    },
    {
      title: 'Archive System',
      description: 'Secure data archiving with automated backup, retention policies, and easy retrieval for historical records and compliance requirements.',
      imageSrc: '/images/archive.avif',
      icon: <Archive className="h-8 w-8" />,
      color: '#23509A',
      capabilities: ['Automated Backup', 'Retention Policies', 'Secure Storage', 'Quick Retrieval']
    },
    {
      title: 'Performance Monitoring',
      description: 'Comprehensive performance tracking with KPI monitoring, system health checks, and efficiency metrics for continuous improvement.',
      imageSrc: '/images/Performance-Monitoring.jpg',
      icon: <TrendingUp className="h-8 w-8" />,
      color: '#000D6A',
      capabilities: ['KPI Tracking', 'System Health', 'Efficiency Metrics', 'Performance Reports']
    }
  ];

  const scrollByAmount = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(360, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section id="features" className="bg-[#FBFBFB] py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold text-[#000D6A] lg:text-5xl">
            Key Features of OSAMS
          </h2>
          <p className="text-lg font-medium text-[#23509A] lg:text-xl">
            Comprehensive Student Affairs Management
          </p>
          <div className="mx-auto max-w-3xl">
            <p className="text-[#000000]/70 text-lg">
              Discover the powerful tools that streamline student affairs management
              and enhance campus efficiency with our all-in-one solution.
            </p>
          </div>
        </div>

        <div className="relative mt-16">
          {/* Navigation Buttons */}
          <button
            type="button"
            onClick={() => scrollByAmount(-1)}
            className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-3 text-[#23509A] shadow-lg ring-1 ring-[#23509A]/20 transition-all duration-200 hover:bg-[#23509A] hover:text-white hover:shadow-xl lg:flex"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-8 overflow-x-auto px-4 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] lg:px-16 [&::-webkit-scrollbar]:hidden"
          >
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="group relative w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-[#23509A]/10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 lg:w-[360px]"
              >
                {/* Icon Badge */}
                <div
                  className="absolute top-6 right-6 z-10 rounded-full p-3 text-white shadow-lg"
                  style={{ backgroundColor: feature.color }}
                >
                  {feature.icon}
                </div>

                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={feature.imageSrc}
                    alt={feature.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20"
                    style={{ backgroundColor: feature.color }}
                  />
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="text-xl font-bold text-[#000D6A] mb-4 group-hover:text-[#23509A] transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Capabilities */}
                  <div className="space-y-2 mb-6">
                    {feature.capabilities.slice(0, 2).map((capability, capIndex) => (
                      <div key={capIndex} className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{capability}</span>
                      </div>
                    ))}
                  </div>

                  {/* Feature Number */}
                  <div className="flex items-center justify-between">
                    <div
                      className="rounded-full px-3 py-1 text-sm font-semibold text-white"
                      style={{ backgroundColor: feature.color }}
                    >
                      Feature {index + 1}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-3 text-[#23509A] shadow-lg ring-1 ring-[#23509A]/20 transition-all duration-200 hover:bg-[#23509A] hover:text-white hover:shadow-xl lg:flex"
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
              className="h-2 w-2 rounded-full bg-[#23509A]/30 transition-all duration-200 hover:bg-[#23509A]"
              onClick={() => {
                const el = trackRef.current;
                if (!el) return;
                const cardWidth = 360 + 32; // card width + gap
                el.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
              }}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#23509A] rounded-full mb-6">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-[#000D6A] mb-4">
            All-in-One Solution
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            OSAMS integrates all these features into a unified, user-friendly platform that
            simplifies student affairs management and enhances institutional efficiency.
          </p>
        </div>
      </div>
    </section>
  );
}
