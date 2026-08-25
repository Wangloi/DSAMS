import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    return (
        <>
            {breadcrumbs.length > 0 && (
                <div className="inline-flex items-center rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-1.5 text-[11px] font-bold shadow-xs backdrop-blur-sm dark:border-slate-800/40 dark:bg-slate-900/40">
                    <Breadcrumb>
                        <BreadcrumbList className="flex flex-wrap items-center gap-1.5">
                            {breadcrumbs.map((item, index) => {
                                const isLast = index === breadcrumbs.length - 1;
                                const isHome =
                                    index === 0 &&
                                    (item.title
                                        .toLowerCase()
                                        .includes('home') ||
                                        item.title
                                            .toLowerCase()
                                            .includes('dashboard'));
                                return (
                                    <Fragment key={index}>
                                        <BreadcrumbItem className="flex items-center">
                                            {isLast ? (
                                                <BreadcrumbPage className="font-extrabold tracking-wide text-slate-800 capitalize dark:text-white">
                                                    {item.title}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link
                                                        href={item.href}
                                                        className="flex items-center gap-1 text-slate-500 transition-colors duration-150 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                                    >
                                                        {isHome && (
                                                            <Home className="h-3 w-3 text-slate-400 group-hover:text-blue-500 dark:text-slate-500" />
                                                        )}
                                                        <span className="capitalize">
                                                            {item.title}
                                                        </span>
                                                    </Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && (
                                            <BreadcrumbSeparator className="flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                <ChevronRight className="h-3 w-3" />
                                            </BreadcrumbSeparator>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            )}
        </>
    );
}
