import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Building2, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import type { IncidentRecord } from './types';

interface StudentCallingNoticesProps {
    incidents?: IncidentRecord[];
}

export function StudentCallingNotices({
    incidents = [],
}: StudentCallingNoticesProps) {
    const activeIncidents = incidents.filter((i) => i.status !== 'Resolved');

    if (activeIncidents.length === 0) {
        return null;
    }

    const showIncidentDetails = (inc: IncidentRecord) => {
        const isDecision = !!inc.action_data;
        Swal.fire({
            title: isDecision
                ? `Disciplinary Resolution: Case #${inc.caseId}`
                : `Notice to Appear: Case #${inc.caseId}`,
            html: `
                <div class="space-y-3 text-left text-xs text-slate-700 dark:text-slate-200">
                    <div class="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-1">
                        <p><strong>Matter:</strong> ${inc.title} (${inc.classification || 'Warning'})</p>
                        <p><strong>Docketed:</strong> ${inc.date} ${inc.time || ''}</p>
                        <p><strong>Current Phase:</strong> Step ${inc.calling_phase || 1} of 5 (${inc.statusLabel})</p>
                        ${
                            inc.action_data
                                ? `
                            <div class="mt-2 pt-2 border-t border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                                <p><strong>Sanction Category:</strong> Section ${inc.action_data.section || '—'} (${inc.action_data.sanction || '—'})</p>
                                <p><strong>Specific Penalty:</strong> ${inc.action_data.specific_penalty || '—'}</p>
                                <p><strong>Effective Date:</strong> ${inc.action_data.effective_date || '—'}</p>
                                <p><strong>Findings:</strong> <em>${inc.action_data.findings || '—'}</em></p>
                                ${inc.action_data.terms ? `<p><strong>Terms & Restitution:</strong> ${inc.action_data.terms}</p>` : ''}
                                <p class="text-[11px] text-slate-500 mt-2">Signatory: ${inc.action_data.signatory_name || 'Dean of Student Affairs'}</p>
                            </div>
                        `
                                : `
                            <p><strong>Reporting Venue:</strong> ${inc.location || 'Office of the Dean of Student Affairs (ODSA)'}</p>
                            ${inc.calling_notice_sent_at ? `<p class="mt-2 pt-2 border-t border-rose-200 text-rose-800 font-bold">📢 Official Calling Notice sent to your account: Please report during office hours (8:00 AM - 5:00 PM).</p>` : ''}
                        `
                        }
                    </div>
                    <p class="italic text-slate-500">
                        ${isDecision ? 'Per institutional policy (Step 5), you have the right to file an appeal with the Appeals Committee within five (5) school days.' : 'Please visit the Office of Student Affairs during office hours (8:00 AM - 5:00 PM) to settle this inquiry.'}
                    </p>
                </div>
            `,
            confirmButtonColor: '#0b2d66',
            confirmButtonText: 'Understood',
        });
    };

    return (
        <div className="space-y-3">
            {activeIncidents.map((inc) => (
                <div
                    key={inc.id}
                    className="relative overflow-hidden rounded-2xl border-2 border-rose-400 bg-gradient-to-r from-rose-50 via-amber-50 to-white p-5 shadow-lg dark:border-rose-800 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
                                <AlertTriangle className="h-6 w-6 animate-pulse" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                                        {inc.action_data
                                            ? 'Disciplinary Decision'
                                            : 'Notice to Appear'}
                                    </Badge>
                                    {inc.action_data && (
                                        <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                                            Sanction:{' '}
                                            {inc.action_data.sanction ||
                                                'Resolved'}
                                        </Badge>
                                    )}
                                    {inc.calling_notice_sent_at &&
                                        !inc.action_data && (
                                            <Badge className="bg-amber-400 text-[#0B192C] text-[10px] font-black uppercase tracking-wider shadow-xs">
                                                Calling Slip Issued
                                            </Badge>
                                        )}
                                    <Badge
                                        variant="outline"
                                        className="border-rose-300 bg-white font-mono text-[10px] font-bold text-rose-700 dark:bg-slate-800 dark:text-rose-300"
                                    >
                                        Case #{inc.caseId}
                                    </Badge>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                                        Step {inc.calling_phase || 1} of 5:{' '}
                                        {inc.statusLabel}
                                    </span>
                                </div>

                                <h3 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                                    {inc.action_data
                                        ? `Resolution: ${inc.action_data.specific_penalty || inc.title}`
                                        : `Summons: ${inc.title} ${inc.classification && `(${inc.classification})`}`}
                                </h3>

                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                                        {inc.location ||
                                            'Office of the Dean of Student Affairs'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                                        {inc.date}{' '}
                                        {inc.time && `• ${inc.time}`}
                                    </span>
                                </div>

                                <p className="mt-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                                    {inc.action_data ? (
                                        <span>
                                            ⚖️ Official Disciplinary Resolution
                                            served to your student record.
                                            Penalty:{' '}
                                            <strong>
                                                {inc.action_data
                                                    .specific_penalty ||
                                                    inc.action_data.sanction}
                                            </strong>
                                            . Effective:{' '}
                                            {inc.action_data.effective_date ||
                                                inc.date}
                                            .
                                        </span>
                                    ) : (
                                        <span>
                                            ⚠️ You are requested to report to the
                                            Office of Student Affairs regarding
                                            this notice. Failure to appear may
                                            affect your class clearance and
                                            admission slip issuance.
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 self-end sm:self-center">
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => showIncidentDetails(inc)}
                                className="rounded-xl bg-[#0b2d66] px-4 text-xs font-bold text-white shadow hover:bg-blue-900"
                            >
                                {inc.action_data
                                    ? 'View Resolution'
                                    : 'View Details'}
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
