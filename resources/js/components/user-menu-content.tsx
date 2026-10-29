import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import type { User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { FileText, LogOut, Settings } from 'lucide-react';

type Props = {
    user: User;
    logoutUrl?: string;
};

export function UserMenuContent({ user, logoutUrl }: Props) {
    const cleanup = useMobileNavigation();
    const safeLogoutUrl = logoutUrl ?? logout();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
        router.post(safeLogoutUrl);
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-3 text-left">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/10" />
            <DropdownMenuGroup className="p-1">
                {Boolean((user as any)?.student_id || (user as any)?.role === 'student') && (
                    <DropdownMenuItem
                        asChild
                        className="rounded-xl transition-colors focus:bg-slate-100 dark:focus:bg-white/10"
                    >
                        <Link
                            className="flex w-full cursor-pointer items-center px-2 py-2 text-sm font-medium"
                            href="/student/information-sheet"
                            prefetch
                            onClick={cleanup}
                        >
                            <FileText className="mr-3 h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Information Sheet
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    asChild
                    className="rounded-xl transition-colors focus:bg-slate-100 dark:focus:bg-white/10"
                >
                    <Link
                        className="flex w-full cursor-pointer items-center px-2 py-2 text-sm font-medium"
                        href="/settings/profile"
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/10" />
            <DropdownMenuGroup className="p-1">
                <DropdownMenuItem className="rounded-xl transition-colors focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-500/10 dark:focus:text-rose-400">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center px-2 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-lg"
                        data-test="logout-button"
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Log out
                    </button>
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </>
    );
}
