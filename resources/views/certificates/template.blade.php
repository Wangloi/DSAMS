@php
    $schoolLogoPath = public_path('images/SRCB.png');
    $dsaLogoPath = public_path('images/DSA.png');
    if (!file_exists($dsaLogoPath)) {
        $dsaLogoPath = public_path('images/DSA.jpg');
    }
    $schoolLogo = file_exists($schoolLogoPath) ? 'data:image/png;base64,'.base64_encode(file_get_contents($schoolLogoPath)) : '';
    $dsaLogo = file_exists($dsaLogoPath) ? 'data:image/png;base64,'.base64_encode(file_get_contents($dsaLogoPath)) : '';
    $certificateType = ucwords(str_replace('_', ' ', (string) ($certificate->certificate_type ?? 'evaluation_completion')));
    $eventDate = $event?->event_date ? $event->event_date->format('F d, Y') : 'N/A';
    $issueDateFormatted = $certificate->issue_date ? $certificate->issue_date->format('F d, Y') : now()->format('F d, Y');
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $certificate->title }}</title>
    <style>
        @page {
            size: a4 landscape;
            margin: 15pt;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            margin: 0;
            padding: 0;
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
            background: #ffffff;
            color: #0c2340;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .cert-frame {
            width: 100%;
            border: 8pt solid #0c2340;
            border-collapse: collapse;
        }

        .cert-frame-inner {
            padding: 4pt;
        }

        .cert-body-table {
            width: 100%;
            border: 2pt solid #c5a059;
            border-collapse: collapse;
            text-align: center;
        }

        .watermark {
            position: absolute;
            top: 130pt;
            left: 270pt;
            width: 260pt;
            height: 260pt;
            opacity: 0.04;
            z-index: 0;
        }
    </style>
