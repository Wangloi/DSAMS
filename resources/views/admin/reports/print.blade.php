<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Report' }}</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 24px; }
        .header-container { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 8px; }
        .logo { width: 60px; height: 60px; object-fit: cover; border-radius: 50%; }
        .header-text { flex: 1; text-align: center; }
        .school-name { font-weight: bold; text-transform: uppercase; font-size: 13px; line-height: 1.15; }
        .school-sub { font-size: 10px; color: #475569; margin-top: 2px; }
        .school-dept { font-weight: bold; font-size: 11px; margin-top: 4px; }
        .rule { border: none; border-top: 1px solid #cbd5e1; margin: 12px 0; }

        .header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-top: 12px; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: 700; }
        .meta { font-size: 11px; color: #475569; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; vertical-align: top; }
        th { background: #f1f5f9; text-align: left; }
        .note { margin-top: 10px; font-size: 11px; color: #475569; }
        @media print { 
            body { margin: 0; padding: 0; }
            .note { display: none; }
        }
    </style>
</head>
<body>
    <div class="header-container">
        <img class="logo" src="/images/SRCB.png" alt="SRCB Logo" />
        <div class="header-text">
            <div class="school-name">ST. RITA'S COLLEGE OF BALINGASAG, INC.</div>
            <div class="school-sub">Balingasag, Misamis Oriental</div>
            <div class="school-dept">HIGHER EDUCATION DEPARTMENT</div>
        </div>
        <img class="logo" src="/images/DSA.png" alt="DSA Logo" />
    </div>

    <hr class="rule" />

    <div class="header">
        <div>
            <div class="title">{{ $title ?? 'Report' }}</div>
            <div class="meta">{{ $periodLabel ?? '' }}</div>
        </div>
        <div class="meta">Generated: {{ now()->format('Y-m-d H:i') }}</div>
    </div>

    @if(isset($attendanceSummary) && is_array($attendanceSummary) && ($attendanceSummary['total_events'] ?? 0) > 0)
        <div style="display: flex; gap: 12px; margin: 12px 0 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px;">
            <div style="flex: 1; border-right: 1px solid #e2e8f0; padding-right: 12px;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.5px;">Overall Attendance Rate</div>
                <div style="font-size: 22px; font-weight: 800; color: #1e3a8a; margin-top: 2px;">{{ $attendanceSummary['overall_percentage'] }}%</div>
            </div>
            <div style="flex: 1; border-right: 1px solid #e2e8f0; padding-right: 12px;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.5px;">Total Events</div>
                <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 2px;">{{ $attendanceSummary['total_events'] }}</div>
            </div>
            <div style="flex: 1; border-right: 1px solid #e2e8f0; padding-right: 12px;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.5px;">Total Expected Turnout</div>
                <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 2px;">{{ $attendanceSummary['total_expected'] }}</div>
            </div>
            <div style="flex: 1;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.5px;">Actual Attendees</div>
                <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 2px;">{{ $attendanceSummary['total_attended'] }}</div>
            </div>
        </div>
    @endif

    <table>
        <thead>
            <tr>
                @foreach($header as $h)
                    <th>{{ $h }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $r)
                @php
                    $isSummaryRow = isset($r[0]) && $r[0] === 'OVERALL SUMMARY';
                @endphp
                <tr style="{{ $isSummaryRow ? 'background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;' : '' }}">
                    @foreach($r as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($header ?? []) }}">No records found for this period.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; margin-top: 48px; padding-top: 16px; page-break-inside: avoid;">
        <div style="text-align: center; width: 220px;">
            <div style="border-bottom: 1px solid #334155; height: 32px;"></div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 6px;">Prepared By</div>
            <div style="font-size: 10px; color: #64748b;">OSA Records & Attendance Officer</div>
        </div>
        <div style="text-align: center; width: 220px;">
            <div style="border-bottom: 1px solid #334155; height: 32px;"></div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 6px;">Verified & Approved By</div>
            <div style="font-size: 10px; color: #64748b;">Director of Student Affairs</div>
        </div>
    </div>

    <div class="note">Tip: Use your browser Print dialog and choose “Save as PDF” to export a PDF.</div>

    <script>
        window.onload = function () { window.print(); };
    </script>
</body>
</html>
