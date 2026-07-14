import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import VideoBackground from '@/components/VideoBackground';
import { login, register } from '@/routes';

export default function LandingHero({
  canRegister,
}: {
  canRegister: boolean;
}) {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Badge positioned at section level - completely isolated */}
      <div className="absolute top-28 left-1/2 transform translate-x-1/2 z-30 lg:left-1/10 lg:translate-x-0">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white/80 border border-white/20">
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Modern Student Management System</span>
          <span className="sm:hidden">OSAMS</span>
        </div>
      </div>

      {/* Video Background */}
      <VideoBackground />

      {/* Dark Overlay - Lighter and less blue */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #acb1b9ff 2px, transparent 3px), radial-gradient(circle at 75% 75%, #FFFFFF 2px, transparent 2px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 min-h-[80vh] sm:min-h-screen">

          {/* Content */}
          <div className="space-y-6 sm:space-y-8 text-white order-2 lg:order-1">

            <div className="space-y-3 sm:space-y-4">
              <div className="text-lg sm:text-xl md:text-2xl font-semibold text-white/95">

              </div>

              <h1 className="text-2xl sm:text-3xl font-bold leading-tight md:text-4xl lg:text-5xl xl:text-6xl">
                Streamline Student Affairs with
                <span className="bg-gradient-to-r from-[#8CE4FF] to-[#261CC1] bg-clip-text text-transparent"> OSA Management</span>
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-white/90 md:text-lg lg:text-xl max-w-xl">
                The Office of Student Affairs (OSA) manages student activities, discipline,
                and attendance, ensuring student welfare and maintaining campus order through
                innovative digital solutions.
              </p>
            </div>



            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row pt-2 sm:pt-4">
              <Link
                href={login()}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#23509A] px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:bg-white hover:text-[#23509A] hover:shadow-2xl hover:-translate-y-1"
              >
                Get Started
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              {canRegister && (
                <Link
                  href={register()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white bg-transparent px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all duration-300 hover:bg-white hover:text-[#000D6A] hover:shadow-xl hover:-translate-y-1"
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
              <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-2xl ring-1 ring-white/20">
                <div className="space-y-4 sm:space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#23509A] flex items-center justify-center">
                      <img src="/images/DSA.png" alt="DSA" className="h-5 w-5 sm:h-6 sm:w-6 rounded object-cover" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#000D6A] text-sm sm:text-base">OSAMS Dashboard</h3>
                      <p className="text-xs sm:text-sm text-[#000000]/60">Real-time monitoring</p>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-lg bg-[#23509A]/10 p-3 sm:p-4">
                      <div className="text-xl sm:text-2xl font-bold text-[#23509A]">98%</div>
                      <div className="text-xs sm:text-sm text-[#000000]/70">Attendance</div>
                    </div>
                    <div className="rounded-lg bg-[#000D6A]/10 p-3 sm:p-4">
                      <div className="text-xl sm:text-2xl font-bold text-[#000D6A]">24</div>
                      <div className="text-xs sm:text-sm text-[#000000]/70">Active Events</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#000000]/70">Today's Progress</span>
                      <span className="font-medium text-[#23509A]">85%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#23509A]/20">
                      <div className="h-full w-[85%] rounded-full bg-[#23509A]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 rounded-xl bg-[#000D6A] p-3 sm:p-4 text-white shadow-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-medium text-sm">Live Updates</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 rounded-xl bg-[#23509A] p-3 sm:p-4 text-white shadow-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold">QR</span>
                  </div>
                  <span className="font-medium text-sm">Scan Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
