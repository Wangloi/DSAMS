import {
    adminDashboard,
    adminIncidentsViolations,
    adminIncidentsViolationsBatch,
    adminIncidentsViolationsArchive,
    adminIncidentsViolationsShow,
    adminIncidentsViolationsStore,
    adminIncidentsViolationsUpdate,
    adminIncidentsViolationsUpdatePhase,
    adminIncidentsViolationsUpdateStatus,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';
import IncidentReportDialog from './IncidentReportDialog';
import IncidentStatsCard from './IncidentStatsCard';
import IncidentTable from './IncidentTable';
import IncidentTableHeader from './IncidentTableHeader';
import Pagination from './Pagination';
import CallingSlipModal from './CallingSlipModal';
import InvestigationDialog from './InvestigationDialog';
import DisciplinaryResolutionModal from './DisciplinaryResolutionModal';
import { STUDENT_CALLING_PHASES } from './StudentCallingProcessFlow';
import type {
    IncidentRow,
    IncidentStats,
    KpiCard,
    StatusFilter,
    TypeFilter,
    Violation,
} from './types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Violation Registry & History',
        href: adminIncidentsViolations(),
    },
];

type PageProps = {
    incidents: IncidentRow[];
    violations: Violation[];
    errors?: Record<string, string>;
    flash?: { success?: string; error?: string };
};