</head>
<body>
    <table class="cert-frame" cellpadding="0" cellspacing="0">
        <tr>
            <td class="cert-frame-inner">
                <table class="cert-body-table" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 16pt 24pt 12pt; position: relative;">
                            @if ($schoolLogo)
                                <img class="watermark" src="{{ $schoolLogo }}" alt="">
                            @endif

                            <!-- Header Row -->
                            <table style="width: 100%; border-collapse: collapse; position: relative; z-index: 1;">
                                <tr>
                                    <td style="width: 60pt; text-align: left; vertical-align: middle;">
                                        @if ($schoolLogo)
                                            <img src="{{ $schoolLogo }}" style="width: 48pt; height: 48pt; object-fit: contain;" alt="SRCB">
                                        @endif
                                    </td>
                                    <td style="text-align: left; vertical-align: middle; padding-left: 8pt;">
                                        <div style="color: #0c2340; font-size: 12pt; font-weight: bold; letter-spacing: 1.5pt; text-transform: uppercase;">
                                            St. Rita's College of Balingasag
                                        </div>
                                        <div style="color: #64748b; font-size: 8pt; font-weight: bold; letter-spacing: 1pt; text-transform: uppercase; margin-top: 2pt;">
                                            Department of Student Affairs
                                        </div>
                                    </td>
                                    <td style="width: 60pt; text-align: right; vertical-align: middle;">
                                        @if ($dsaLogo)
                                            <img src="{{ $dsaLogo }}" style="width: 48pt; height: 48pt; border-radius: 50%; object-fit: cover;" alt="DSA">
                                        @endif
                                    </td>
                                </tr>
                            </table>

                            <!-- Evaluation Completion Divider Badge -->
                            <table style="width: 100%; margin: 10pt 0 6pt; border-collapse: collapse; position: relative; z-index: 1;">
                                <tr>
                                    <td style="text-align: right; width: 36%; vertical-align: middle;">
                                        <div style="height: 1pt; background: #c5a059; width: 80pt; float: right; margin-right: 10pt;"></div>
                                    </td>
                                    <td style="text-align: center; width: 28%; vertical-align: middle; white-space: nowrap;">
                                        <span style="font-size: 8pt; font-weight: 800; letter-spacing: 2pt; color: #0c2340; text-transform: uppercase;">
                                            EVALUATION COMPLETION
                                        </span>
                                    </td>
                                    <td style="text-align: left; width: 36%; vertical-align: middle;">
                                        <div style="height: 1pt; background: #c5a059; width: 80pt; float: left; margin-left: 10pt;"></div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Main Certificate Presentation Titles -->
                            <div style="text-align: center; margin: 4pt 0; position: relative; z-index: 1;">
                                <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 30pt; font-weight: bold; color: #0c2340; letter-spacing: 2pt; line-height: 1; text-transform: uppercase;">
                                    CERTIFICATE
                                </div>
                                <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 13pt; font-style: italic; color: #b38f43; margin-top: 3pt;">
                                    of Evaluation Completion
                                </div>
                            </div>

                            <!-- Recipient Presentation Block -->
                            <div style="text-align: center; margin: 10pt auto 6pt; position: relative; z-index: 1;">
                                <div style="font-size: 7.5pt; font-weight: bold; letter-spacing: 1.5pt; color: #94a3b8; text-transform: uppercase;">
                                    THIS CERTIFICATE IS PROUDLY PRESENTED TO
                                </div>
                                <div style="display: inline-block; min-width: 380pt; border-bottom: 2pt solid #c5a059; padding-bottom: 3pt; margin-top: 4pt;">
                                    <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 22pt; font-weight: bold; color: #0c2340;">
                                        {{ $certificate->student?->name ?? $student->name }}
                                    </span>
                                </div>
                                <div style="font-size: 10pt; line-height: 1.4; color: #475569; width: 560pt; margin: 8pt auto 0;">
                                    for successfully completing the event evaluation for
                                    <strong style="color: #0f172a;">{{ $certificate->event?->event_name ?? $event->event_name }}</strong>.
                                    This certificate serves as official proof of evaluation completion.
                                </div>
                            </div>

                            <!-- 6-Column Metrics Table (Exact match to Preview) -->
                            <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border: 1pt solid #cbd5e1; margin-top: 14pt; position: relative; z-index: 1;">
                                <tr>
                                    <td style="width: 16.66%; text-align: center; padding: 6pt 2pt; border-right: 1pt solid #cbd5e1; vertical-align: middle;">
                                        <div style="font-size: 6.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5pt;">Certificate Number</div>
                                        <div style="font-size: 8pt; font-weight: bold; color: #0f172a; margin-top: 2pt;">{{ $certificate->certificate_number }}</div>
                                    </td>
                                    <td style="width: 16.66%; text-align: center; padding: 6pt 2pt; border-right: 1pt solid #cbd5e1; vertical-align: middle;">
                                        <div style="font-size: 6.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5pt;">Student ID</div>
                                        <div style="font-size: 8pt; font-weight: bold; color: #0f172a; margin-top: 2pt;">{{ $certificate->student?->student_id ?? $student->student_id }}</div>
                                    </td>
                                    <td style="width: 16.66%; text-align: center; padding: 6pt 2pt; border-right: 1pt solid #cbd5e1; vertical-align: middle;">
                                        <div style="font-size: 6.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5pt;">Event Date</div>
                                        <div style="font-size: 8pt; font-weight: bold; color: #0f172a; margin-top: 2pt;">{{ $eventDate }}</div>
                                    </td>
                                    <td style="width: 16.66%; text-align: center; padding: 6pt 2pt; border-right: 1pt solid #cbd5e1; vertical-align: middle;">
                                        <div style="font-size: 6.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5pt;">Issue Date</div>
                                        <div style="font-size: 8pt; font-weight: bold; color: #0f172a; margin-top: 2pt;">{{ $issueDateFormatted }}</div>
                                    </td>
                                    <td style="width: 16.66%; text-align: center; padding: 6pt 2pt; border-right: 1pt solid #cbd5e1; vertical-align: middle;">
                                        <div style="font-size: 6.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5pt;">Issued By</div>
                                        <div style="font-size: 7.5pt; font-weight: bold; color: #0f172a; margin-top: 2pt;">{{ $certificate->issued_by ?: 'Department of Student Affairs' }}</div>
                                    </td>
                                    <td style="width: 16.66%; text-align: center; padding: 6pt 2pt; vertical-align: middle;">
                                        <div style="font-size: 6.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5pt;">Certificate Type</div>
                                        <div style="font-size: 7.5pt; font-weight: bold; color: #0f172a; margin-top: 2pt;">{{ $certificateType }}</div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Signatures & Decorative Seal Base Row Layout -->
                            <table style="width: 100%; border-collapse: collapse; margin-top: 18pt; position: relative; z-index: 1;">
                                <tr>
                                    <!-- 1. Left: Gold Ribbon Medal Badge -->
                                    <td style="width: 25%; text-align: left; vertical-align: middle; padding-left: 12pt;">
                                        <table cellpadding="0" cellspacing="0" style="margin: 0;">
                                            <tr>
                                                <td style="text-align: center;">
                                                    <div style="width: 36pt; height: 36pt; background-color: #c5a059; border: 2pt solid #ffffff; border-radius: 50%; text-align: center; line-height: 32pt; color: #ffffff; font-size: 18pt;">
                                                        &#9733;
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>

                                    <!-- 2. Center: Dean of Student Affairs Signature -->
                                    <td style="width: 50%; text-align: center; vertical-align: top;">
                                        <div style="width: 200pt; margin: 0 auto; border-bottom: 1.5pt solid #334155; padding-bottom: 2pt; font-size: 11pt; font-weight: bold; color: #0c2340;">
                                            {{ $certificate->signature_name }}
                                        </div>
                                        <div style="font-size: 7.5pt; font-weight: bold; color: #334155; margin-top: 3pt; text-transform: capitalize;">
                                            {{ $certificate->signature_title ?: 'Dean of Student Affairs' }}
                                        </div>
                                    </td>

                                    <!-- 3. Right: Symmetrical Balance Spacer -->
                                    <td style="width: 25%;"></td>
                                </tr>
                            </table>

                            <!-- Bottom Verification Footer Tag -->
                            <table style="width: 100%; border-collapse: collapse; margin-top: 14pt; border-top: 1pt solid #e2e8f0; padding-top: 4pt; position: relative; z-index: 1;">
                                <tr>
                                    <td style="text-align: left; font-size: 6.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1pt;">
                                        Verified through DSAMS
                                    </td>
                                    <td style="text-align: right; font-size: 6.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1pt;">
                                        {{ $certificate->certificate_number }}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
