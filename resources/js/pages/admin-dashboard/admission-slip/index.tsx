import { adminAdmissionSlip, adminDashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';
import AdmissionSlipHeader from './AdmissionSlipHeader';
import AdmissionSlipStatsCard from './AdmissionSlipStatsCard';
import AdmissionSlipTableCard from './AdmissionSlipTableCard';
import CreateAdmissionSlipDialog from './CreateAdmissionSlipDialog';
import EditAdmissionSlipDialog from './EditAdmissionSlipDialog';
import Pagination from './Pagination';
import printSlip from './printSlip';
import type { PageProps, SlipRow } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Admission Slip',
        href: adminAdmissionSlip(),
    },
];

export default function AdminAdmissionSlipPage() {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingSlip, setEditingSlip] = useState<SlipRow | null>(null);
    const [viewSlipId, setViewSlipId] = useState<number | null>(null);
    const { props } = usePage() as { props: PageProps };
    const errors = props.errors ?? {};
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<
        'all' | 'pending' | 'approved' | 'rejected'
    >('all');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('open_add') === 'true') {
            setOpen(true);
            const url = new URL(window.location.href);
            url.searchParams.delete('open_add');
            window.history.replaceState({}, '', url.pathname);
        }
    }, []);

    const slips = useMemo<SlipRow[]>(() => {
        const raw = (props as PageProps).slips ?? [];
        return raw.map(
            (s: {
                id: number;
                student_name: string;
                program_year_level: string;
                date_issued: string;
                case_text: string;
                reason_text: string;
                valid_until: string;
                status: string;
            }) => ({
                id: s.id,
                studentName: s.student_name,
                programYear: s.program_year_level,
                dateIssued: s.date_issued,
                caseText: s.case_text,
                reasonText: s.reason_text,
                validUntil: s.valid_until,
                status: s.status,
            }),
        );
    }, [props]);

    const stats = useMemo(() => {
        const total = slips.length;
        const issuedToday = slips.filter(
            (s) => s.dateIssued === new Date().toISOString().slice(0, 10),
        ).length;
        const validThisWeek = slips.filter((s) => {
            const validUntil = new Date(s.validUntil);
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
            return validUntil >= oneWeekFromNow;
        }).length;
        return { total, issuedToday, validThisWeek };
    }, [slips]);

    const statusCounts = useMemo(() => {
        const pending = slips.filter(
            (s) => (s.status || 'PENDING').toUpperCase() === 'PENDING',
        ).length;
        const approved = slips.filter(
            (s) => (s.status || '').toUpperCase() === 'APPROVED',
        ).length;
        const rejected = slips.filter(
            (s) => (s.status || '').toUpperCase() === 'REJECTED',
        ).length;
        return { pending, approved, rejected };
    }, [slips]);

    const filteredSlips = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const matchesTab = (s: SlipRow) => {
            const st = (s.status || 'PENDING').toUpperCase();
            if (activeTab === 'all') return true;
            if (activeTab === 'pending') return st === 'PENDING';
            if (activeTab === 'approved') return st === 'APPROVED';
            return st === 'REJECTED';
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
    }, [slips, searchQuery, activeTab]);

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

    const openEdit = (slip: SlipRow) => {
        setEditingSlip(slip);
        setEditOpen(true);
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const slipId = urlParams.get('slip_id');
        if (slipId && slips.length > 0) {
            const foundSlip = slips.find(
                (s) => String(s.id) === String(slipId),
            );
            if (foundSlip) {
                const timer = setTimeout(() => {
                    setViewSlipId(foundSlip.id);
                }, 350);
                return () => clearTimeout(timer);
            }
            const url = new URL(window.location.href);
            url.searchParams.delete('slip_id');
            window.history.replaceState({}, '', url.pathname);
        }
    }, [slips]);

    const archiveSlip = (slip: SlipRow) => {
        Swal.fire({
            title: 'Archive this admission slip?',
            text: 'This action can be undone later.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, archive',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(
                    `/admin/admission-slip/${slip.id}/archive`,
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            Swal.fire(
                                'Archived!',
                                'Admission slip has been archived.',
                                'success',
                            );
                        },
                    },
                );
            }
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admission Slip" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <AdmissionSlipHeader onCreateNew={openCreate} />

                    <div className="space-y-4">
                        <AdmissionSlipStatsCard stats={stats} />

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                            <div className="space-y-4 lg:col-span-12">
                                <AdmissionSlipTableCard
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
                                    onEdit={openEdit}
                                    onArchive={archiveSlip}
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    viewSlipId={viewSlipId}
                                    allSlips={slips}
                                />
                                <Pagination
                                    currentPage={pageIndex}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalItems={filteredSlips.length}
                                    onPageChange={setPageIndex}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size);
                                        setPageIndex(1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CreateAdmissionSlipDialog
                open={open}
                setOpen={setOpen}
                errors={errors}
            />
            <EditAdmissionSlipDialog
                open={editOpen}
                setOpen={setEditOpen}
                slip={editingSlip}
                errors={errors}
            />
        </AdminLayout>
    );
}
