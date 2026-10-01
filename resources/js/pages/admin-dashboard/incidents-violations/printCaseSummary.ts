import type {
    DisciplinaryActionRecord,
    DisciplinaryHistoryItem,
    IncidentRow,
    StudentDisciplinaryStats,
    Violation,
} from './types';

export interface CaseSummaryPrintData {
    incident: IncidentRow;
    studentDetails?: {
        id: string;
        name: string;
        course: string;
        yearLevel: string;
        contact?: string;
        guardian?: string;
        guardianContact?: string;
    } | null;
    disciplinaryActions?: DisciplinaryActionRecord[];
    violations?: Violation[];
    studentDisciplinaryStats?: StudentDisciplinaryStats | null;
    studentDisciplinaryHistory?: DisciplinaryHistoryItem[];
}

function escapeHtml(str: string | null | undefined): string {
    if (!str) return '—';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function printHtmlViaWindowOrIframe(html: string, title = 'Document') {
    const win = window.open('', '_blank', 'width=900,height=950');
    if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => {
            try {
                win.print();
            } catch (_) {}
        }, 400);
        return;
    }

    // Fallback if popup is blocked
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            }, 2000);
        }, 400);
    }
}

export function generateCaseRecordHtml(data: CaseSummaryPrintData): string {
    const {
        incident,
        studentDetails,
        disciplinaryActions = [],
        studentDisciplinaryStats,
    } = data;

    const caseId = incident.caseId || `CASE-${incident.id}`;
    const studentName = studentDetails?.name || incident.student;
    const studentId = studentDetails?.id || incident.studentId;
    const course = studentDetails?.course || (studentId.includes('BSCS') ? 'BSCS' : 'BSIT');
    const yearLevel = studentDetails?.yearLevel || 'Undergraduate';
    const contact = studentDetails?.contact || '—';
    const guardian = studentDetails?.guardian || 'Parent / Legal Guardian';
    const guardianContact = studentDetails?.guardianContact || '—';

    const incidentType = incident.type;
    const classification = incident.classification;
    const status = incident.status;
    const location = incident.raw?.location || 'Campus Grounds';
    const dateTime = incident.dateTime;
    const description =
        incident.raw?.description ||
        `Disciplinary incident documented regarding ${incident.student}. Investigation and hearings conducted under school student discipline guidelines.`;
    const assignedOfficer =
        incident.raw?.receivedBy || incident.raw?.reportedBy || 'Office of Student Affairs & Discipline';

    const actionsHtml =
        disciplinaryActions.length === 0
            ? `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 12px;">No formal disciplinary action orders or sanctions recorded yet for this case.</td></tr>`
            : disciplinaryActions
                  .map(
                      (action, idx) => `
                <tr>
                    <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                    <td style="font-weight: bold; color: #0b2d66;">${escapeHtml(action.action_type)}</td>
                    <td>${escapeHtml(action.description)}</td>
                    <td>${escapeHtml(action.effective_date || action.created_at?.slice(0, 10) || 'Immediate')}</td>
                    <td>${escapeHtml(action.served_by_name || 'Prefect of Discipline')}</td>
                </tr>
            `,
                  )
                  .join('');

    const printDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Disciplinary Case Record #${caseId} - ${escapeHtml(studentName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0b2d66;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }
    .header-center {
      text-align: center;
      flex: 1;
      padding: 0 16px;
    }
    .school-name {
      font-size: 15px;
      font-weight: 900;
      color: #0b2d66;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .school-sub {
      font-size: 10px;
      color: #334155;
      margin-top: 2px;
    }
    .school-dept {
      font-size: 11px;
      font-weight: 800;
      color: #1e3a8a;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .doc-banner {
      background: #0b2d66;
      color: #ffffff;
      text-align: center;
      padding: 7px 12px;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      border-radius: 4px;
      margin-bottom: 14px;
    }
    .meta-strip {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 10.5px;
    }
    .meta-item strong {
      color: #0b2d66;
    }
    .section-title {
      font-size: 11px;
      font-weight: 900;
      color: #0b2d66;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    table.info-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.info-grid td {
      padding: 4px 8px;
      vertical-align: top;
      border: 1px solid #e2e8f0;
    }
    table.info-grid td.label {
      width: 22%;
      font-weight: 800;
      background: #f8fafc;
      color: #334155;
      font-size: 10px;
      text-transform: uppercase;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 12px;
    }
    table.data-table th {
      background: #0b2d66;
      color: #ffffff;
      font-weight: 800;
      font-size: 10px;
      padding: 6px 8px;
      text-align: left;
      border: 1px solid #0b2d66;
      text-transform: uppercase;
    }
    table.data-table td {
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-size: 10px;
    }
    .narrative-box {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 10.5px;
      line-height: 1.5;
      color: #1e293b;
      margin-bottom: 12px;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 3px;
      font-size: 9.5px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-major {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
    }
    .badge-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }
    .badge-status {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #93c5fd;
    }
    .signature-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      padding-top: 10px;
      page-break-inside: avoid;
    }
    .sig-col {
      width: 30%;
      text-align: center;
    }
    .sig-line {
      border-top: 1.5px solid #0f172a;
      margin-top: 45px;
      padding-top: 4px;
      font-weight: 800;
      font-size: 10.5px;
      color: #0f172a;
    }
    .sig-title {
      font-size: 9.5px;
      color: #64748b;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <img src="/images/SRCB.png" class="logo" alt="SRCB Logo" onerror="this.style.display='none'" />
    <div class="header-center">
      <div class="school-name">St. Rita's College of Balingasag</div>
      <div class="school-sub">Balingasag, Misamis Oriental 9005 &bull; Tel. (088) 323-7159</div>
      <div class="school-dept">Office of Student Affairs &bull; Prefect of Student Discipline</div>
    </div>
    <img src="/images/DSA.png" class="logo" alt="DSA Logo" onerror="this.style.display='none'" />
  </div>

  <!-- Document Title -->
  <div class="doc-banner">
    Official Disciplinary Case Record &amp; Summary
  </div>

  <!-- Meta Info -->
  <div class="meta-strip">
    <div class="meta-item">Docket Case ID: <strong>#${escapeHtml(caseId)}</strong></div>
    <div class="meta-item">Date Issued: <strong>${escapeHtml(printDate)}</strong></div>
    <div class="meta-item">Case Status: <strong>${escapeHtml(status)}</strong></div>
    <div class="meta-item">Classification: <strong>${escapeHtml(classification)}</strong></div>
  </div>

  <!-- Offender Identity -->
  <div class="section-title">I. Student Offender Profile</div>
  <table class="info-grid">
    <tr>
      <td class="label">Full Name</td>
      <td style="font-weight: bold; font-size: 11.5px; color: #0b2d66;">${escapeHtml(studentName)}</td>
      <td class="label">Student ID</td>
      <td style="font-weight: bold; font-family: monospace;">${escapeHtml(studentId)}</td>
    </tr>
    <tr>
      <td class="label">Course / Program</td>
      <td>${escapeHtml(course)}</td>
      <td class="label">Year Level</td>
      <td>${escapeHtml(yearLevel)}</td>
    </tr>
    <tr>
      <td class="label">Student Contact</td>
      <td>${escapeHtml(contact)}</td>
      <td class="label">Parent / Guardian</td>
      <td>${escapeHtml(guardian)} (${escapeHtml(guardianContact)})</td>
    </tr>
  </table>

  <!-- Incident Details -->
  <div class="section-title">II. Incident Incident Particulars &amp; Violation</div>
  <table class="info-grid">
    <tr>
      <td class="label">Violation / Incident Type</td>
      <td style="font-weight: bold; color: #b91c1c;">${escapeHtml(incidentType)}</td>
      <td class="label">Offense Category</td>
      <td>
        <span class="badge ${classification === 'Warning' ? 'badge-warning' : 'badge-major'}">
          ${escapeHtml(classification)}
        </span>
      </td>
    </tr>
    <tr>
      <td class="label">Date &amp; Time of Occurrence</td>
      <td>${escapeHtml(dateTime)}</td>
      <td class="label">Location / Venue</td>
      <td>${escapeHtml(location)}</td>
    </tr>
    <tr>
      <td class="label">Assigned Officer</td>
      <td>${escapeHtml(assignedOfficer)}</td>
      <td class="label">Case Resolution Status</td>
      <td>
        <span class="badge badge-status">${escapeHtml(status)}</span>
      </td>
    </tr>
  </table>

  <!-- Narrative / Statement of Facts -->
  <div class="section-title">III. Statement of Facts &amp; Incident Narrative</div>
  <div class="narrative-box">
    ${escapeHtml(description)}
  </div>

  <!-- Disciplinary Sanctions Imposed -->
  <div class="section-title">IV. Formal Disciplinary Actions &amp; Sanctions Imposed</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%; text-align: center;">#</th>
        <th style="width: 25%;">Sanction / Action</th>
        <th>Details / Community Service / Specifics</th>
        <th style="width: 15%;">Effective Date</th>
        <th style="width: 20%;">Officer / Authority</th>
      </tr>
    </thead>
    <tbody>
      ${actionsHtml}
    </tbody>
  </table>

  <!-- Signatures Section -->
  <div class="signature-grid">
    <div class="sig-col">
      <div class="sig-line">${escapeHtml(studentName)}</div>
      <div class="sig-title">Student Offender (Acknowledgement)</div>
    </div>
    <div class="sig-col">
      <div class="sig-line">${escapeHtml(assignedOfficer)}</div>
      <div class="sig-title">Disciplinary Officer / Hearing Head</div>
    </div>
    <div class="sig-col">
      <div class="sig-line">Dean of Student Affairs</div>
      <div class="sig-title">Office of Student Affairs &amp; Services</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>Document Control: DSAMS-OSA-DISC-${escapeHtml(caseId)} &bull; Confidential Student Disciplinary Record</div>
    <div>Generated: ${escapeHtml(printDate)} &bull; Valid only with official institutional stamp</div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.focus();
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;
}

export function printCallingSlipElement(slipElementId = 'calling-slip-print-area') {
    const el = document.getElementById(slipElementId);
    if (!el) {
        window.print();
        return;
    }

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Notice to Appear / Calling Slip</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.45; color: #0f172a; padding: 20px; }
    .border-box { border: 1.5px solid #0f172a; padding: 24px; border-radius: 6px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="border-box">
    ${el.innerHTML}
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.focus(); window.print(); }, 300);
    });
  </script>
</body>
</html>`;

    printHtmlViaWindowOrIframe(html, 'Calling Slip');
}

export function printResolutionElement(resolutionElementId = 'decision-resolution-print-area') {
    const el = document.getElementById(resolutionElementId);
    if (!el) {
        window.print();
        return;
    }

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Formal Disciplinary Resolution &amp; Notice of Decision</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.45; color: #0f172a; padding: 20px; }
    .border-box { border: 1.5px solid #0f172a; padding: 24px; border-radius: 6px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="border-box">
    ${el.innerHTML}
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.focus(); window.print(); }, 300);
    });
  </script>
</body>
</html>`;

    printHtmlViaWindowOrIframe(html, 'Disciplinary Resolution');
}
