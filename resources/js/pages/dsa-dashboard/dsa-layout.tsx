import { AppShell } from '@/components/app-shell';
import { UserMenuContent } from '@/components/user-menu-content';
import type { BreadcrumbItem, PageProps, User } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Award, Calendar, FileText, Home, Users } from 'lucide-react';

interface DSALayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function DSALayout({
    children,
    breadcrumbs = [],
}: DSALayoutProps) {
    const { props } = usePage<PageProps>();
    const user = props.auth.user as User;

    const navigation = [
        {
            name: 'Dashboard',
            href: '/dsa-dashboard',
            icon: Home,
            current: route().current('dsa.dashboard'),
        },
        {
            name: 'Admission Slip',
            href: '/dsa/admission-slip',
            icon: FileText,
            current: route().current('dsa.admission-slip'),
        },
        {
            name: 'Students',
            href: '/dsa/students',
            icon: Users,
            current: route().current('dsa.students'),
        },
        {
            name: 'Events',
            href: '/dsa/events',
            icon: Calendar,
            current: route().current('dsa.events'),
        },
        {
            name: 'Certificates',
            href: '/dsa/certificates',
            icon: Award,
            current: route().current('dsa.certificates'),
        },
    ];

    return (
        <AppShell>
            <div className="flex min-h-screen bg-gray-50">
                {/* Sidebar */}
                <div className="hidden md:flex md:w-64 md:flex-col">
                    <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5 pb-4">
                        <div className="flex flex-shrink-0 items-center px-4">
                            <img
                                className="h-8 w-auto"
                                src="/images/SRCB.png"
                                alt="SRCB"
                            />
                            <span className="ml-2 text-xl font-semibold text-gray-900">
                                DSA Portal
                            </span>
                        </div>
                        <nav className="mt-8 flex-1 space-y-1 px-2">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${
                                        item.current
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                                >
                                    <item.icon
                                        className={`${
                                            item.current
                                                ? 'text-blue-500'
                                                : 'text-gray-400 group-hover:text-gray-500'
                                        } mr-3 h-5 w-5`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex flex-1 flex-col md:pl-0">
                    {/* Top header */}
                    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white">
                        <button
                            type="button"
                            className="border-r border-gray-200 px-4 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset md:hidden"
                        >
                            <span className="sr-only">Open sidebar</span>
                        </button>
                        <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-1">
                                {/* Breadcrumbs */}
                                {breadcrumbs.length > 0 && (
                                    <nav
                                        className="flex"
                                        aria-label="Breadcrumb"
                                    >
                                        <ol className="flex items-center space-x-2">
                                            {breadcrumbs.map(
                                                (breadcrumb, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-center"
                                                    >
                                                        {index > 0 && (
                                                            <svg
                                                                className="h-5 w-5 flex-shrink-0 text-gray-300"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                                aria-hidden="true"
                                                            >
                                                                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                                                            </svg>
                                                        )}
                                                        {breadcrumb.href ? (
                                                            <Link
                                                                href={
                                                                    breadcrumb.href
                                                                }
                                                                className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                                            >
                                                                {
                                                                    breadcrumb.title
                                                                }
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {
                                                                    breadcrumb.title
                                                                }
                                                            </span>
                                                        )}
                                                    </li>
                                                ),
                                            )}
                                        </ol>
                                    </nav>
                                )}
                            </div>
                            <div className="ml-4 flex items-center md:ml-6">
                                {/* User menu */}
                                <div className="relative">
                                    <UserMenuContent user={user} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page content */}
                    <main className="flex-1">{children}</main>
                </div>
            </div>
        </AppShell>
    );
}
