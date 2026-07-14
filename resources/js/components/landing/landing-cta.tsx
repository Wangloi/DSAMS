import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle, Users, Shield, Award } from 'lucide-react';

interface Props {
  canRegister: boolean;
}

export default function LandingCta({ canRegister }: Props) {
  return (
    <section id="get-started" className="bg-[#000D6A] py-24 lg:py-32 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #23509A 2px, transparent 2px), radial-gradient(circle at 75% 75%, #FBFBFB 2px, transparent 2px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/20">
              <CheckCircle className="h-4 w-4" />
              Ready to Get Started?
            </div>

            <h2 className="text-3xl font-bold leading-tight text-white lg:text-5xl">
              Join Thousands of Institutions
            </h2>

            <p className="text-lg leading-relaxed text-white/80 lg:text-xl max-w-2xl mx-auto">
              Start managing your student affairs more efficiently with our comprehensive
              OSA Management System. Trusted by educational institutions nationwide.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#23509A] mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Student Management</h3>
              <p className="text-white/70 text-sm">Comprehensive student data and welfare management</p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#23509A] mx-auto mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure & Reliable</h3>
              <p className="text-white/70 text-sm">Enterprise-grade security for sensitive data</p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#23509A] mx-auto mb-4">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Award Winning</h3>
              <p className="text-white/70 text-sm">Recognized for innovation in education technology</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#23509A] px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:bg-white hover:text-[#23509A] hover:shadow-2xl hover:-translate-y-1"
            >
              Student Portal
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/program-head-login"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-[#000D6A] shadow-xl transition-all duration-300 hover:bg-[#23509A] hover:text-white hover:shadow-2xl hover:-translate-y-1"
            >
              Program Head Portal
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/admin-login"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FBFBFB] px-8 py-4 text-lg font-semibold text-[#000D6A] shadow-xl transition-all duration-300 hover:bg-[#23509A] hover:text-white hover:shadow-2xl hover:-translate-y-1"
            >
              Admin Portal
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">2000+</div>
              <div className="text-white/70 text-sm">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-white/70 text-sm">Events Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">99%</div>
              <div className="text-white/70 text-sm">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-white/70 text-sm">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
