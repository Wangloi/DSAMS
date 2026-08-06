import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import type { SharedData, User } from '@/types';

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
                <DropdownMenuItem asChild className="rounded-xl focus:bg-slate-100 dark:focus:bg-white/10 transition-colors">
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
                <DropdownMenuItem className="rounded-xl focus:bg-rose-50 dark:focus:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400 transition-colors">
                    <button
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center px-2 py-2 text-sm font-medium"
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
