<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Attendance Sheet</title>

<style>
    body {
        font-family: "Times New Roman", serif;
        font-size: 12px;
        margin: 20px;
        color: #000;
    }

    .header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 12px;
    }

    .logo {
        width: 65px;
        height: 65px;
        object-fit: cover;
        border-radius: 50%;
    }

    .header-text {
        flex: 1;
        text-align: center;
    }

    .school-name {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 14px;
    }

    .info {
        font-size: 11px;
        line-height: 1.2;
    }

    .title {
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        margin-top: 10px;
    }

    .event {
        text-align: center;
        font-weight: bold;
        font-size: 16px;
        margin-top: 5px;
    }

    .details {
        text-align: center;
        margin-top: 3px;
        font-weight: bold;
    }

    .program {
        text-align: center;
        margin-top: 15px;
        font-weight: bold;
        font-size: 13px;
    }

    .line {
        text-align: center;
        margin: 10px 0;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    th, td {
        border: 1px solid #000;
        padding: 6px;
    }

    th {
        text-align: center;
        font-weight: bold;
    }

    td {
        height: 22px;
    }
    .col-no { width: 4%; text-align: center; }
    .col-id { width: 14%; text-align: center; }
    .col-name { width: 32%; }
    .col-major { width: 20%; }
    .col-time { width: 10%; text-align: center; }
    .col-time-out { width: 10%; text-align: center; }
    .col-status { width: 10%; text-align: center; }

    .page {
        page-break-after: always;
    }

    .page:last-child {
        page-break-after: auto;
    }

    .total-attendees {
        text-align: right;
        font-weight: bold;
        margin-top: 10px;
        font-size: 12px;
    }

    .no-attendees {
        text-align: center;
        padding: 30px;
        font-style: italic;
        color: #666;
    }

    .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 10px;
        color: #666;
    }
</style>
</head>

<body>

@if(count($sections) === 0)
<div class="page">
    <!-- HEADER -->
    <div class="header-container">
        <img class="logo" src="/images/SRCB.png" alt="SRCB Logo" />
        <div class="header-text">
            <div class="school-name">
                ST. RITA'S COLLEGE OF BALINGASAG, INC.
            </div>

            <div class="info">
                Balingasag, Misamis Oriental <br>
                Email: ritarian@srcb.edu.ph | Website: www.srcb.edu.ph <br>
                Tel. (088)323-7159 / Mobile: +63-929-734-0012 (SMART); +63-975-637-9948 (Globe) <br>
                PAASCU Level II Re-Accredited: Junior High School Department <br>
                PAASCU Level I: Teacher Education Program & Business Administration Program <br>
                PAASCU Level I: Grade School & Senior High School Department <br>
                (Philippine Accrediting Association of Schools, Colleges, and Universities) <br>
                <b>ACADEMIC YEAR {{ $academicYear ?? '2025 – 2026' }}</b>
            </div>
        </div>
        <img class="logo" src="/images/DSA.png" alt="DSA Logo" />
    </div>

    <!-- TITLE -->
    <div class="title">Attendance Sheet</div>

    <div class="event">
        {{ $event->event_name ?? 'Event Name' }}
    </div>

    <div class="details">
        {{ $eventDateTimeLabel ?? '' }}
    </div>

    <div class="no-attendees">
        No students have checked in for this event yet.
    </div>
</div>
@endif

