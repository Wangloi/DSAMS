import type { SlipRow } from './types';

export default function printSlip(s: SlipRow) {
    const escapeHtml = (v: string) =>
        v
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');

    const win = window.open('', '_blank', 'width=450,height=600');
    if (!win) return;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admission Slip - Receipt</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Courier New', Courier, monospace, Arial, sans-serif;
      color: #000;
      background-color: #fff;
      font-size: 11px;
      line-height: 1.4;
    }
    .container {
      width: 80mm;
      padding: 4mm 6mm;
    }
    .logo-container {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 6px;
    }
    .logo {
      width: 36px;
      height: 36px;
      object-fit: cover;
      border-radius: 50%;
    }
    .header-text {
      text-align: center;
      margin-bottom: 6px;
    }
    .school {
      font-weight: bold;
      font-size: 9.5px;
      line-height: 1.2;
    }
    .sub {
      font-size: 8px;
      color: #444;
      margin-top: 1px;
    }
    .dept {
      font-weight: bold;
      font-size: 9px;
      margin-top: 3px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .title {
      font-weight: bold;
      font-size: 13px;
      text-align: center;
      margin: 6px 0 10px 0;
      letter-spacing: 0.5px;
    }
    .info-item {
      margin-bottom: 6px;
      font-size: 10.5px;
    }
    .info-label {
      font-weight: bold;
      font-size: 8.5px;
      color: #444;
      text-transform: uppercase;
      display: block;
    }
    .info-value {
      margin-top: 1px;
      padding-left: 2px;
      word-break: break-word;
    }
    .signature-section {
      margin-top: 20px;
      text-align: center;
    }
    .sig-line {
      border-bottom: 1px solid #000;
      width: 75%;
      margin: 0 auto;
      height: 18px;
    }
    .sig-label {
      font-size: 8px;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .dean-section {
      margin-top: 24px;
      text-align: center;
      font-size: 9.5px;
    }
    .dean-name {
      font-weight: bold;
    }
    .dean-title {
      font-style: italic;
      font-size: 8.5px;
      margin-top: 1px;
    }

    /* Screen preview rendering style */
    @media screen {
      body {
        background-color: #f1f5f9;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        width: 100vw;
        height: 100vh;
        padding: 20px;
        overflow-y: auto;
      }
      .container {
        background-color: #fff;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img class="logo" src="/images/SRCB.png" alt="SRCB Logo" />
      <img class="logo" src="/images/DSA.png" alt="DSA Logo" />
    </div>
    
    <div class="header-text">
      <div class="school">ST. RITA'S COLLEGE OF BALINGASAG, INC.</div>
      <div class="sub">Balingasag, Misamis Oriental</div>
      <div class="dept">HIGHER EDUCATION DEPARTMENT</div>
    </div>

    <div class="divider"></div>

    <div class="title">ADMISSION SLIP</div>

    <div class="info-item">
      <span class="info-label">Name:</span>
      <div class="info-value">${escapeHtml(s.studentName)}</div>
    </div>
    <div class="info-item">
      <span class="info-label">Program/Year Level:</span>
      <div class="info-value">${escapeHtml(s.programYear)}</div>
    </div>
    <div class="info-item">
      <span class="info-label">Case:</span>
      <div class="info-value">${escapeHtml(s.caseText)}</div>
    </div>
    <div class="info-item">
      <span class="info-label">Reason:</span>
      <div class="info-value">${escapeHtml(s.reasonText)}</div>
    </div>
    <div class="info-item">
      <span class="info-label">Valid Until:</span>
      <div class="info-value">${escapeHtml(s.validUntil)}</div>
    </div>

    <div class="signature-section">
      <div class="sig-line"></div>
      <div class="sig-label">Signature over Printed Name</div>
    </div>

    <div class="dean-section">
      <div class="dean-name">MANUEL N. OCLARIT JR.</div>
      <div class="dean-title">Dean of Student Affairs</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
}
