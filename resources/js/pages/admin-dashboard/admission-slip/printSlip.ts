import type { SlipRow } from './types';

export default function printSlip(s: SlipRow) {
    const escapeHtml = (v: string) =>
        v
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');

    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) return;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admission Slip</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
    .wrap { width: 100%; }
    .paper { width: 100%; max-width: 720px; margin: 0 auto; }

    .top { text-align: center; line-height: 1.15; }
    .school { font-weight: 800; letter-spacing: 0.4px; font-size: 15px; }
    .sub { font-weight: 500; font-size: 11px; margin-top: 4px; }
    .dept { font-weight: 800; font-size: 12px; margin-top: 8px; }

    .rule { border: none; border-top: 1px solid #111827; margin: 12px 0; }
    .title { font-weight: 900; font-size: 14px; letter-spacing: 0.6px; text-align: center; margin: 16px 0 24px 0; }

    .fields { font-size: 12px; }
    .row { display: flex; align-items: flex-end; gap: 14px; margin: 18px 0; }
    .label { width: 110px; font-weight: 700; }
    .labelSmall { width: 110px; font-weight: 700; line-height: 1.1; }
    .line { flex: 1; border-bottom: 1px solid #111827; padding-bottom: 2px; min-height: 16px; }
    .value { display: inline-block; transform: translateY(2px); }

    .signature { margin-top: 64px; text-align: center; }
    .sigline { margin: 0 auto; width: 60%; border-bottom: 1px solid #111827; height: 22px; }
    .siglabel { margin-top: 8px; font-style: italic; font-weight: 600; font-size: 11px; }
    .dean { margin-top: 36px; text-align: center; }
    .deanName { font-weight: 900; font-size: 13px; letter-spacing: 0.4px; }
    .deanTitle { font-style: italic; font-weight: 600; font-size: 11px; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="paper">
      <div class="top">
        <div class="school">ST. RITA'S COLLEGE OF BALINGASAG, INC.</div>
        <div class="sub">Balingasag, Misamis Oriental</div>
        <div class="dept">HIGHER EDUCATION DEPARTMENT</div>
      </div>

      <hr class="rule" />

      <div class="title">ADMISSION SLIP</div>

      <div class="fields">
        <div class="row"><div class="label">Name:</div><div class="line"><span class="value">${escapeHtml(s.studentName)}</span></div></div>
        <div class="row"><div class="labelSmall">Program/Year<br/>Level:</div><div class="line"><span class="value">${escapeHtml(s.programYear)}</span></div></div>
        <div class="row"><div class="label">Case:</div><div class="line"><span class="value">${escapeHtml(s.caseText)}</span></div></div>
        <div class="row"><div class="label">Reason:</div><div class="line"><span class="value">${escapeHtml(s.reasonText)}</span></div></div>
        <div class="row"><div class="label">This form is valid until:</div><div class="line"><span class="value">${escapeHtml(s.validUntil)}</span></div></div>
      </div>

      <div class="signature">
        <div class="sigline"></div>
        <div class="siglabel">Signature over Printed Name</div>
      </div>

      <div class="dean">
        <div class="deanName">MANUEL N. OCLARIT JR.</div>
        <div class="deanTitle">Dean of Student Affairs</div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
}