@foreach($sections as $section)
<div class="page">

    <!-- HEADER -->
    <div class="header-container">
        <img class="logo" src="/images/SRCB.png" alt="SRCB Logo" />
        <div class="header-text">
            <div class="school-name">
                ST. RITA'S COLLEGE OF BALINGASAG, INC.
            </div>

            <div class="info">
                Balingasag, Misamis Oriental <br>
                Email: ritarian@srcb.edu.ph | Website: www.srcb.edu.ph <br>
                Tel. (088)323-7159 / Mobile: +63-929-734-0012 (SMART); +63-975-637-9948 (Globe) <br>
                PAASCU Level II Re-Accredited: Junior High School Department <br>
                PAASCU Level I: Teacher Education Program & Business Administration Program <br>
                PAASCU Level I: Grade School & Senior High School Department <br>
                (Philippine Accrediting Association of Schools, Colleges, and Universities) <br>
                <b>ACADEMIC YEAR {{ $academicYear ?? '2025 – 2026' }}</b>
            </div>
        </div>
        <img class="logo" src="/images/DSA.png" alt="DSA Logo" />
    </div>

    <!-- TITLE -->
    <div class="title">Attendance Sheet</div>

    <div class="event">
        {{ $event->event_name ?? 'Event Name' }}
    </div>

    <div class="details">
        {{ $eventDateTimeLabel ?? 'March 10, 2026 | 1:00 PM | SRCB Audi-Gym' }}
    </div>

    <!-- PROGRAM & YEAR LEVEL -->
    <div class="program">
        {{ $section['program_year_label'] ?? $section['course'] ?? 'Program Name' }}
    </div>

    <div class="line">____________________________</div>

    <!-- TABLE -->
    <table>
        <thead>
            <tr>
                <th class="col-no">No.</th>
                <th class="col-id">Student ID</th>
                <th class="col-name">Student's Name</th>
                <th class="col-major">Program & Year</th>
                <th class="col-time">Time In</th>
                <th class="col-time-out">Time Out</th>
                <th class="col-status">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($section['tableRows'] as $index => $row)
            @php
                $statusStr = strtolower((string) ($row['status'] ?? ''));
                $statusColor = '#000';
                if ($statusStr === 'absent') {
                    $statusColor = '#b91c1c';
                } elseif ($statusStr === 'late') {
                    $statusColor = '#b45309';
                } elseif ($statusStr === 'present') {
                    $statusColor = '#15803d';
                }
            @endphp
            <tr style="{{ $statusStr === 'absent' ? 'background-color: #fafafa;' : '' }}">
                <td class="col-no">{{ $index + 1 }}</td>
                <td style="text-align: center;">{{ $row['student_id'] ?? '—' }}</td>
                <td>{{ $row['name'] ?? '' }}</td>
                <td>{{ $row['major'] ?? '' }} {{ !empty($row['year_level']) && $row['year_level'] !== '—' && $row['year_level'] !== 'General' ? '('.$row['year_level'].')' : '' }}</td>
                <td style="text-align: center;">{{ $row['checked_in_at'] ?? '—' }}</td>
                <td style="text-align: center;">{{ $row['time_out'] ?? '—' }}</td>
                <td style="text-align: center; color: {{ $statusColor }}; font-weight: bold;">{{ $row['status'] ?? '—' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="no-attendees">No students registered for this program and year level.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="total-attendees">
        <span>Section Summary ({{ $section['program_year_label'] ?? $section['course'] ?? 'Program' }}):</span>&nbsp;
        <strong>Total: {{ $section['total_count'] ?? count($section['tableRows']) }}</strong> &nbsp;|&nbsp;
        <span style="color: #15803d; font-weight: bold;">Present/Late: {{ $section['present_count'] ?? count($section['tableRows']) }}</span> &nbsp;|&nbsp;
        <span style="color: #b91c1c; font-weight: bold;">Absent: {{ $section['absent_count'] ?? 0 }}</span>
    </div>

</div>
@endforeach

@if(isset($totalStudents) && count($sections) > 1)
<div class="total-attendees" style="margin-top: 20px; font-size: 13px; border-top: 1px solid #000; padding-top: 8px;">
    <strong>Overall Summary:</strong> {{ $totalStudents }} Students &nbsp;|&nbsp;
    <span style="color: #15803d; font-weight: bold;">Present/Late: {{ $totalAttendees ?? 0 }}</span> &nbsp;|&nbsp;
    <span style="color: #b91c1c; font-weight: bold;">Absent: {{ $totalAbsent ?? 0 }}</span>
</div>
@endif

<div class="footer">
    Printed on: {{ now()->format('F d, Y - g:i A') }}
</div>

<script>
    window.onload = function() {
        window.print();
    };
</script>

</body>
</html>