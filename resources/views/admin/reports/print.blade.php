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
                <tr>
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

    <div class="note">Tip: Use your browser Print dialog and choose “Save as PDF” to export a PDF.</div>

    <script>
        window.onload = function () { window.print(); };
    </script>
</body>
</html>
