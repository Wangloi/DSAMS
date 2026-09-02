import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Building2, Calendar, Clock, MapPin, Printer, ShieldAlert, User, X } from 'lucide-react';
import React from 'react';
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

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh] p-0 bg-slate-100 dark:bg-slate-950 border-0 shadow-2xl">
                {/* Print control bar (hidden when printing) */}
                <div className="print:hidden sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold">
                            Printable Document
                        </Badge>
                        <span className="text-xs text-slate-500">Notice to Appear / Calling Slip</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={handlePrint}
                            className="h-8 gap-1.5 rounded-lg bg-[#0b2d66] px-4 text-xs font-bold text-white shadow hover:bg-blue-900"
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
