<?php

namespace App\Services;

use App\Events\StudentNotificationRequested;
use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Incident;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StudentNotificationDispatcher
{
    public function notifyStudents(
        iterable $studentIds,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?string $dedupeKey = null,
        bool $allowMail = true,
    ): void {
        $ids = collect($studentIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if (empty($ids)) {
            return;
        }

        $dispatch = fn () => event(new StudentNotificationRequested(
            studentIds: $ids,
            type: $type,
            title: $title,
            message: $message,
            data: $data,
            dedupeKey: $dedupeKey,
            allowMail: $allowMail,
        ));

        DB::transactionLevel() > 0 ? DB::afterCommit($dispatch) : $dispatch();
    }

    public function eventCreated(Event $event): void
    {
        $this->notifyStudents(
            $this->targetStudentIdsForEvent($event),
            'event_upcoming',
            'Upcoming event: '.(string) $event->event_name,
            'A new event has been posted for you.',
            $this->eventPayload($event),
            'event-upcoming-'.$event->id,
        );
    }


    public function eventUpdated(Event $event, array $changedFields): void
    {
        $important = array_values(array_intersect($changedFields, [
            'event_name',
            'event_date',
            'event_time',
            'registration_end_time',
            'location',
            'description',
        ]));

        if (empty($important)) {
            return;
        }

        $this->notifyStudents(
            $this->targetStudentIdsForEvent($event),
            'event_updated',
            'Event details updated',
            (string) $event->event_name.' has updated schedule, venue, or instructions.',
            [
                ...$this->eventPayload($event),
                'changed_fields' => $important,
            ],
            'event-updated-'.$event->id.'-'.md5(implode('|', $important).'|'.$event->updated_at?->timestamp),
        );
    }

    public function scannerAccessGranted(Event $event, array $studentNumbers): void
    {
        // IMPORTANT: this notification must only reach students that match the event filters.
        // If $studentNumbers is empty, it means "no specific student grant"; in this case,
        // we fall back to the event's eligible student pool.
        $eventCourses = is_array($event->courses) ? $event->courses : [];
        $eventYearLevels = is_array($event->year_levels) ? $event->year_levels : [];

        $query = Student::query()->where('is_active', true)->where('status', 'approved');
        if (! empty($eventCourses)) {
            $query->whereIn('course', $eventCourses);
        }
        if (! empty($eventYearLevels)) {
            $query->whereIn('year_level', $eventYearLevels);
        }

        $studentNumbers = array_values(array_filter(array_map(fn ($v) => trim((string) $v), $studentNumbers), fn ($v) => $v !== ''));

        if (! empty($studentNumbers)) {
            // Restrict to explicitly granted student numbers.
            $query->whereIn('student_id', $studentNumbers);
        }

        $studentIds = $query->pluck('id');

        $this->notifyStudents(
            $studentIds,
            // Keep the existing type for compatibility.
            'scanner_portal_access_granted',
            'Attendance Scanner Available',
            'You are now allowed to scan attendance for '.(string) $event->event_name.'.',
            $this->eventPayload($event),
            'scanner-access-'.$event->id,
        );
    }


    public function attendanceScannerAvailable(Event $event): void
    {
        // Must notify ONLY students matching the event's selected courses + year levels.
        // If courses/year_levels are empty, the event targets are considered "all students"
        // (same semantics used by eligibleStudentsCount()).
        $this->notifyStudents(
            $this->targetStudentIdsForEvent($event),
            'attendance_scanner_available',
            'Attendance Scanner Available',
            'You are now allowed to scan attendance for '.(string) $event->event_name,
            [
                ...$this->eventPayload($event),
                'event_id' => $event->id,
            ],
            'attendance-scanner-available-'.$event->id,
        );
    }


    public function attendanceRecorded(Event $event, Attendance $attendance): void
    {
        $this->notifyStudents(
            [$attendance->student_id],
            'attendance_recorded',
            'Attendance recorded',
            'Your attendance for '.(string) $event->event_name.' was recorded as '.(string) $attendance->status.'.',
            [
                ...$this->eventPayload($event),
                'attendance_id' => $attendance->id,
                'status' => $attendance->status,
                'scanned_at' => optional($attendance->scanned_at ?? $attendance->checked_in_at)->toDateTimeString(),
            ],
            'attendance-recorded-'.$attendance->id.'-'.(string) $attendance->updated_at?->timestamp,
            false,
        );
    }

    public function attendanceIssue(Event $event, ?Student $student, string $message, string $reason): void
    {
        if (! $student) {
            return;
        }

        $this->notifyStudents(
            [$student->id],
            'attendance_scan_issue',
            'Attendance scan needs attention',
            $message,
            [
                ...$this->eventPayload($event),
                'reason' => $reason,
            ],
            'attendance-issue-'.$event->id.'-'.$student->id.'-'.md5($reason),
            false,
        );
    }

    public function incidentCreated(Incident $incident): void
    {
        $this->notifyStudents(
            $this->studentIdsForIncident($incident),
            'disciplinary_record_added',
            'Disciplinary record added',
            'A disciplinary or violation record has been added to your DSAMS profile.',
            $this->incidentPayload($incident),
            'incident-created-'.$incident->id,
        );
    }

    public function incidentUpdated(Incident $incident, array $changedFields): void
    {
        if (empty(array_intersect($changedFields, ['status', 'classification', 'description']))) {
            return;
        }

        $this->notifyStudents(
            $this->studentIdsForIncident($incident),
            'disciplinary_status_updated',
            'Violation status updated',
            'Your violation record status has been updated to '.(string) $incident->status.'.',
            [
                ...$this->incidentPayload($incident),
                'changed_fields' => array_values($changedFields),
            ],
            'incident-updated-'.$incident->id.'-'.(string) $incident->updated_at?->timestamp,
        );
    }

    public function announcementCreated(Announcement $announcement): void
    {
        $category = strtolower((string) ($announcement->category ?? 'general'));
        $type = match ($category) {
            'event' => 'event_announcement',
            'discipline' => 'disciplinary_announcement',
            default => 'student_announcement',
        };

        $this->notifyStudents(
            $this->targetStudentIdsForAnnouncement($announcement),
            $type,
            (string) $announcement->title,
            (string) (($announcement->content ?? '') ?: 'New announcement posted.'),
            [
                'announcement_id' => $announcement->id,
                'category' => $announcement->category,
                'event_date' => $announcement->event_date,
                'event_time' => $announcement->event_time,
            ],
            'announcement-'.$announcement->id,
        );
    }

    private function targetStudentIdsForEvent(Event $event): Collection
    {
        return $this->eventStudentQuery($event)->pluck('id');
    }

    private function eventStudentQuery(Event $event): Builder
    {
        $query = Student::query()->where('is_active', true)->where('status', 'approved');
        $courses = is_array($event->courses) ? $event->courses : [];
        $yearLevels = is_array($event->year_levels) ? $event->year_levels : [];

        if (! empty($courses)) {
            $query->whereIn('course', $courses);
        }

        if (! empty($yearLevels)) {
            $query->whereIn('year_level', $yearLevels);
        }

        return $query;
    }

    private function targetStudentIdsForAnnouncement(Announcement $announcement): Collection
    {
        $query = Student::query()->where('is_active', true)->where('status', 'approved');
        $target = (string) ($announcement->target_audience ?? 'student');

        if ($target !== 'all') {
            $query->where('role', 'Student');
        }

        return $query->pluck('id');
    }

    private function studentIdsForIncident(Incident $incident): Collection
    {
        $values = is_array($incident->students_involved) ? $incident->students_involved : [];

        if (empty($values)) {
            return collect();
        }

        return Student::query()
            ->where(function (Builder $query) use ($values): void {
                foreach ($values as $value) {
                    $value = trim((string) $value);
                    if ($value === '') {
                        continue;
                    }

                    $query->orWhere('student_id', $value)
                        ->orWhere('name', $value);

                    if (ctype_digit($value)) {
                        $query->orWhereKey((int) $value);
                    }
                }
            })
            ->pluck('id');
    }

    private function eventPayload(Event $event): array
    {
        return [
            'event_id' => $event->id,
            'event_name' => $event->event_name,
            'event_date' => optional($event->event_date)->format('Y-m-d'),
            'event_time' => $event->event_time,
            'location' => $event->location,
        ];
    }

    private function incidentPayload(Incident $incident): array
    {
        return [
            'incident_id' => $incident->id,
            'incident_type' => $incident->incident_type,
            'classification' => $incident->classification,
            'status' => $incident->status,
            'incident_date' => optional($incident->incident_date)->format('Y-m-d'),
        ];
    }
}
