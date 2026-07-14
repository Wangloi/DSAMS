@php
    $schoolLogoPath = public_path('images/SRCB.png');
    $dsaLogoPath = public_path('images/DSA.jpg');
    $schoolLogo = file_exists($schoolLogoPath) ? 'data:image/png;base64,'.base64_encode(file_get_contents($schoolLogoPath)) : '';
    $dsaLogo = file_exists($dsaLogoPath) ? 'data:image/jpeg;base64,'.base64_encode(file_get_contents($dsaLogoPath)) : '';
    $certificateType = ucwords(str_replace('_', ' ', (string) ($certificate->certificate_type ?? 'evaluation_completion')));
    $eventDate = $event?->event_date ? $event->event_date->format('F d, Y') : '';
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $certificate->title }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 16px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            background: #eef2f7;
            color: #0f172a;
            font-family: DejaVu Sans, Arial, sans-serif;
        }

        .sheet {
            width: 100%;
            min-height: 100vh;
            padding: 18px;
            background: #ffffff;
        }

        .certificate {
            position: relative;
            min-height: 670px;
            overflow: hidden;
            border: 14px solid #173f74;
            background: #ffffff;
            padding: 8px;
        }

        .inner {
            position: relative;
            min-height: 640px;
            border: 3px solid #c8a349;
            padding: 34px 48px 26px;
            text-align: center;
        }

        .watermark {
            position: absolute;
            top: 150px;
            left: 50%;
            width: 360px;
            height: 360px;
            margin-left: -180px;
            opacity: 0.045;
            z-index: 0;
        }

        .content {
            position: relative;
            z-index: 1;
        }

        .header {
            width: 100%;
            border-collapse: collapse;
        }

        .logo-cell {
            width: 110px;
            text-align: center;
            vertical-align: middle;
        }

        .logo {
            width: 86px;
            height: 86px;
            object-fit: contain;
        }

        .dsa-logo {
            border-radius: 999px;
            border: 1px solid #d6dde8;
        }

        .school-name {
            color: #173f74;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        .department {
            margin-top: 7px;
            color: #64748b;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2.5px;
            text-transform: uppercase;
        }

        .divider-row {
            margin: 34px auto 0;
            width: 520px;
            color: #173f74;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 4px;
            text-transform: uppercase;
        }

        .divider-row:before,
        .divider-row:after {
            content: "";
            display: inline-block;
            width: 110px;
            height: 1px;
            margin: 0 16px 3px;
            background: #c8a349;
        }

        .certificate-word {
            margin-top: 20px;
            color: #173f74;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 58px;
            font-weight: 700;
            line-height: 1;
            letter-spacing: 1px;
        }

        .subtitle {
            margin-top: 8px;
            color: #9a7a22;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 26px;
            font-style: italic;
        }

        .presented {
            margin-top: 38px;
            color: #64748b;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        .student-name {
            display: inline-block;
            min-width: 560px;
            margin-top: 16px;
            padding-bottom: 8px;
            border-bottom: 3px solid #c8a349;
            color: #020617;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 42px;
            font-weight: 700;
            line-height: 1.1;
        }

        .body-copy {
            width: 760px;
            margin: 26px auto 0;
            color: #334155;
            font-size: 17px;
            line-height: 1.75;
        }

        .event-name {
            color: #0f172a;
            font-weight: 800;
        }

        .details {
            width: 780px;
            margin: 28px auto 0;
            border: 1px solid #d7dde7;
            border-collapse: collapse;
            background: #f8fafc;
            text-align: left;
        }

        .details td {
            width: 33.333%;
            padding: 11px 14px;
            border: 1px solid #d7dde7;
            vertical-align: top;
        }

        .label {
            color: #64748b;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1.4px;
            text-transform: uppercase;
        }

        .value {
            margin-top: 5px;
            color: #0f172a;
            font-size: 12px;
            font-weight: 700;
            line-height: 1.35;
        }

        .signatures {
            width: 760px;
            margin: 46px auto 0;
            border-collapse: collapse;
        }

        .signatures td {
            width: 50%;
            text-align: center;
            vertical-align: top;
        }

        .signature-line {
            width: 250px;
            height: 38px;
            margin: 0 auto 9px;
            border-bottom: 1px solid #0f172a;
        }

        .signature-name {
            color: #0f172a;
            font-size: 13px;
            font-weight: 800;
        }

        .signature-title {
            margin-top: 4px;
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .footer {
            position: absolute;
            right: 42px;
            bottom: 24px;
            left: 42px;
            color: #64748b;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.8px;
            text-transform: uppercase;
        }

        .footer-left {
            float: left;
        }

        .footer-right {
            float: right;
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="certificate">
            <div class="inner">
                @if ($schoolLogo)
                    <img class="watermark" src="{{ $schoolLogo }}" alt="">
                @endif

                <div class="content">
                    <table class="header">
                        <tr>
                            <td class="logo-cell">
                                @if ($schoolLogo)
                                    <img class="logo" src="{{ $schoolLogo }}" alt="School logo">
                                @endif
                            </td>
                            <td>
                                <div class="school-name">St. Rita's College of Balingasag</div>
                                <div class="department">Department of Student Affairs</div>
                            </td>
                            <td class="logo-cell">
                                @if ($dsaLogo)
                                    <img class="logo dsa-logo" src="{{ $dsaLogo }}" alt="DSA logo">
                                @endif
                            </td>
                        </tr>
                    </table>

                    <div class="divider-row">{{ $certificateType }}</div>

                    <div class="certificate-word">Certificate</div>
                    <div class="subtitle">of Evaluation Completion</div>

                    <div class="presented">This certificate is proudly presented to</div>
                    <div class="student-name">{{ $student->name }}</div>

                    <div class="body-copy">
                        for successfully completing the event evaluation for
                        <span class="event-name">{{ $event->event_name }}</span>.
                        This certificate serves as official proof of evaluation completion.
                    </div>

                    <table class="details">
                        <tr>
                            <td>
                                <div class="label">Certificate Number</div>
                                <div class="value">{{ $certificate->certificate_number }}</div>
                            </td>
                            <td>
                                <div class="label">Student ID</div>
                                <div class="value">{{ $student->student_id }}</div>
                            </td>
                            <td>
                                <div class="label">Issue Date</div>
                                <div class="value">{{ $certificate->issue_date->format('F d, Y') }}</div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="label">Event Date</div>
                                <div class="value">{{ $eventDate ?: 'N/A' }}</div>
                            </td>
                            <td>
                                <div class="label">Issued By</div>
                                <div class="value">{{ $certificate->issued_by }}</div>
                            </td>
                            <td>
                                <div class="label">Certificate Type</div>
                                <div class="value">{{ $certificateType }}</div>
                            </td>
                        </tr>
                    </table>

                    <table class="signatures">
                        <tr>
                            <td>
                                <div class="signature-line"></div>
                                <div class="signature-name">{{ $certificate->signature_name }}</div>
                                <div class="signature-title">{{ $certificate->signature_title }}</div>
                            </td>
                            <td>
                                <div class="signature-line"></div>
                                <div class="signature-name">Official Registrar</div>
                                <div class="signature-title">Records Verification</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="footer">
                    <span class="footer-left">Verified through DSAMS</span>
                    <span class="footer-right">{{ $certificate->certificate_number }}</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
