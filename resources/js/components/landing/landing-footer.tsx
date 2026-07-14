import { Link } from '@inertiajs/react';
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
  ArrowUp,
} from 'lucide-react';

export default function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="bg-[#000D6A] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #23509A 1px, transparent 1px), radial-gradient(circle at 75% 75%, #FBFBFB 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="relative">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16">
          <div className="grid gap-12 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#23509A] flex items-center justify-center">
                  <img
                    src="/images/DSA.png"
                    alt="Dean of Student Affairs"
                    className="h-7 w-7 rounded object-cover"
                  />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">OSAMS</div>
                  <div className="text-sm text-[#23509A]">Management System</div>
                </div>
              </div>

              <p className="text-white/80 leading-relaxed">
                Nurturing Faith, Passion for Excellence & Commitment for Humble Service.
              </p>

              <div className="flex items-center gap-4">
                <a
                  href="https://www.facebook.com/srcbofficial"
                  className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-[#23509A] transition-colors duration-200"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-[#23509A] transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.youtube.com/@St.RitasCollegeBalingasag"
                  className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-[#23509A] transition-colors duration-200"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-[#23509A] transition-colors duration-200"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Quick Links</h4>
              <nav className="space-y-3">
                <Link href="/#home" className="block text-white/80 hover:text-[#23509A] transition-colors duration-200">
                  Home
                </Link>
                <Link href="/#features" className="block text-white/80 hover:text-[#23509A] transition-colors duration-200">
                  Features
                </Link>
                <Link href="/#about" className="block text-white/80 hover:text-[#23509A] transition-colors duration-200">
                  About Us
                </Link>
                <Link href="/#contact" className="block text-white/80 hover:text-[#23509A] transition-colors duration-200">
                  Contact
                </Link>
              </nav>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#23509A] mt-0.5 flex-shrink-0" />
                  <div className="text-white/80">
                    <div className="font-medium text-white text-sm mb-1">Mobile Phone:</div>
                    <div className="text-sm">0929-734-0012 (SMART)</div>
                    <div className="text-sm">0953-280-2090 (TM)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#23509A] mt-0.5 flex-shrink-0" />
                  <div className="text-white/80">
                    <div className="font-medium text-white text-sm mb-1">Telephone:</div>
                    <div className="text-sm">(088) 323-7159</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#23509A] mt-0.5 flex-shrink-0" />
                  <div className="text-white/80">
                    <div className="font-medium text-white text-sm mb-1">Email:</div>
                    <div className="text-sm">ritarian@srcb.edu.ph</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#23509A] mt-0.5 flex-shrink-0" />
                  <div className="text-white/80">
                    <div className="font-medium text-white text-sm mb-1">Address:</div>
                    <div className="text-sm">
                      St. Rita's College of Balingasag<br />
                      Balingasag, Misamis Oriental<br />
                      9005 Philippines
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Our Location</h4>
              <div className="rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20">
                <iframe
                  title="Map"
                  className="h-48 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=St.%20Rita%27s%20College%20of%20Balingasag&output=embed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/70 text-sm">
              © {new Date().getFullYear()} OSAMS. All rights reserved.
            </div>

            <div className="flex items-center gap-6 text-sm text-white/70">
              <Link href="#" className="hover:text-[#23509A] transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-[#23509A] transition-colors duration-200">
                Terms of Service
              </Link>
            </div>

            {/* Scroll to Top */}
            <button
              onClick={scrollToTop}
              className="h-12 w-12 rounded-full bg-[#23509A] hover:bg-white hover:text-[#23509A] text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
