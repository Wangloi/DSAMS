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

    .header {
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
    .col-no { width: 5%; text-align: center; }
    .col-name { width: 33%; }
    .col-major { width: 15%; }
    .col-time { width: 12%; text-align: center; }
    .col-time-out { width: 12%; text-align: center; }
    .col-status { width: 10%; text-align: center; }
    .col-signature { width: 13%; }

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
    <div class="header">
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
    <div class="header">
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

    <!-- TITLE -->
    <div class="title">Attendance Sheet</div>

    <div class="event">
        {{ $event->event_name ?? 'Event Name' }}
    </div>

    <div class="details">
        {{ $eventDateTimeLabel ?? 'March 10, 2026 | 1:00 PM | SRCB Audi-Gym' }}
    </div>

    <!-- PROGRAM -->
    <div class="program">
        {{ $section['course'] ?? 'Program Name' }}
    </div>

    <div class="line">____________________________</div>

    <!-- TABLE -->
    <table>
        <thead>
            <tr>
                <th class="col-no">No.</th>
                <th class="col-name">Student's Name</th>
                <th class="col-major">Course/Program</th>
                <th class="col-time">Time In</th>
                <th class="col-time-out">Time Out</th>
                <th class="col-status">Status</th>
                <th class="col-signature">Signature</th>
            </tr>
        </thead>
        <tbody>
            @forelse($section['tableRows'] as $index => $row)
            <tr>
                <td class="col-no">{{ $index + 1 }}</td>
                <td>{{ $row['name'] ?? '' }}</td>
                <td>{{ $row['major'] ?? '' }}</td>
                <td style="text-align: center;">{{ $row['checked_in_at'] ?? '' }}</td>
                <td style="text-align: center;">{{ $row['time_out'] ?? '' }}</td>
                <td style="text-align: center;">{{ $row['status'] ?? '' }}</td>
                <td></td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="no-attendees">No attendees for this program.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="total-attendees">
        Total Attendees ({{ $section['course'] ?? 'Program' }}): {{ count($section['tableRows']) }}
    </div>

</div>
@endforeach

@if(isset($totalAttendees) && count($sections) > 1)
<div class="total-attendees" style="margin-top: 20px; font-size: 14px;">
    Overall Total Attendees: {{ $totalAttendees }}
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