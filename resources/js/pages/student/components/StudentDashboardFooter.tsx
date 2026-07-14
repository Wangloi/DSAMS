import { Link } from '@inertiajs/react';
import {
    Facebook,
    Instagram,
    Mail,
    MapPin,
    Phone,
    Youtube,
    ArrowUp,
    ChevronRight,
    Globe,
    ShieldCheck
} from 'lucide-react';

export function StudentDashboardFooter() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-20 overflow-hidden bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-[#0B192C] transition-colors duration-500">
            {/* Top Border with Gradient */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 dark:via-slate-800 to-transparent" />

            {/* Decorative Background Elements */}
            <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none opacity-40">
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-400/10 rounded-full blur-[100px]" />
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-400/10 rounded-full blur-[100px]" />
            </div>

            {/* Bottom Bar */}
            <div className=" pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="w-full text-center">
                    <div className="text-blue-100/50 text-xs font-bold">
                        © {currentYear} OSAMS. All Rights Reserved.
                    </div>
                </div>

                <button
                    onClick={scrollToTop}
                    className="h-12 w-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-2xl transition-all duration-300 hover:-translate-y-2 active:scale-95 group"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="h-5 w-5 group-hover:animate-bounce" />
                </button>
            </div>
        </footer>
    );
}
