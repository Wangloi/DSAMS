import React from 'react';
import { Button } from '@/components/ui/button';
import {
    studentAttendanceDynamicQrScan,
    studentCertificates,
} from '@/routes';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    Award,
    ChevronRight,
    ClipboardList,
    ScanLine,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { EventRecord } from './types';

interface StudentQuickActionsProps {
    activeEvents: EventRecord[];
    isGpsAttendance: (e: EventRecord) => boolean;
    handleGpsCheckin: (event: EventRecord) => void;
    onOpenReportIncident: () => void;
    onOpenAdmissionSlip: () => void;
}

export function StudentQuickActions({
    activeEvents,
    isGpsAttendance,
    handleGpsCheckin,
    onOpenReportIncident,
    onOpenAdmissionSlip,
}: StudentQuickActionsProps) {
    const handleCheckInClick = () => {
        if (activeEvents.length > 0) {
            const geofenced = activeEvents.find((e) => isGpsAttendance(e));
            if (geofenced) {
                Swal.fire({
                    title: 'Event Check-In',
                    text: `Choose your check-in method for "${geofenced.title}":`,
                    icon: 'question',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonColor: '#2563eb',
                    denyButtonColor: '#7c3aed',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: '📍 GPS Location Check-in',
                    denyButtonText: '📷 Scan QR Code',
                    cancelButtonText: 'Cancel',
                }).then((result) => {
                    if (result.isConfirmed) {
                        handleGpsCheckin(geofenced);
                    } else if (result.isDenied) {
                        router.visit(
                            studentAttendanceDynamicQrScan(geofenced.id),
                        );
                    }
                });
            } else {
                router.visit(
                    studentAttendanceDynamicQrScan(activeEvents[0].id),
                );
            }
        } else {
            Swal.fire({
                icon: 'info',
                title: 'No Active Sessions',
                text: 'There are no active attendance sessions at the moment.',
                confirmButtonColor: '#0b2d66',
            });
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* ACTION: SCAN ATTENDANCE */}
            <div
                onClick={handleCheckInClick}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 p-5 text-left shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-violet-500/15 active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:bg-slate-800"
            >
                <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-24 w-24 rounded-full bg-violet-500/5 blur-xl" />
                <div className="flex h-full flex-col items-start justify-between gap-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shadow-inner transition-transform duration-500 group-hover:scale-108 dark:bg-violet-500/10 dark:text-violet-400">
                            <ScanLine className="h-6 w-6" />
                        </div>
                        <span className="text-[8px] font-black tracking-widest text-slate-400 dark:text-slate-300 uppercase">
                            Self Check-in
                        </span>
                    </div>

                    <div className="mt-2 space-y-1">
                        <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
                            Check In Now
                        </h3>
                        <p className="text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-slate-300">
                            Check in via GPS location or camera QR code.
                        </p>
                    </div>

                    <Button
                        className="mt-3 h-8.5 w-full rounded-xl border border-violet-600 bg-violet-600 px-3 text-[9px] font-black tracking-widest text-white uppercase transition-all duration-300 hover:bg-violet-700 hover:shadow-[0_0_12px_rgba(139,92,246,0.5)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={activeEvents.length === 0}
                    >
                        {activeEvents.length > 0
                            ? 'Check In'
                            : 'No Active Session'}
                        {activeEvents.length > 0 && (
                            <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* ACTION: REPORT INCIDENT */}
            <div
                onClick={onOpenReportIncident}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 p-5 text-left shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-rose-500/15 active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:bg-slate-800"
            >
                <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-24 w-24 rounded-full bg-rose-500/5 blur-xl" />
                <div className="flex h-full flex-col items-start justify-between gap-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-inner transition-transform duration-500 group-hover:scale-105 dark:bg-rose-500/10 dark:text-rose-400">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <span className="font-mono text-[8px] font-black tracking-widest text-slate-400 dark:text-slate-300 uppercase">
                            Anonymous
                        </span>
                    </div>

                    <div className="mt-2 space-y-1">
                        <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
                            Report Incident
                        </h3>
                        <p className="text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-slate-300">
                            Submit safety or security incidents to student
                            affairs.
                        </p>
                    </div>

                    <Button className="mt-3 h-8.5 w-full rounded-xl border border-rose-600 bg-rose-600 px-3 text-[9px] font-black tracking-widest text-white uppercase transition-all duration-300 hover:bg-rose-700 hover:shadow-[0_0_12px_rgba(239,68,68,0.5)] active:scale-95">
                        Begin Report
                        <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                </div>
            </div>

            {/* ACTION: ADMISSION SLIP */}
            <div
                onClick={(e) => {
                    e.preventDefault();
                    onOpenAdmissionSlip();
                }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 p-5 text-left shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/15 active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:bg-slate-800"
            >
                <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-24 w-24 rounded-full bg-blue-500/5 blur-xl" />
                <div className="flex h-full flex-col items-start justify-between gap-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-inner transition-transform duration-500 group-hover:scale-108 dark:bg-blue-500/10 dark:text-blue-400">
                            <ClipboardList className="h-6 w-6" />
                        </div>
                        <span className="text-[8px] font-black tracking-widest text-slate-400 dark:text-slate-300 uppercase">
                            Requests
                        </span>
                    </div>

                    <div className="mt-2 space-y-1">
                        <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
                            Admission Slip
                        </h3>
                        <p className="text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-slate-300">
                            Request an official admission slip for class entry.
                        </p>
                    </div>

                    <Button className="mt-3 h-8.5 w-full rounded-xl border border-blue-600 bg-blue-600 px-3 text-[9px] font-black tracking-widest text-white uppercase transition-all duration-300 hover:bg-blue-700 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] active:scale-95">
                        Request Slip
                        <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                </div>
            </div>

            {/* ACTION: E-CERTIFICATES */}
            <div
                onClick={() => router.visit(studentCertificates())}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 p-5 text-left shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-emerald-500/15 active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:bg-slate-800"
            >
                <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-24 w-24 rounded-full bg-emerald-500/5 blur-xl" />
                <div className="flex h-full flex-col items-start justify-between gap-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-inner transition-transform duration-500 group-hover:scale-108 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <Award className="h-6 w-6" />
                        </div>
                        <span className="text-[8px] font-black tracking-widest text-slate-400 dark:text-slate-300 uppercase">
                            Certificates
                        </span>
                    </div>

                    <div className="mt-2 space-y-1">
                        <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
                            E-Certificates
                        </h3>
                        <p className="text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-slate-300">
                            View and download official event participation
                            awards.
                        </p>
                    </div>

                    <Button className="mt-3 h-8.5 w-full rounded-xl border border-emerald-600 bg-emerald-600 px-3 text-[9px] font-black tracking-widest text-white uppercase transition-all duration-300 hover:bg-emerald-700 hover:shadow-[0_0_12px_rgba(16,185,129,0.5)] active:scale-95">
                        View Awards
                        <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
