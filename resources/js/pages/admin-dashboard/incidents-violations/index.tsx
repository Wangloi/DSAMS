import {
    adminDashboard,
    adminIncidentsViolations,
    adminIncidentsViolationsArchive,
    adminIncidentsViolationsShow,
    adminIncidentsViolationsStore,
    adminIncidentsViolationsUpdate,
    adminIncidentsViolationsUpdateStatus,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';
import IncidentReportDialog from './IncidentReportDialog';
import IncidentStatsCard from './IncidentStatsCard';
import IncidentTable from './IncidentTable';
import IncidentTableHeader from './IncidentTableHeader';
import Pagination from './Pagination';
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
                matchesType(row) && matchesStatus(row) && matchesSearch(row),
        );
    }, [incidents, searchQuery, statusFilter, typeFilter]);

    // const pageSize = 5; // Now using state
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const pagedRows = useMemo(() => {
        const clamped = Math.min(Math.max(pageIndex, 1), totalPages);
        const start = (clamped - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, pageIndex, totalPages]);

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
                console.log('Attempting to archive incident:', row.id);
                console.log(
                    'Archive URL:',
                    adminIncidentsViolationsArchive(row.id),
                );

                // Use POST since Route::match handles both PUT and POST
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
            text: `Are you sure you want to change the status of Case #${row.caseId} to "${newStatus}"?`,
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
                                text: `Case #${row.caseId} status updated to ${newStatus}.`,
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

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Incidents & Violations" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <IncidentTableHeader onNewIncident={handleNewIncident} />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {kpiData.map((kpi) => (
                            <IncidentStatsCard key={kpi.title} kpi={kpi} />
                        ))}
                    </div>

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
                        console.log(
                            'Attempting to update incident:',
                            incidentId,
                        );

                        // Use POST since Route::match handles both PUT and POST
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
        </AdminLayout>
    );
}
