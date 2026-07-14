import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { dashboard, login } from '@/routes';

export default function LandingNavbar({
  isAuthed,
}: {
  isAuthed: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  return (
    <header className="fixed top-0 z-50 w-full border-b border-[#23509A]/10 bg-[#FBFBFB]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/images/SRCB.png"
              alt="SRCB Logo"
              className="h-10 w-10 rounded-full bg-white object-cover"
            />
            <img
              src="/images/DSA.png"
              alt="DSA Logo"
              className="h-10 w-10 rounded-full bg-white object-cover"
            />
          </div>
          <div className="leading-tight">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-lg font-bold tracking-wide text-[#000D6A]">OSAMS</div>
              <div className="text-[#000D6A]/50">/</div>
              <div className="text-xs font-semibold text-[#000D6A]/90">Office of the Student Affairs Management System</div>
            </div>
            <div className="text-[11px] font-semibold text-[#000D6A]/80">St. Rita's College of Balingasag</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/#home"
              className="relative py-2 text-[#000D6A] transition-colors duration-200 hover:text-[#23509A] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[#23509A] after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              Home
            </Link>
            <Link
              href="/#about"
              className="relative py-2 text-[#000D6A] transition-colors duration-200 hover:text-[#23509A] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[#23509A] after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              About Us
            </Link>
            <Link
              href="#"
              className="relative py-2 text-[#000D6A] transition-colors duration-200 hover:text-[#23509A] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[#23509A] after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              Mission & Vision
            </Link>
            <Link
              href="/#contact"
              className="relative py-2 text-[#000D6A] transition-colors duration-200 hover:text-[#23509A] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[#23509A] after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              Contact
            </Link>
            <Link
              href="#"
              className="relative py-2 text-[#000D6A] transition-colors duration-200 hover:text-[#23509A] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[#23509A] after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              Services
            </Link>
            <Link
              href="/help"
              className="relative py-2 text-[#000D6A] transition-colors duration-200 hover:text-[#23509A] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[#23509A] after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              Help
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg text-[#000D6A] hover:bg-[#23509A]/10 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Auth Button */}
          {isAuthed ? (
            <Link
              href={dashboard()}
              className="rounded-lg bg-[#23509A] px-4 py-2 sm:px-6 sm:py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[#000D6A] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href={login()}
              className="rounded-lg bg-[#23509A] px-4 py-2 sm:px-6 sm:py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[#000D6A] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[#23509A]/10 bg-[#FBFBFB]/95 backdrop-blur-md">
          <div className="px-4 py-6 space-y-4">
            <Link
              href="/#home"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-[#000D6A] hover:text-[#23509A] transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/#about"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-[#000D6A] hover:text-[#23509A] transition-colors duration-200"
            >
              About Us
            </Link>
            <Link
              href="#"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-[#000D6A] hover:text-[#23509A] transition-colors duration-200"
            >
              Admission Slip
            </Link>
            <Link
              href="/#contact"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-[#000D6A] hover:text-[#23509A] transition-colors duration-200"
            >
              Contact
            </Link>
            <Link
              href="#"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-[#000D6A] hover:text-[#23509A] transition-colors duration-200"
            >
              Services
            </Link>
            <Link
              href="/help"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-[#000D6A] hover:text-[#23509A] transition-colors duration-200"
            >
              Help &amp; Documentation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
