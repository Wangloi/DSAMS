import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    ArrowUp,
    Facebook,
    Instagram,
    Mail,
    MapPin,
    Phone,
    Youtube,
} from 'lucide-react';

export default function LandingFooter() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer
            id="contact"
            className="relative overflow-hidden bg-[#000D6A] text-white"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, #23509A 1px, transparent 1px), radial-gradient(circle at 75% 75%, #FBFBFB 1px, transparent 1px)`,
                        backgroundSize: '30px 30px',
                    }}
                />
            </div>

            <div className="relative">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:px-8">
                    <div className="grid gap-8 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Brand Section */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#23509A] shrink-0">
                                    <img
                                        src="/images/DSA.png"
                                        alt="Dean of Student Affairs"
                                        className="h-6 w-6 sm:h-7 sm:w-7 rounded object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="text-base sm:text-lg font-bold text-white">
                                        OSAMS
                                    </div>
                                    <div className="text-xs sm:text-sm text-blue-300">
                                        Management System
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs sm:text-sm leading-relaxed text-white/80">
                                Nurturing Faith, Passion for Excellence &
                                Commitment for Humble Service.
                            </p>

                            <div className="flex items-center gap-3 sm:gap-4">
                                <a
                                    href="https://www.facebook.com/srcbofficial"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-[#23509A]"
                                    aria-label="Facebook"
                                >
                                    <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                                </a>
                                <a
                                    href="#"
                                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-[#23509A]"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                                </a>
                                <a
                                    href="https://www.youtube.com/@St.RitasCollegeBalingasag"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-[#23509A]"
                                    aria-label="YouTube"
                                >
                                    <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
                                </a>
                                <a
                                    href="mailto:ritarian@srcb.edu.ph"
                                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-[#23509A]"
                                    aria-label="Email"
                                >
                                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-4 sm:space-y-6">
                            <h4 className="text-base sm:text-lg font-semibold text-white">
                                Quick Links
                            </h4>
                            <nav className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                                <Link
                                    href="/#home"
                                    className="block text-white/80 transition-colors duration-200 hover:text-[#8CE4FF]"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/#features"
                                    className="block text-white/80 transition-colors duration-200 hover:text-[#8CE4FF]"
                                >
                                    Features
                                </Link>
                                <Link
                                    href="/#about"
                                    className="block text-white/80 transition-colors duration-200 hover:text-[#8CE4FF]"
                                >
                                    About Us
                                </Link>
                                <Link
                                    href="/#contact"
                                    className="block text-white/80 transition-colors duration-200 hover:text-[#8CE4FF]"
                                >
                                    Contact
                                </Link>
                            </nav>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4 sm:space-y-6">
                            <h4 className="text-base sm:text-lg font-semibold text-white">
                                Contact Information
                            </h4>
                            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <Phone className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#8CE4FF]" />
                                    <div className="text-white/80">
                                        <div className="mb-0.5 text-xs font-semibold text-white">
                                            Mobile Phone:
                                        </div>
                                        <div>0929-734-0012 (SMART)</div>
                                        <div>0953-280-2090 (TM)</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <Phone className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#8CE4FF]" />
                                    <div className="text-white/80">
                                        <div className="mb-0.5 text-xs font-semibold text-white">
                                            Telephone:
                                        </div>
                                        <div>(088) 323-7159</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <Mail className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#8CE4FF]" />
                                    <div className="text-white/80">
                                        <div className="mb-0.5 text-xs font-semibold text-white">
                                            Email:
                                        </div>
                                        <div className="break-all">ritarian@srcb.edu.ph</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#8CE4FF]" />
                                    <div className="text-white/80">
                                        <div className="mb-0.5 text-xs font-semibold text-white">
                                            Address:
                                        </div>
                                        <div>
                                            St. Rita's College of Balingasag,
                                            Balingasag, Misamis Oriental,
                                            9005 Philippines
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Map */}
                        <div className="space-y-4 sm:space-y-6">
                            <h4 className="text-base sm:text-lg font-semibold text-white">
                                Our Location
                            </h4>
                            <div className="overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
                                <iframe
                                    title="Map"
                                    className="h-40 sm:h-48 w-full"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src="https://www.google.com/maps?q=St.%20Rita%27s%20College%20of%20Balingasag&output=embed"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-8 sm:mt-12 border-t border-white/10 pt-6 sm:pt-8 pb-10 sm:pb-12">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                            <div className="text-xs sm:text-sm text-white/70">
                                © {new Date().getFullYear()} OSAMS. All rights
                                reserved.
                            </div>

                            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/70">
                                <Link
                                    href="#"
                                    className="transition-colors duration-200 hover:text-[#8CE4FF]"
                                >
                                    Privacy Policy
                                </Link>
                                <Link
                                    href="#"
                                    className="transition-colors duration-200 hover:text-[#8CE4FF]"
                                >
                                    Terms of Service
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Scroll to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#23509A] text-white shadow-2xl ring-2 ring-white/10 transition-all duration-300 hover:scale-110 hover:bg-white hover:text-[#23509A] ${
                    isVisible
                        ? 'translate-y-0 opacity-100 pointer-events-auto'
                        : 'translate-y-8 opacity-0 pointer-events-none'
                }`}
                aria-label="Scroll to top"
            >
                <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
        </footer>
    );
}