export default function AdminIncidentsViolationsPage() {
    const { props } = usePage() as { props: PageProps };

    useEffect(() => {
        if (props.flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: props.flash.success,
                timer: 2500,
                showConfirmButton: false,
            });
        }
    }, [props.flash]);

    const incidents = props.incidents || [];
    const violations = props.violations || [];

    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [phaseFilter, setPhaseFilter] = useState<number | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [incidentModalOpen, setIncidentModalOpen] = useState(false);
    const [editingIncident, setEditingIncident] = useState<IncidentRow | null>(
        null,
    );
    const [dialogMode, setDialogMode] = useState<'create' | 'view' | 'edit'>(
        'create',
    );
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [callingSlipIncident, setCallingSlipIncident] = useState<IncidentRow | null>(null);
    const [investigationIncident, setInvestigationIncident] = useState<IncidentRow | null>(null);
    const [decisionIncident, setDecisionIncident] = useState<IncidentRow | null>(null);

    const stats: IncidentStats = useMemo(() => {
        const total = incidents.length;
        const pending = incidents.filter(
            (i: IncidentRow) => i.status === 'Pending',
        ).length;
        const ongoing = incidents.filter(
            (i: IncidentRow) => i.status === 'Ongoing',
        ).length;
        const resolved = incidents.filter(
            (i: IncidentRow) => i.status === 'Resolved',
        ).length;
        const escalated = incidents.filter(
            (i: IncidentRow) => i.status === 'Escalated',
        ).length;
        return { total, pending, ongoing, resolved, escalated };
    }, [incidents]);

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const matchesType = (row: IncidentRow) => {
            if (typeFilter === 'all') return true;
            return row.classification.toLowerCase() === typeFilter;
        };

        const matchesStatus = (row: IncidentRow) => {
            if (statusFilter === 'all') return true;
            return row.status === statusFilter;
        };

        const matchesPhase = (row: IncidentRow) => {
            if (phaseFilter === 'all') return true;
            const phase =
                row.calling_phase ??
                (row.status === 'Resolved'
                    ? 5
                    : row.status === 'Escalated'
                      ? 4
                      : row.status === 'Ongoing'
                        ? 3
                        : 1);
            return phase === phaseFilter;
        };

        const matchesSearch = (row: IncidentRow) => {
            if (!q) return true;
            const haystack = [
                row.caseId,
                row.student,
                row.type,
                row.classification,
                row.dateTime,
                row.status,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        };

        return incidents.filter(
            (row: IncidentRow) =>
                matchesType(row) &&
                matchesStatus(row) &&
                matchesPhase(row) &&
                matchesSearch(row),
        );
    }, [incidents, searchQuery, statusFilter, typeFilter, phaseFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const pagedRows = useMemo(() => {
        const clamped = Math.min(Math.max(pageIndex, 1), totalPages);
        const start = (clamped - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, pageIndex, totalPages]);

    // Clear batch selection when filters change
    useEffect(() => {
        setSelectedIds(new Set());
    }, [typeFilter, statusFilter, phaseFilter, searchQuery, pageIndex]);

    const handleArchive = (row: IncidentRow) => {
        Swal.fire({
            title: 'Archive incident?',
            text: `This will move incident "${row.caseId}" to the archive. You can restore it later.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#d1d5db',
            confirmButtonText: 'Archive',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    adminIncidentsViolationsArchive(row.id),
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Archived',
                                text: 'Incident has been archived successfully.',
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                        onError: (errors: Record<string, string>) => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to archive incident. Please try again.',
                            });
                            console.error('Archive error:', errors);
                        },
                    },
                );
            }
        });
    };

    const handleNewIncident = () => {
        setEditingIncident(null);
        setDialogMode('create');
        setIncidentModalOpen(true);
    };

    const handleEditIncident = (incident: IncidentRow) => {
        setEditingIncident(incident);
        setDialogMode('edit');
        setIncidentModalOpen(true);
    };

    const handleViewIncident = (incident: IncidentRow) => {
        setEditingIncident(incident);
        setDialogMode('view');
        setIncidentModalOpen(true);
    };

    const handleViewDisciplinaryDetail = (incident: IncidentRow) => {
        router.get(adminIncidentsViolationsShow(incident.id));
    };

    const handleStatusChange = (
        row: IncidentRow,
        newStatus: IncidentRow['status'],
    ) => {
        if (row.status === newStatus) return;

        Swal.fire({
            title: 'Change Status?',
            text: `Are you sure you want to change the status of Case #${row.caseId} to "${newStatus}"? The calling phase will auto-sync.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1e40af',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, update status',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    adminIncidentsViolationsUpdateStatus(row.id),
                    { status: newStatus },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Status Updated',
                                text: `Case #${row.caseId} status updated to ${newStatus}. Phase auto-synced.`,
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                        onError: (err) => {
                            console.error('Failed to update status:', err);
                        },
                    },
                );
            }
        });
    };

    /** #4: Quick phase advance from the table */
    const handleAdvancePhase = (row: IncidentRow) => {
        const currentPhase = row.calling_phase ?? 1;
        const nextPhase = Math.min(currentPhase + 1, 5);
        const nextItem = STUDENT_CALLING_PHASES[nextPhase - 1];
        const phaseName = nextItem?.shortLabel ?? `Phase ${nextPhase}`;

        Swal.fire({
            title: `Advance to Phase ${nextPhase}?`,
            text: `Move Case #${row.caseId} to "${phaseName}"? Status will auto-sync.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0B192C',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, advance phase',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    adminIncidentsViolationsUpdatePhase(row.id),
                    { calling_phase: nextPhase },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Phase Advanced',
                                text: `Case #${row.caseId} → Phase ${nextPhase}: ${nextItem.shortLabel}`,
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                        onError: (err) => {
                            console.error('Failed to advance phase:', err);
                        },
                    },
                );
            }
        });
    };

    /** #5: Batch operations */
    const handleToggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleToggleSelectAll = () => {
        if (pagedRows.every((r) => selectedIds.has(r.id))) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pagedRows.map((r) => r.id)));
        }
    };

    const handleBatchAction = (action: string, value: string) => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        const label = action === 'advance_phase'
            ? `Advance ${ids.length} case(s) to Phase ${value}`
            : `Set ${ids.length} case(s) to ${value}`;

        Swal.fire({
            title: 'Batch Update',
            text: label + '?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0B192C',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Apply',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    adminIncidentsViolationsBatch(),
                    { incident_ids: ids, action, value },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setSelectedIds(new Set());
                        },
                        onError: (err) => {
                            console.error('Batch update error:', err);
                        },
                    },
                );
            }
        });
    };

    const kpiData: KpiCard[] = [
        {
            title: 'Total Cases',
            value: stats.total,
            change: '',
            accent: 'bg-blue-600',
            iconWrap:
                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
        },
        {
            title: 'Pending Cases',
            value: stats.pending,
            change: '',
            accent: 'bg-amber-500',
            iconWrap:
                'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
        },
        {
            title: 'Ongoing Cases',
            value: stats.ongoing,
            change: '',
            accent: 'bg-sky-500',
            iconWrap:
                'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300',
        },
        {
            title: 'Resolved Cases',
            value: stats.resolved,
            change: '',
            accent: 'bg-emerald-600',
            iconWrap:
                'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
        },
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: adminDashboard(),
        },
        {
            title: 'Violation Registry & History',
            href: adminIncidentsViolations(),
        },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Incidents & Violations" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <IncidentTableHeader onNewIncident={handleNewIncident} />

                    {/* Status KPI Cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {kpiData.map((kpi) => (
                            <IncidentStatsCard key={kpi.title} kpi={kpi} />
                        ))}
                    </div>

                    {/* Batch Action Bar */}
                    {selectedIds.size > 0 && (
                        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300 bg-blue-50/95 px-4 py-3 shadow-md backdrop-blur-sm dark:border-blue-800 dark:bg-blue-950/80">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>{selectedIds.size} case(s) selected</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Advance to next phase */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const phases = pagedRows
                                            .filter((r) => selectedIds.has(r.id))
                                            .map((r) => r.calling_phase ?? 1);
                                        const maxPhase = Math.max(...phases);
                                        const target = Math.min(maxPhase + 1, 8);
                                        handleBatchAction('advance_phase', String(target));
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-blue-900"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                    Advance Phase
                                </button>

                                {/* Set Resolved */}
                                <button
                                    type="button"
                                    onClick={() => handleBatchAction('set_status', 'Resolved')}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Set Resolved
                                </button>

                                {/* Set Escalated */}
                                <button
                                    type="button"
                                    onClick={() => handleBatchAction('set_status', 'Escalated')}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-rose-700"
                                >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Set Escalated
                                </button>

                                {/* Clear Selection */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds(new Set())}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}

                    <IncidentTable
                        incidents={pagedRows}
                        typeFilter={typeFilter}
                        statusFilter={statusFilter}
                        searchQuery={searchQuery}
                        onView={handleViewIncident}
                        onViewDetail={handleViewDisciplinaryDetail}
                        onEdit={handleEditIncident}
                        onArchive={handleArchive}
                        onStatusChange={handleStatusChange}
                        onAdvancePhase={handleAdvancePhase}
                        onCallStudent={(row) => setCallingSlipIncident(row)}
                        onTypeFilterChange={(value) => {
                            setTypeFilter(value);
                            setPageIndex(1);
                        }}
                        onStatusFilterChange={(value) => {
                            setStatusFilter(value);
                            setPageIndex(1);
                        }}
                        onSearchChange={(value) => {
                            setSearchQuery(value);
                            setPageIndex(1);
                        }}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onToggleSelectAll={handleToggleSelectAll}
                    />

                    <Pagination
                        currentPage={pageIndex}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={filteredRows.length}
                        onPageChange={setPageIndex}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPageIndex(1);
                        }}
                    />
                </div>
            </div>

            <IncidentReportDialog
                open={incidentModalOpen}
                onOpenChange={setIncidentModalOpen}
                onClose={() => {
                    setIncidentModalOpen(false);
                    setEditingIncident(null);
                }}
                initialValues={
                    editingIncident
                        ? editingIncident.raw || {
                              violationId: editingIncident.violation_id ?? null,
                              incidentType: editingIncident.type,
                              classification: editingIncident.classification,
                              date: '',
                              time: '',
                              location: 'Campus',
                              reportedBy: '',
                              studentsInvolved: [
                                  {
                                      id: editingIncident.studentId,
                                      name: editingIncident.student,
                                  },
                              ],
                              description: `Status: ${editingIncident.status} | Time: ${editingIncident.dateTime}`,
                              immediateAction: '',
                              receivedBy: '',
                          }
                        : null
                }
                title={
                    dialogMode === 'create'
                        ? 'Report Incident'
                        : dialogMode === 'view'
                          ? 'View Incident Report'
                          : 'Edit Incident Report'
                }
                submitLabel={
                    dialogMode === 'create'
                        ? 'Report Incident'
                        : 'Update Incident'
                }
                viewMode={dialogMode === 'view'}
                violations={violations}
                onSubmit={(payload) => {
                    const data = {
                        violation_id: payload.violationId,
                        incident_type: payload.incidentType,
                        classification: payload.classification,
                        incident_date: payload.date,
                        incident_time: payload.time,
                        location: payload.location,
                        students_involved: payload.studentsInvolved.map(
                            (student) => ({
                                id: student.id,
                                name: student.name,
                            }),
                        ),
                        description: payload.description,
                        immediate_action: payload.immediateAction,
                        received_by: payload.receivedBy,
                        reported_by: payload.reportedBy,
                    };

                    const incidentId = editingIncident?.id;
                    if (incidentId != null) {
                        router.post(
                            adminIncidentsViolationsUpdate(incidentId),
                            data,
                            {
                                preserveScroll: true,
                                onSuccess: () => {
                                    setIncidentModalOpen(false);
                                    setEditingIncident(null);
                                },
                                onError: (errors: Record<string, string>) => {
                                    console.error('Update error:', errors);
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Failed to update incident. Please try again.',
                                    });
                                },
                            },
                        );
                    } else {
                        router.post(adminIncidentsViolationsStore(), data, {
                            preserveScroll: true,
                            onSuccess: () => {
                                setIncidentModalOpen(false);
                            },
                        });
                    }
                }}
            />

            {/* Official Calling Slip / Notice to Appear Modal */}
            {callingSlipIncident && (
                <CallingSlipModal
                    open={!!callingSlipIncident}
                    onOpenChange={(open) => !open && setCallingSlipIncident(null)}
                    incident={callingSlipIncident}
                    studentDetails={{
                        id: callingSlipIncident.studentId || callingSlipIncident.student,
                        name: callingSlipIncident.student,
                        course: (callingSlipIncident.raw as any)?.course || (callingSlipIncident.studentId?.includes('BSCS') ? 'BSCS' : 'BSIT'),
                        yearLevel: (callingSlipIncident.raw as any)?.yearLevel || (callingSlipIncident.id % 2 === 0 ? '3rd Year' : '4th Year'),
                        status: callingSlipIncident.status,
                    }}
                />
            )}

            {/* Official Step 2: Investigation & Fact-Finding Modal */}
            {investigationIncident && (
                <InvestigationDialog
                    open={!!investigationIncident}
                    onOpenChange={(open) => !open && setInvestigationIncident(null)}
                    incident={investigationIncident}
                    studentDetails={{
                        id: investigationIncident.studentId || investigationIncident.student,
                        name: investigationIncident.student,
                        course: (investigationIncident.raw as any)?.course || (investigationIncident.studentId?.includes('BSCS') ? 'BSCS' : 'BSIT'),
                        yearLevel: (investigationIncident.raw as any)?.yearLevel || (investigationIncident.id % 2 === 0 ? '3rd Year' : '4th Year'),
                        status: investigationIncident.status,
                    }}
                />
            )}

            {/* Official Step 4: Disciplinary Resolution & Decision Modal */}
            {decisionIncident && (
                <DisciplinaryResolutionModal
                    open={!!decisionIncident}
                    onOpenChange={(open) => !open && setDecisionIncident(null)}
                    incident={decisionIncident}
                    studentDetails={{
                        id: decisionIncident.studentId || decisionIncident.student,
                        name: decisionIncident.student,
                        course: (decisionIncident.raw as any)?.course || (decisionIncident.studentId?.includes('BSCS') ? 'BSCS' : 'BSIT'),
                        yearLevel: (decisionIncident.raw as any)?.yearLevel || (decisionIncident.id % 2 === 0 ? '3rd Year' : '4th Year'),
                        status: decisionIncident.status,
                    }}
                />
            )}
        </AdminLayout>
    );
}
