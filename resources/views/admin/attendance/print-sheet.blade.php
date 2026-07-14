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

    .col-name { width: 55%; }
    .col-major { width: 25%; }
    .col-signature { width: 20%; }

    .page {
        page-break-after: always;
    }

    .page:last-child {
        page-break-after: auto;
    }
</style>
</head>

<body>

@foreach($sections as $section)
<div class="page">

    <!-- HEADER -->
    <div class="header">
        <div class="school-name">
            ST. RITA’S COLLEGE OF BALINGASAG, INC.
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
                <th class="col-name">Student’s Name</th>
                <th class="col-major">Major (If applicable)</th>
                <th class="col-signature">Signature</th>
            </tr>
        </thead>
        <tbody>
            @foreach($section['tableRows'] as $row)
            <tr>
                <td>{{ $row['name'] ?? '' }}</td>
                <td>{{ $row['major'] ?? '' }}</td>
                <td></td>
            </tr>
            @endforeach
        </tbody>
    </table>

</div>
@endforeach

<script>
    window.onload = function() {
        window.print();
    };
</script>

</body>
</html>