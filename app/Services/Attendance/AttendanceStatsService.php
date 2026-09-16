<?php

namespace App\Services\Attendance;

use App\Models\Attendance;
use App\Models\Event;
use App\Models\Student;
use Illuminate\Support\Collection;

class AttendanceStatsService
{
    /**
     * Get expected students count mapped by program, scoped to event courses & year levels.
     */
    public function getStudentsByProgram(Event $event): Collection
    {
        $courses = is_array($event->courses) ? $event->courses : [];
        $yearLevels = is_array($event->year_levels) ? $event->year_levels : [];

        $query = Student::query();

        if (! empty($courses)) {
            $query->where(function ($q) use ($courses) {
                $q->whereIn('course', $courses)
                  ->orWhereIn('program', $courses);
            });
        }

        if (! empty($yearLevels)) {
            $query->whereIn('year_level', $yearLevels);
        }

        return $query
            ->selectRaw("COALESCE(NULLIF(TRIM(course), ''), NULLIF(TRIM(program), ''), '—') as program, COUNT(*) as total")
            ->groupBy('program')
            ->pluck('total', 'program');
    }

    /**
     * Get live attendance breakdown by course with scanned vs expected metrics.
     */
    public function getCourseBreakdown(Event $event): Collection
    {
        $eventCourses = is_array($event->courses) ? $event->courses : [];
        $eventYearLevels = is_array($event->year_levels) ? $event->year_levels : [];

        return Attendance::query()
            ->join('students', 'attendances.student_id', '=', 'students.id')
            ->where('attendances.event_id', $event->id)
            ->selectRaw("COALESCE(NULLIF(TRIM(students.course), ''), NULLIF(TRIM(students.program), ''), 'Other') as program")
            ->selectRaw('COUNT(*) as scanned')
            ->groupBy('program')
            ->get()
            ->map(function ($item) use ($eventCourses, $eventYearLevels) {
                $expectedQuery = Student::where(function ($q) use ($item) {
                    $q->where('course', $item->program)
                      ->orWhere('program', $item->program);
                });

                if (! empty($eventYearLevels)) {
                    $expectedQuery->whereIn('year_level', $eventYearLevels);
                }

                $expected = $expectedQuery->count();

                return [
                    'program' => $item->program,
                    'scanned' => (int) $item->scanned,
                    'expected' => max((int) $expected, (int) $item->scanned),
                    'percentage' => $expected > 0 ? (int) round(($item->scanned / $expected) * 100) : 100,
                ];
            });
    }

    /**
     * Format initial recent logs for attendance scanner feed.
     */
    public function getRecentLogs(Event $event, int $limit = 100): Collection
    {
        return Attendance::query()
            ->with('student')
            ->where('event_id', $event->id)
            ->orderByDesc('scanned_at')
            ->limit($limit)
            ->get()
            ->map(function (Attendance $attendance) {
                $student = $attendance->student;

                return [
                    'id' => (string) ($student?->student_id ?? $attendance->student_id),
                    'student_id' => (string) ($student?->student_id ?? $attendance->student_id),
                    'name' => (string) ($student?->name ?? 'Unknown Student'),
                    'program' => (string) (($student?->course ?? $student?->program ?? '') ?: '—'),
                    'checked_in_at' => optional($attendance->checked_in_at ?? $attendance->scanned_at)->toDateTimeString() ?: '—',
                    'time' => optional($attendance->scanned_at)->format('h:i A') ?: '—',
                    'status' => (string) ($attendance->status ?? 'valid'),
                    'check_in_distance_m' => $attendance->check_in_distance_m,
                    'check_out_distance_m' => $attendance->check_out_distance_m,
                ];
            })
            ->values();
    }
}
