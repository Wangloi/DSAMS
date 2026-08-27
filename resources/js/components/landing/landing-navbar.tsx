import { dashboard, login } from '@/routes';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingNavbar({ isAuthed }: { isAuthed: boolean }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { url } = usePage();
    const [currentHash, setCurrentHash] = useState('');

    useEffect(() => {
        const handleHashChange = () => {
            setCurrentHash(window.location.hash);
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const isLinkActive = (targetUrl: string) => {
        // If targetUrl is an exact path like '/help'
        if (targetUrl === '/help' && url.startsWith('/help')) return true;
        if (targetUrl === '/about' && url.startsWith('/about')) return true;
        if (targetUrl === '/features' && url.startsWith('/features'))
            return true;

        // For landing page section hashes (/ #home, / #about, etc)
        const isLandingPage = url === '/' || url.startsWith('/#') || url === '';
        if (isLandingPage) {
            if (
                targetUrl === '/#home' &&
                (currentHash === '' || currentHash === '#home')
            )
                return true;
            if (targetUrl === '/#about' && currentHash === '#about')
                return true;
            if (targetUrl === '/#mission' && currentHash === '#mission')
                return true;
            if (targetUrl === '/#contact' && currentHash === '#contact')
                return true;
            if (
                targetUrl === '/#services' &&
                (currentHash === '#services' || currentHash === '#features')
            )
                return true;
        }

        return false;
    };

    const navItemClass = (targetUrl: string) => {
        const active = isLinkActive(targetUrl);
        return `relative py-2 transition-colors duration-200 hover:text-[#23509A] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-left after:bg-[#23509A] after:transition-transform after:duration-300 hover:after:scale-x-100 ${
            active
                ? 'text-[#23509A] font-bold after:scale-x-100'
                : 'text-[#000D6A] after:scale-x-0'
        }`;
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <header className="fixed top-0 z-50 w-full border-b border-[#23509A]/10 bg-[#FBFBFB]/95 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <img
                            src="/images/SRCB.png"
                            alt="SRCB Logo"
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white object-cover"
                        />
                        <img
                            src="/images/DSA.png"
                            alt="DSA Logo"
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white object-cover"
                        />
                    </div>
                    <div className="leading-tight">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="text-base font-extrabold tracking-wide text-[#000D6A] sm:text-lg">
                                OSAMS
                            </div>
                            <span className="hidden text-[#000D6A]/30 sm:inline">/</span>
                            <span className="hidden text-xs font-semibold text-[#000D6A]/90 lg:inline">
                                Office of the Student Affairs Management System
                            </span>
                            <span className="hidden text-xs font-semibold text-[#000D6A]/90 md:inline lg:hidden">
                                Student Affairs Management
                            </span>
                        </div>
                        <div className="hidden text-[10px] font-semibold text-[#000D6A]/80 sm:block">
                            St. Rita's College of Balingasag
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-4 text-sm font-medium md:flex lg:gap-8">
                        <Link href="/#home" className={navItemClass('/#home')}>
                            Home
                        </Link>
                        <Link
                            href="/#about"
                            className={navItemClass('/#about')}
                        >
                            About Us
                        </Link>
                        <Link
                            href="/#mission"
                            className={navItemClass('/#mission')}
                        >
                            Mission & Vision
                        </Link>
                        <Link
                            href="/#contact"
                            className={navItemClass('/#contact')}
                        >
                            Contact
                        </Link>
                        <Link
                            href="/#services"
                            className={navItemClass('/#services')}
                        >
                            Services
                        </Link>
                        <Link href="/help" className={navItemClass('/help')}>
                            Help
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className="rounded-lg p-2 text-[#000D6A] transition-colors duration-200 hover:bg-[#23509A]/10 md:hidden"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>

                    {/* Auth Button */}
                    {isAuthed ? (
                        <Link
                            href={dashboard()}
                            className="rounded-xl bg-[#23509A] px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#000D6A] hover:shadow-xl active:translate-y-0 sm:px-5 sm:py-2 sm:text-sm"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href={login()}
                            className="rounded-xl bg-[#23509A] px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#000D6A] hover:shadow-xl active:translate-y-0 sm:px-5 sm:py-2 sm:text-sm"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="border-t border-[#23509A]/10 bg-[#FBFBFB]/95 backdrop-blur-md md:hidden">
                    <div className="space-y-4 px-4 py-6">
                        <Link
                            href="/#home"
                            onClick={() => setIsMenuOpen(false)}
                            className={`block py-2 transition-colors duration-200 ${isLinkActive('/#home') ? 'border-l-2 border-[#23509A] pl-3 font-bold text-[#23509A]' : 'text-[#000D6A] hover:text-[#23509A]'}`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/#about"
                            onClick={() => setIsMenuOpen(false)}
                            className={`block py-2 transition-colors duration-200 ${isLinkActive('/#about') ? 'border-l-2 border-[#23509A] pl-3 font-bold text-[#23509A]' : 'text-[#000D6A] hover:text-[#23509A]'}`}
                        >
                            About Us
                        </Link>
                        <Link
                            href="/#mission"
                            onClick={() => setIsMenuOpen(false)}
                            className={`block py-2 transition-colors duration-200 ${isLinkActive('/#mission') ? 'border-l-2 border-[#23509A] pl-3 font-bold text-[#23509A]' : 'text-[#000D6A] hover:text-[#23509A]'}`}
                        >
                            Mission &amp; Vision
                        </Link>
                        <Link
                            href="/#contact"
                            onClick={() => setIsMenuOpen(false)}
                            className={`block py-2 transition-colors duration-200 ${isLinkActive('/#contact') ? 'border-l-2 border-[#23509A] pl-3 font-bold text-[#23509A]' : 'text-[#000D6A] hover:text-[#23509A]'}`}
                        >
                            Contact
                        </Link>
                        <Link
                            href="/#services"
                            onClick={() => setIsMenuOpen(false)}
                            className={`block py-2 transition-colors duration-200 ${isLinkActive('/#services') ? 'border-l-2 border-[#23509A] pl-3 font-bold text-[#23509A]' : 'text-[#000D6A] hover:text-[#23509A]'}`}
                        >
                            Services
                        </Link>
                        <Link
                            href="/help"
                            onClick={() => setIsMenuOpen(false)}
                            className={`block py-2 transition-colors duration-200 ${isLinkActive('/help') ? 'border-l-2 border-[#23509A] pl-3 font-bold text-[#23509A]' : 'text-[#000D6A] hover:text-[#23509A]'}`}
                        >
                            Help &amp; Documentation
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
