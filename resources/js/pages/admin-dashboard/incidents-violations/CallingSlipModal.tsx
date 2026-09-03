import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertCircle,
    BellRing,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    MapPin,
    Printer,
    Send,
    ShieldAlert,
    Smartphone,
    User,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import type { IncidentRow } from './types';

interface CallingSlipModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    incident: IncidentRow;
    studentDetails: {
        id: string;
        name: string;
        course: string;
        yearLevel: string;
        status: string;
    } | null;
}

export default function CallingSlipModal({
    open,
    onOpenChange,
    incident,
    studentDetails,
}: CallingSlipModalProps) {
    const caseId = incident.caseId;
    const studentName = studentDetails?.name || incident.student;
    const studentId = studentDetails?.id || incident.studentId || '—';
    const course = studentDetails?.course || 'Collegiate Department';
    const yearLevel = studentDetails?.yearLevel || '—';

    const location = incident.raw?.location || 'Office of the Dean of Student Affairs (ODSA)';
    const reportingOfficer =
        incident.raw?.reportedBy || incident.raw?.receivedBy || 'Discipline Officer / OSA Staff';
    const incidentType = incident.type;
    const incidentDate = incident.raw?.date || incident.dateTime.split(' ')[0] || '—';
    const incidentTime = incident.raw?.time || '—';
    const description = incident.raw?.description || 'No specific description provided.';
    const classification = incident.classification || 'Warning';

    const [isSending, setIsSending] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sentSuccessMsg, setSentSuccessMsg] = useState<string | null>(null);
    const [sentErrorMsg, setSentErrorMsg] = useState<string | null>(null);
    const alreadySentAt = incident.calling_notice_sent_at || (incident.raw as any)?.callingNoticeSentAt;

    const handlePrint = () => {
        window.print();
    };

    const handleOpenConfirm = () => {
        setSentErrorMsg(null);
        setConfirmOpen(true);
    };

    const handleConfirmSend = () => {
        setIsSending(true);
        setSentErrorMsg(null);
        router.post(
            `/admin/incidents-violations/${incident.id}/send-calling-notice`,
            {
                student_id: studentId,
                venue: location,
                appearance_schedule: 'Next business day during office hours (8:00 AM - 5:00 PM)',
                instructions: 'Please report promptly to the Office of Student Affairs & Discipline regarding your disciplinary case.',
                advance_to_step_3: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSending(false);
                    setConfirmOpen(false);
                    setSentSuccessMsg(`Calling notice successfully delivered to ${studentName}'s DSAMS account.`);
                    setTimeout(() => {
                        setSentSuccessMsg(null);
                    }, 5000);
                },
                onError: (errors) => {
                    setIsSending(false);
                    const msg =
                        (errors && Object.values(errors)[0]) ||
                        'Could not send calling notice. Please verify student account.';
                    setSentErrorMsg(String(msg));
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                overlayClassName="z-[90]"
                className="z-[95] max-w-4xl sm:max-w-4xl md:max-w-5xl w-[95vw] overflow-y-auto max-h-[90vh] p-0 bg-slate-100 dark:bg-slate-950 border-0 shadow-2xl"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Official Calling Slip Notice - Case #{caseId}</DialogTitle>
                    <DialogDescription>
                        Official Notice to Appear summons for student {studentName}
                    </DialogDescription>
                </DialogHeader>

                {/* Send Notice Confirmation Dialog Overlay (Inside Radix Dialog to prevent focus/pointer trap) */}
                {confirmOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in-0">
                        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                                    <Send className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Send Notice to Student Account?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Official Notice to Appear summons dispatch
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                                <p>
                                    An official <strong>Notice to Appear (Calling Notice)</strong> will be delivered directly to{' '}
                                    <strong className="text-slate-900 dark:text-white">{studentName}</strong>'s DSAMS account dashboard and notification center.
                                </p>
                                <div className="space-y-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-[11px] dark:border-indigo-900/60 dark:bg-indigo-950/40">
                                    <p><strong className="text-slate-900 dark:text-white">Student:</strong> {studentName} ({studentId})</p>
                                    <p><strong className="text-slate-900 dark:text-white">Case:</strong> #{caseId} • {incidentType}</p>
                                    <p><strong className="text-slate-900 dark:text-white">Reporting Venue:</strong> {location}</p>
                                    <p><strong className="text-slate-900 dark:text-white">Appearance Schedule:</strong> Next business day during office hours</p>
                                </div>
                                <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
                                    This will also automatically ensure the case is tracking at Step 3 (Meeting / Hearing) with status marked as Ongoing.
                                </p>
                            </div>

                            {sentErrorMsg && (
                                <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                                    <span>{sentErrorMsg}</span>
                                </div>
                            )}

                            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isSending}
                                    onClick={() => {
                                        setConfirmOpen(false);
                                        setSentErrorMsg(null);
                                    }}
                                    className="h-8 rounded-lg px-3.5 text-xs font-semibold cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={isSending}
                                    onClick={handleConfirmSend}
                                    className="h-8 gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-black text-white shadow hover:bg-indigo-700 cursor-pointer"
                                >
                                    {isSending ? (
                                        <>
                                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            <span>Sending Notice...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-3.5 w-3.5" />
                                            <span>Yes, Send Calling Notice</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Print & Action control bar (hidden when printing) */}
                <div className="print:hidden sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold">
                            Printable Document
                        </Badge>
                        <span className="text-xs text-slate-500">Notice to Appear / Calling Slip</span>
                        {alreadySentAt && (
                            <Badge className="bg-emerald-600 text-white font-black text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Sent to Student Account</span>
                            </Badge>
                        )}
                        {sentSuccessMsg && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-bold text-[11px] gap-1 animate-in fade-in-0">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{sentSuccessMsg}</span>
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            disabled={isSending}
                            onClick={handleOpenConfirm}
                            className="h-8 gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-black text-white shadow hover:bg-indigo-700 cursor-pointer"
                            title="Dispatch official calling notice alert directly to the student's DSAMS account"
                        >
                            <Send className="h-3.5 w-3.5" />
                            <span>{alreadySentAt ? 'Resend to Student' : 'Send to Student Account'}</span>
                        </Button>
                        <Button
                            type="button"
                            onClick={handlePrint}
                            className="h-8 gap-1.5 rounded-lg bg-[#0b2d66] px-4 text-xs font-bold text-white shadow hover:bg-blue-900 cursor-pointer"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            Print Calling Slip
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-500"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Printable Document Paper */}
                <div className="p-6 sm:p-10">
                    <div
                        id="calling-slip-print-area"
                        className="mx-auto max-w-2xl rounded-xl border border-slate-300 bg-white p-8 sm:p-12 text-slate-900 shadow-md print:border-0 print:shadow-none print:p-0 print:m-0 print:max-w-none dark:bg-white dark:text-slate-900"
                    >
                        {/* School Letterhead */}
                        <div className="border-b-2 border-slate-900 pb-4 text-center">
                            <div className="flex items-center justify-center gap-3 mb-1">
                                <img
                                    src="/images/DSA.png"
                                    alt="SRCB Logo"
                                    className="h-14 w-14 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                                <div>
                                    <h1 className="text-base font-black tracking-tight uppercase text-slate-900 leading-tight">
                                        St. Rita's College of Balingasag
                                    </h1>
                                    <p className="text-[11px] font-semibold text-slate-600">
                                        Balingasag, Misamis Oriental 9005
                                    </p>
                                    <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                                        Office of the Dean of Student Affairs (ODSA) / Discipline Board
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Title & Case Ref */}
                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black tracking-wide uppercase text-slate-900 underline decoration-2 underline-offset-4">
                                    Official Calling Slip / Notice to Appear
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Student Disciplinary & Guidance Summons
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Case Number
                                </span>
                                <span className="font-mono text-sm font-black text-rose-600">
                                    #{caseId}
                                </span>
                            </div>
                        </div>

                        {/* Date Issued */}
                        <div className="mt-2 text-right text-xs font-medium text-slate-600">
                            <strong>Date Issued:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>

                        {/* Student Details Box */}
                        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/70 p-4 print:bg-slate-50 text-xs">
                            <div className="grid grid-cols-2 gap-y-2">
                                <div>
                                    <span className="font-bold text-slate-500">Student Name:</span>{' '}
                                    <strong className="text-slate-900 font-extrabold uppercase">{studentName}</strong>
                                </div>
                                <div>
                                    <span className="font-bold text-slate-500">Student ID:</span>{' '}
                                    <span className="font-mono font-bold text-slate-900">{studentId}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-slate-500">Program / Course:</span>{' '}
                                    <span className="font-semibold text-slate-900">{course}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-slate-500">Year Level:</span>{' '}
                                    <span className="font-semibold text-slate-900">{yearLevel}</span>
                                </div>
                            </div>
                        </div>

                        {/* Directives & Summon Details */}
                        <div className="mt-6 space-y-4 text-xs leading-relaxed text-slate-800">
                            <p>
                                <strong>GREETINGS:</strong>
                            </p>
                            <p className="indent-6">
                                You are hereby summoned and requested to report in person to the{' '}
                                <strong className="font-bold underline text-slate-900">{location}</strong> for a formal
                                conference and inquiry regarding an incident or reported violation docketed under your name.
                            </p>

                            <div className="rounded-lg border-l-4 border-slate-900 bg-slate-50 p-3 space-y-1">
                                <div>
                                    <strong className="text-slate-700">Matter / Violation:</strong>{' '}
                                    <span className="font-bold text-slate-900 uppercase">{incidentType}</span>{' '}
                                    <span className="text-[10px] uppercase font-bold text-rose-600">({classification})</span>
                                </div>
                                <div>
                                    <strong className="text-slate-700">Date of Incident:</strong>{' '}
                                    <span>{incidentDate} {incidentTime !== '—' && `at ${incidentTime}`}</span>
                                </div>
                                <div>
                                    <strong className="text-slate-700">Reported By:</strong>{' '}
                                    <span>{reportingOfficer}</span>
                                </div>
                                <div className="pt-1">
                                    <strong className="text-slate-700 block">Brief Summary / Remarks:</strong>
                                    <p className="italic text-slate-600 mt-0.5">{description}</p>
                                </div>
                            </div>

                            <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5 print:border-rose-300">
                                ⚠️ <strong>IMPORTANT DIRECTIVE:</strong> Please report immediately or within twenty-four (24) hours of receipt of this notice. Failure to appear without prior written excuse or justifiable cause may result in administrative disciplinary escalation and temporary withholding of official school clearances and class admission slips.
                            </p>
                        </div>

                        {/* Signatures */}
                        <div className="mt-12 grid grid-cols-2 gap-8 text-xs pt-4">
                            <div>
                                <div className="border-b border-slate-800 pb-1 text-center font-bold uppercase text-slate-900">
                                    {reportingOfficer}
                                </div>
                                <div className="text-center text-[10px] text-slate-500">
                                    Dean of Student Affairs / Discipline Officer
                                </div>
                            </div>
                            <div>
                                <div className="border-b border-slate-800 pb-1 text-center font-bold uppercase text-slate-900">
                                    {studentName}
                                </div>
                                <div className="text-center text-[10px] text-slate-500">
                                    Student Acknowledgment & Signature / Date
                                </div>
                            </div>
                        </div>

                        {/* Parent / Guardian Section */}
                        <div className="mt-8 border-t border-dashed border-slate-300 pt-4 text-xs">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Parent / Guardian Notification</span>
                                    <div className="mt-6 border-b border-slate-400 pb-1"></div>
                                    <div className="text-center text-[10px] text-slate-500 mt-1">
                                        Parent / Guardian Signature over Printed Name
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Date & Time Received</span>
                                    <div className="mt-6 border-b border-slate-400 pb-1"></div>
                                    <div className="text-center text-[10px] text-slate-500 mt-1">
                                        Contact Number of Parent / Guardian
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400">
                            St. Rita's College of Balingasag — Student Affairs Management System (DSAMS) | Official Summon Form
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
