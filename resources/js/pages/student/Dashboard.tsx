import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useInitials } from '@/hooks/use-initials';
import type { SharedData } from '@/types';
import StudentProfileCompletionModal from '@/components/StudentProfileCompletionModal';
import { AdmissionSlipRequestModal } from '@/components/AdmissionSlipRequestModal';
import {
    playScanSuccessSound,
    playScanErrorSound,
} from '@/services/notification-sound';

import StudentLayout from './components/StudentLayout';
import { StudentDashboardFooter } from './components/StudentDashboardFooter';
import {
    type EventRecord,
    type StudentDashboardProps,
    StudentHeroCard,
    StudentCallingNotices,
    StudentTimelineEvents,
    StudentPendingEvaluations,
    StudentQuickActions,
    ReportIncidentModal,
} from './components/dashboard';

export default function StudentDashboard({
    user,
    evaluations: serverEvaluations,
    events = [],
    incidents = [],
    violations = [],
    programs: serverPrograms = [],
}: StudentDashboardProps) {
    const page = usePage();
    const getInitials = useInitials();

    const props = page.props as unknown as SharedData;
    const authUser = props?.auth?.user ?? user;

    // Profile completion gate — true when the student hasn't filled in personal info yet
    const needsProfileCompletion = !!(page.props as any)?.needsProfileCompletion;

    const status =
        (page.props as any)?.status ||
        (page.props as any)?.flash?.status ||
        (page.props as any)?.flash?.success;

    useEffect(() => {
        if (status) {
            Swal.fire({
                title: 'Success!',
                text: status,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    }, [status]);

    const displayName = authUser?.name || 'Student';
    const studentId = (authUser as any)?.student_id || '2023-0000';

    // Resolve student course / program
    const studentCourse = ((authUser as any)?.course ?? '').trim();
    const resolvedProgram = useMemo(() => {
        if (!studentCourse || serverPrograms.length === 0) return null;
        const courseKey = studentCourse.toLowerCase();
        return (
            serverPrograms.find(
                (p) =>
                    p.code.toLowerCase() === courseKey ||
                    p.name.toLowerCase() === courseKey,
            ) ?? null
        );
    }, [studentCourse, serverPrograms]);

    const displayProgram = resolvedProgram
        ? `${resolvedProgram.code} — ${resolvedProgram.name}`
        : (authUser as any)?.program || studentCourse || 'General Education';

    const [academicYear, setAcademicYear] = useState('2024 - 2025');
    const [reportIncidentOpen, setReportIncidentOpen] = useState(false);
    const [admissionSlipOpen, setAdmissionSlipOpen] = useState(false);
    const [gpsCheckingIn, setGpsCheckingIn] = useState<number | null>(null);

    const isGpsAttendance = (e: EventRecord) => {
        const type = (e.attendance_type || 'qr_scanner').toLowerCase();
        if (type === 'qr_scanner' || type === 'qr') {
            return false;
        }
        return (type === 'gps' || type === 'direct_gps') && !!e.geofence_enabled;
    };

    const activeEvents = events.filter(
        (e) =>
            !e.is_done &&
            e.status !== 'completed' &&
            ((e.is_scanner_assigned && e.scanner_portal_active) || isGpsAttendance(e)),
    );

    const handleGpsCheckin = (event: EventRecord) => {
        if (event.is_done || event.status === 'completed') {
            Swal.fire({
                icon: 'warning',
                title: 'Event Ended',
                text: 'Attendance check-in is closed because this event has already ended.',
                confirmButtonColor: '#0b2d66',
            });
            return;
        }

        if (typeof window === 'undefined' || !navigator.geolocation) {
            Swal.fire({
                icon: 'error',
                title: 'GPS Unsupported',
                text: 'Geolocation is not supported by your device/browser.',
                confirmButtonColor: '#0b2d66',
            });
            return;
        }

        const isCheckout = event.attendance_status === 'checked_in';
        const actionLabel = isCheckout ? 'Check-Out' : 'Check-In';

        Swal.fire({
            title: `GPS ${actionLabel}`,
            text: `We will verify your current location for "${event.title}". Please ensure you are at the event venue.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0b2d66',
            cancelButtonColor: '#64748b',
            confirmButtonText: `Record ${actionLabel}`,
        }).then((result) => {
            if (!result.isConfirmed) return;

            setGpsCheckingIn(event.id);

            Swal.fire({
                title: 'Detecting Location...',
                text: 'Please allow location access if prompted by your browser.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;

                    try {
                        const metaCsrf =
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '';
                        const xsrfCookieMatch =
                            document.cookie.match(/XSRF-TOKEN=([^;]+)/);
                        const xsrfToken = xsrfCookieMatch
                            ? decodeURIComponent(xsrfCookieMatch[1])
                            : '';
                        const effectiveToken = metaCsrf || xsrfToken;

                        const response = await fetch(
                            `/student/attendance/${event.id}/geofence-checkin`,
                            {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Accept: 'application/json',
                                    'X-CSRF-TOKEN': effectiveToken,
                                    'X-XSRF-TOKEN': xsrfToken,
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                                body: JSON.stringify({
                                    latitude,
                                    longitude,
                                    accuracy_m: accuracy,
                                    _token: effectiveToken,
                                }),
                            },
                        );

                        const data = await response.json();

                        if (response.ok && data.success) {
                            playScanSuccessSound();
                            Swal.fire({
                                icon: 'success',
                                title: isCheckout
                                    ? 'Check-Out Successful!'
                                    : 'Check-In Successful!',
                                html: `
                                    <div class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                        <p class="font-medium">${data.message}</p>
                                        <div class="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold text-left space-y-1">
                                            <p>📍 Distance from venue: <strong class="text-blue-600 dark:text-blue-400">${data.distance_m}m</strong></p>
                                            <p>🎯 Allowed radius: <strong>${data.allowed_radius_m}m</strong></p>
                                            <p class="text-slate-400 mt-1">${data.checked_at}</p>
                                        </div>
                                    </div>
                                `,
                                confirmButtonColor: '#0b2d66',
                            }).then(() => {
                                router.reload();
                            });
                        } else {
                            playScanErrorSound();
                            Swal.fire({
                                icon: 'error',
                                title: 'Attendance Denied',
                                text: data.message || 'Unable to record attendance.',
                                confirmButtonColor: '#0b2d66',
                            });
                        }
                    } catch (err: any) {
                        playScanErrorSound();
                        Swal.fire({
                            icon: 'error',
                            title: 'Network Error',
                            text: 'Failed to communicate with the server. Please try again.',
                            confirmButtonColor: '#0b2d66',
                        });
                    } finally {
                        setGpsCheckingIn(null);
                    }
                },
                (error) => {
                    setGpsCheckingIn(null);
                    let errMsg = 'Could not acquire your current location.';
                    if (error.code === error.PERMISSION_DENIED) {
                        errMsg =
                            'Location permission was denied. Please enable location permissions in your browser.';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errMsg =
                            'Location signal is unavailable. Please check your device GPS.';
                    } else if (error.code === error.TIMEOUT) {
                        errMsg = 'Location request timed out. Please try again.';
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'Location Unavailable',
                        text: errMsg,
                        confirmButtonColor: '#0b2d66',
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                },
            );
        });
    };

    const evaluationRows = serverEvaluations || [];

    return (
        <StudentLayout>
            {/* Profile completion gate — non-dismissible until student fills in personal info */}
            <StudentProfileCompletionModal
                isOpen={needsProfileCompletion}
                onComplete={() => window.location.reload()}
            />

            <Head title="Student Dashboard" />

            {/* REPORT INCIDENT MODAL */}
            <ReportIncidentModal
                open={reportIncidentOpen}
                onOpenChange={setReportIncidentOpen}
                violations={violations}
            />

            {/* ADMISSION SLIP MODAL */}
            <AdmissionSlipRequestModal
                open={admissionSlipOpen}
                setOpen={setAdmissionSlipOpen}
                errors={(page.props.errors as Record<string, string>) || {}}
                mode="student"
                user={{
                    student_id:
                        (authUser as any)?.student_id ??
                        (authUser as any)?.id ??
                        '',
                    name: authUser?.name ?? '',
                    course:
                        resolvedProgram?.name ??
                        (authUser as any)?.course ??
                        (authUser as any)?.program ??
                        '',
                    year_level: (authUser as any)?.year_level ?? '',
                }}
            />

            <div className="mx-auto max-w-7xl px-3 pt-6 pb-8 sm:px-6 lg:px-8">
                <div className="space-y-6 sm:space-y-8">
                    {/* ACTIVE CALLING SLIPS / NOTICE TO APPEAR BANNER */}
                    <StudentCallingNotices incidents={incidents} />

                    {/* HERO BANNER */}
                    <StudentHeroCard
                        user={authUser}
                        displayName={displayName}
                        studentId={studentId}
                        program={displayProgram}
                        academicYear={academicYear}
                        setAcademicYear={setAcademicYear}
                        getInitials={getInitials}
                    />

                    {/* CAMPUS SCHEDULE TIMELINE */}
                    <StudentTimelineEvents
                        events={events}
                        gpsCheckingIn={gpsCheckingIn}
                        handleGpsCheckin={handleGpsCheckin}
                        isGpsAttendance={isGpsAttendance}
                    />

                    {/* PENDING EVALUATIONS SECTION */}
                    <StudentPendingEvaluations evaluationRows={evaluationRows} />

                    {/* QUICK ACTIONS GRID */}
                    <StudentQuickActions
                        activeEvents={activeEvents}
                        isGpsAttendance={isGpsAttendance}
                        handleGpsCheckin={handleGpsCheckin}
                        onOpenReportIncident={() => setReportIncidentOpen(true)}
                        onOpenAdmissionSlip={() => setAdmissionSlipOpen(true)}
                    />
                </div>
            </div>

            <StudentDashboardFooter />
        </StudentLayout>
    );
}
