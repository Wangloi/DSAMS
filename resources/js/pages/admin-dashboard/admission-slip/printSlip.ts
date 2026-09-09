import type { SlipRow } from './types';

export default function printSlip(s: SlipRow, deanName?: string) {
    const escapeHtml = (v: string) =>
        v
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');

    const effectiveDeanName = (deanName || 'Rey John N. Bongcas').trim().toUpperCase();

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
      font-weight: bold;
      color: #000;
      background-color: #fff;
      font-size: 11px;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .container {
      width: 80mm;
      padding: 5mm 6mm;
    }
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }
    .logo {
      width: 48px;
      height: 48px;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-text {
      text-align: center;
      margin-bottom: 8px;
    }
    .school {
      font-weight: 900;
      font-size: 10.5px;
      line-height: 1.25;
      color: #000;
      letter-spacing: 0.2px;
    }
    .sub {
      font-size: 9px;
      font-weight: bold;
      color: #000;
      margin-top: 2px;
    }
    .dept {
      font-weight: 900;
      font-size: 10px;
      color: #000;
      margin-top: 3px;
      letter-spacing: 0.2px;
    }
    .divider {
      border-top: 2px dashed #000;
      margin: 10px 0;
    }
    .title {
      font-weight: 900;
      font-size: 15px;
      text-align: center;
      margin: 8px 0 12px 0;
      letter-spacing: 1px;
      color: #000;
    }
    .info-item {
      margin-bottom: 8px;
      font-size: 11px;
    }
    .info-label {
      font-weight: 900;
      font-size: 9.5px;
      color: #000;
      text-transform: uppercase;
      display: block;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-weight: bold;
      font-size: 11.5px;
      color: #000;
      margin-top: 2px;
      padding-left: 1px;
      word-break: break-word;
      line-height: 1.3;
    }
    .signature-section {
      margin-top: 24px;
      text-align: center;
    }
    .sig-line {
      border-bottom: 2px solid #000;
      width: 80%;
      margin: 0 auto;
      height: 20px;
    }
    .sig-label {
      font-size: 8.5px;
      font-weight: 900;
      color: #000;
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .dean-section {
      margin-top: 26px;
      text-align: center;
      font-size: 10px;
    }
    .dean-name {
      font-weight: 900;
      font-size: 11.5px;
      color: #000;
      letter-spacing: 0.3px;
    }
    .dean-title {
      font-style: italic;
      font-weight: bold;
      font-size: 9.5px;
      color: #000;
      margin-top: 2px;
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
        border: 1px solid #cbd5e1;
        border-radius: 8px;
      }
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .container {
        width: 100%;
        padding: 4mm 6mm;
        box-shadow: none !important;
        border: none !important;
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
      <span class="info-label">NAME:</span>
      <div class="info-value">${escapeHtml(s.studentName)}</div>
    </div>
    <div class="info-item">
      <span class="info-label">PROGRAM/YEAR LEVEL:</span>
      <div class="info-value">${escapeHtml(s.programYear)}</div>
    </div>
    <div class="info-item">
      <span class="info-label">CASE:</span>
      <div class="info-value">${escapeHtml(s.caseText)}</div>
    </div>
    <div class="info-item">
      <span class="info-label">REASON:</span>
      <div class="info-value">${escapeHtml(s.reasonText)}</div>
    </div>
    <div class="info-item">
      <span class="info-label">VALID UNTIL:</span>
      <div class="info-value">${escapeHtml(s.validUntil)}</div>
    </div>

    <div class="signature-section">
      <div class="sig-line"></div>
      <div class="sig-label">Signature over Printed Name</div>
    </div>

    <div class="dean-section">
      <div class="dean-name">${escapeHtml(effectiveDeanName)}</div>
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
