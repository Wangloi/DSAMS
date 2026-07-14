import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { AdmissionSlipRequestModal } from '@/components/AdmissionSlipRequestModal';
import type { BreadcrumbItem } from '@/types';
import AdmissionSlipHeader from '../../admin-dashboard/admission-slip/AdmissionSlipHeader';
import AdmissionSlipStatsCard from '../../admin-dashboard/admission-slip/AdmissionSlipStatsCard';
import AdmissionSlipTableCard from '../../admin-dashboard/admission-slip/AdmissionSlipTableCard';
import printSlip from '../../admin-dashboard/admission-slip/printSlip';
import type { PageProps, SlipRow } from '../../admin-dashboard/admission-slip/types';
import DSALayout from '../dsa-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'DSA Dashboard',
        href: '/dsa-dashboard',
    },
    {
        title: 'Admission Slip',
        href: '/dsa/admission-slip',
    },
];

export default function DSAAdmissionSlipPage() {
    const [open, setOpen] = useState(false);
    const { props } = (usePage() as { props: PageProps });
    const errors = props.errors ?? {};
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('open_add') === 'true') {
            setOpen(true);
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('open_add');
            window.history.replaceState({}, '', url.pathname);
        }
    }, []);

    useEffect(() => {
        if (!isAutoRefreshEnabled) return;

        const id = window.setInterval(() => {
            router.reload({
                only: ['slips', 'unreadNotifications'],
                preserveUrl: true,
                onStart: () => setIsRefreshing(true),
                onFinish: () => {
                    setIsRefreshing(false);
                    setLastUpdated(new Date());
                },
            });
        }, 5000);

        return () => {
            window.clearInterval(id);
        };
    }, [isAutoRefreshEnabled]);

    const slips = useMemo<SlipRow[]>(() => {
        const raw = props.slips ?? [];
        return raw.map((s: { id: number; student_name: string; program_year_level: string; date_issued: string; case_text: string; reason_text: string; valid_until: string; status: string }) => ({
            id: s.id,
            studentName: s.student_name,
            programYear: s.program_year_level,
            dateIssued: s.date_issued,
            caseText: s.case_text,
            reasonText: s.reason_text,
            validUntil: s.valid_until,
            status: s.status === 'APPROVED' ? 'APPROVED' : s.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
        }));
    }, [props.slips]);

    const stats = useMemo(() => {
        const pending = slips.filter((s) => s.status === 'PENDING').length;
        const approved = slips.filter((s) => s.status === 'APPROVED').length;
        const rejected = slips.filter((s) => s.status === 'REJECTED').length;
        const total = pending + approved + rejected;
        const issuedToday = slips.filter(
            (s) => s.dateIssued === new Date().toISOString().slice(0, 10),
        ).length;
        const validThisWeek = slips.filter((s) => {
            const validUntil = new Date(s.validUntil);
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
            return validUntil >= oneWeekFromNow;
        }).length;
        return { pending, approved, rejected, total, issuedToday, validThisWeek };
    }, [slips]);

    const filteredSlips = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const matchesTab = (s: SlipRow) => {
            if (activeTab === 'all') return true;
            if (activeTab === 'pending') return s.status === 'PENDING';
            if (activeTab === 'approved') return s.status === 'APPROVED';
            return s.status === 'REJECTED';
        };

        const matchesSearch = (s: SlipRow) => {
            if (!q) return true;
            const haystack = [
                String(s.id),
                s.studentName,
                s.programYear,
                s.dateIssued,
                s.caseText,
                s.reasonText,
                s.validUntil,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        };

        return slips.filter((s) => matchesTab(s) && matchesSearch(s));
    }, [slips, activeTab, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredSlips.length / pageSize));

    useEffect(() => {
        setPageIndex((p) => Math.min(Math.max(p, 1), totalPages));
    }, [totalPages]);

    const pagedSlips = useMemo(() => {
        const clamped = Math.min(Math.max(pageIndex, 1), totalPages);
        const start = (clamped - 1) * pageSize;
        return filteredSlips.slice(start, start + pageSize);
    }, [filteredSlips, pageIndex, totalPages, pageSize]);

    const openCreate = () => {
        setOpen(true);
    };

    return (
        <DSALayout breadcrumbs={breadcrumbs}>
            <Head title="Admission Slip - DSA" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <AdmissionSlipHeader 
                        onCreateNew={openCreate} 
                        isRefreshing={isRefreshing} 
                        lastUpdated={lastUpdated} 
                        isAutoRefreshEnabled={isAutoRefreshEnabled}
                        onToggleAutoRefresh={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                    />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="space-y-4 lg:col-span-8">
                            <AdmissionSlipTableCard
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                pagedSlips={pagedSlips}
                                filteredCount={filteredSlips.length}
                                pageIndex={pageIndex}
                                pageSize={pageSize}
                                setPageSize={(size) => {
                                    setPageSize(size);
                                    setPageIndex(1);
                                }}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                setPageIndex={setPageIndex}
                                printSlip={printSlip}
                            />
                        </div>
                        <AdmissionSlipStatsCard stats={stats} />

                        <AdmissionSlipRequestModal open={open} setOpen={setOpen} errors={errors} mode="dsa" />
                    </div>
                </div>
            </div>
        </DSALayout>
    );
}
