import { Link, usePage } from '@inertiajs/react';
import { Bell, ChevronDown } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
    homeHref?: string;
    fullWidth?: boolean;
};

export function AppHeader({
    breadcrumbs = [],
    homeHref,
    fullWidth = false,
}: Props) {
    const page = usePage<SharedData>();
    const { auth } = page.props;

    const unread = (page.props as any)?.unreadNotifications;
    const recent = (page.props as any)?.recentNotifications;

    const getInitials = useInitials();

    const roleLabel = auth?.user?.role ? String(auth?.user.role) : undefined;

    return (
        <>
            {fullWidth && <div className="h-16" />}
            <div
                className={
                    fullWidth
                        ? 'fixed inset-x-0 top-0 z-50 bg-[#0B4DFF] text-white'
                        : 'sticky top-0 z-50 bg-[#0B4DFF] text-white'
                }
            >
                <div className="flex h-16 w-full items-center px-4">
                    <Link
                        href={homeHref ?? dashboard()}
                        prefetch
                        className="flex items-center gap-2"
                    >
                        <img
                            src="/images/DSA.png"
                            alt="DSA Logo"
                            className="h-9 w-9 rounded-full bg-white object-cover"
                        />
                        <span className="text-base font-semibold tracking-wide">
                            OSAMS
                        </span>
                    </Link>

                    <div className="ml-auto flex items-center gap-3">
                        {auth?.user && (
                            <>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="relative h-10 w-10 rounded-full text-white hover:bg-white/15 hover:text-white"
                                        >
                                            <Bell className="h-5 w-5" />
                                            {typeof unread === 'number' &&
                                                unread > 0 && (
                                                    <span className="absolute top-2 right-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/90 px-1 text-[10px] font-bold text-[#0B4DFF]">
                                                        {unread}
                                                    </span>
                                                )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-[360px] p-2"
                                        align="end"
                                    >
                                        <div className="px-2 pt-1 pb-2">
                                            <div className="text-sm font-semibold text-neutral-900">
                                                Notifications
                                            </div>
                                            {typeof page.props
                                                .unreadNotifications ===
                                                'number' && (
                                                    <div className="text-xs text-neutral-500">
                                                        {
                                                            page.props
                                                                .unreadNotifications
                                                        }{' '}
                                                        unread
                                                    </div>
                                                )}
                                        </div>

                                        {Array.isArray(
                                            page.props.recentNotifications,
                                        ) &&
                                            page.props.recentNotifications.length >
                                            0 ? (
                                            <div className="max-h-[320px] overflow-auto">
                                                {page.props.recentNotifications.map((n: any) => {
                                                    const Wrapper = n?.url ? Link : 'div';
                                                    return (
                                                        <Wrapper
                                                            key={n?.id ?? Math.random()}
                                                            href={n?.url}
                                                            className={`block rounded-lg px-2 py-2 hover:bg-neutral-50 ${n?.url ? 'cursor-pointer' : 'cursor-default'}`}
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-medium text-neutral-900">
                                                                    {n?.title ?? 'Notification'}
                                                                </div>
                                                                {n?.subtitle && (
                                                                    <div className="truncate text-xs text-neutral-600">
                                                                        {n.subtitle}
                                                                    </div>
                                                                )}
                                                                {n?.timeAgo && (
                                                                    <div className="mt-1 text-[11px] text-neutral-500">
                                                                        {n.timeAgo}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Wrapper>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="px-2 py-3 text-sm text-neutral-600">
                                                No notifications.
                                            </div>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-10 gap-2 rounded-full px-2 text-white hover:bg-white/15 hover:text-white"
                                        >
                                            <Avatar className="size-8 overflow-hidden rounded-full">
                                                <AvatarImage
                                                    src={auth?.user.avatar ?? undefined}
                                                    alt={auth?.user.name}
                                                />
                                                <AvatarFallback className="rounded-lg bg-white/20 text-white">
                                                    {getInitials(
                                                        auth?.user.name,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="hidden text-left leading-tight md:block">
                                                <div className="text-sm font-semibold">
                                                    {auth?.user.name}
                                                </div>
                                                {roleLabel && (
                                                    <div className="text-xs text-white/90">
                                                        {roleLabel}
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronDown className="hidden h-4 w-4 opacity-90 md:block" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-56"
                                        align="end"
                                    >
                                        <UserMenuContent user={auth?.user} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
