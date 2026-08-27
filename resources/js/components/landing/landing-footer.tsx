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
                <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-4">
                        {/* Brand Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#23509A]">
                                    <img
                                        src="/images/DSA.png"
                                        alt="Dean of Student Affairs"
                                        className="h-7 w-7 rounded object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">
                                        OSAMS
                                    </div>
                                    <div className="text-sm text-[#23509A]">
                                        Management System
                                    </div>
                                </div>
                            </div>

                            <p className="leading-relaxed text-white/80">
                                Nurturing Faith, Passion for Excellence &
                                Commitment for Humble Service.
                            </p>

                            <div className="flex items-center gap-4">
                                <a
                                    href="https://www.facebook.com/srcbofficial"
                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-[#23509A]"
                                    aria-label="Facebook"
                                >
                                    <Facebook className="h-5 w-5" />
                                </a>
                                <a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-[#23509A]"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://www.youtube.com/@St.RitasCollegeBalingasag"
                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-[#23509A]"
                                    aria-label="YouTube"
                                >
                                    <Youtube className="h-5 w-5" />
                                </a>
                                <a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors duration-200 hover:bg-[#23509A]"
                                    aria-label="Email"
                                >
                                    <Mail className="h-5 w-5" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-semibold text-white">
                                Quick Links
                            </h4>
                            <nav className="space-y-3">
                                <Link
                                    href="/#home"
                                    className="block text-white/80 transition-colors duration-200 hover:text-[#23509A]"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/#features"
                                    className="block text-white/80 transition-colors duration-200 hover:text-[#23509A]"
                                >
                                    Features
                                </Link>
                                <Link
                                    href="/#about"
                                    className="block text-white/80 transition-colors duration-200 hover:text-[#23509A]"
                                >
                                    About Us
                                </Link>
                                <Link
                                    href="/#contact"
                                    className="block text-white/80 transition-colors duration-200 hover:text-[#23509A]"
                                >
                                    Contact
                                </Link>
                            </nav>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-semibold text-white">
                                Contact Information
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#23509A]" />
                                    <div className="text-white/80">
                                        <div className="mb-1 text-sm font-medium text-white">
                                            Mobile Phone:
                                        </div>
                                        <div className="text-sm">
                                            0929-734-0012 (SMART)
                                        </div>
                                        <div className="text-sm">
                                            0953-280-2090 (TM)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#23509A]" />
                                    <div className="text-white/80">
                                        <div className="mb-1 text-sm font-medium text-white">
                                            Telephone:
                                        </div>
                                        <div className="text-sm">
                                            (088) 323-7159
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#23509A]" />
                                    <div className="text-white/80">
                                        <div className="mb-1 text-sm font-medium text-white">
                                            Email:
                                        </div>
                                        <div className="text-sm">
                                            ritarian@srcb.edu.ph
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#23509A]" />
                                    <div className="text-white/80">
                                        <div className="mb-1 text-sm font-medium text-white">
                                            Address:
                                        </div>
                                        <div className="text-sm">
                                            St. Rita's College of Balingasag
                                            <br />
                                            Balingasag, Misamis Oriental
                                            <br />
                                            9005 Philippines
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Map */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-semibold text-white">
                                Our Location
                            </h4>
                            <div className="overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
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
                <div className="mt-12 border-t border-white/10 pt-8 pb-12">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            <div className="text-sm text-white/70">
                                © {new Date().getFullYear()} OSAMS. All rights
                                reserved.
                            </div>

                            <div className="flex items-center gap-6 text-sm text-white/70">
                                <Link
                                    href="#"
                                    className="transition-colors duration-200 hover:text-[#23509A]"
                                >
                                    Privacy Policy
                                </Link>
                                <Link
                                    href="#"
                                    className="transition-colors duration-200 hover:text-[#23509A]"
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
                className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#23509A] text-white shadow-2xl ring-2 ring-white/10 transition-all duration-300 hover:scale-110 hover:bg-white hover:text-[#23509A] ${
                    isVisible
                        ? 'translate-y-0 opacity-100 pointer-events-auto'
                        : 'translate-y-8 opacity-0 pointer-events-none'
                }`}
                aria-label="Scroll to top"
            >
                <ArrowUp className="h-5 w-5" />
            </button>
        </footer>
    );
}
