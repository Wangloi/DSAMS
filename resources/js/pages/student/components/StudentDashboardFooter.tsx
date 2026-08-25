import { ArrowUp } from 'lucide-react';

export function StudentDashboardFooter() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-10 overflow-hidden bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] transition-colors duration-500 sm:mt-20 dark:bg-[#0B192C] dark:from-transparent dark:via-transparent dark:to-transparent">
            {/* Top Border with Gradient */}
            <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-slate-800" />

            {/* Decorative Background Elements */}
            <div className="pointer-events-none absolute bottom-0 left-0 h-full w-full opacity-40">
                <div className="absolute bottom-[-10%] left-[-5%] h-96 w-96 rounded-full bg-blue-400/10 blur-[100px]" />
                <div className="absolute top-[-10%] right-[-5%] h-96 w-96 rounded-full bg-indigo-400/10 blur-[100px]" />
            </div>

            {/* Bottom Bar */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 px-4 pt-6 pb-4 sm:gap-8 sm:pt-8 md:flex-row">
                <div className="w-full text-center">
                    <div className="text-[10px] font-bold text-blue-100/50 sm:text-xs">
                        © {currentYear} OSAMS. All Rights Reserved.
                    </div>
                </div>

                <button
                    onClick={scrollToTop}
                    className="group flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-2xl transition-all duration-300 hover:-translate-y-2 active:scale-95 sm:h-12 sm:w-12 sm:rounded-2xl"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="h-4 w-4 group-hover:animate-bounce sm:h-5 sm:w-5" />
                </button>
            </div>
        </footer>
    );
}
