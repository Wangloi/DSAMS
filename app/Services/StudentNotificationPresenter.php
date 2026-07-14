<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\Event;
use App\Models\Student;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class StudentNotificationPresenter
{
    /** Notification types shown to students (must tie to their record in the system). */
    private const ALLOWED_TYPES = [
        'scanner_portal_access_granted',
        'event_upcoming',
        'event_updated',
        'event_announcement',
        'student_announcement',
        'disciplinary_announcement',
        'attendance_scanner_available',
        'attendance_recorded',
        'attendance_scan_issue',
        'disciplinary_record_added',
        'disciplinary_status_updated',
        'evaluation_available',
        'admission_slip_status_updated',
        'admission_slip_submitted',
        'incident_reported_student',
    ];

    public static function recentForStudent(Student $student, int $limit = 5): array
    {
        if (! Schema::hasTable('notifications') || ! method_exists($student, 'notifications')) {
            return [];
        }

        $raw = $student->notifications()
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        Log::info('[StudentNotificationPresenter] recentForStudent loaded', [
            'student_id' => $student->id,
            'count' => $raw->count(),
            'types' => $raw->pluck('data')->map(fn ($d) => (is_array($d) ? ($d['type'] ?? null) : null))->values()->all(),
        ]);

        return $raw
            ->map(fn (DatabaseNotification $notification) => self::format($notification))
            ->filter(function (?array $row) use ($student) {
                if ($row === null) {
                    return false;
                }
                if (($row['type'] ?? '') === 'attendance_scanner_available') {
                    Log::info('[StudentNotificationPresenter] evaluating attendance_scanner_available', [
                        'student_id' => $student->id,
                        'notification_id' => $row['id'] ?? null,
                        'eventId' => $row['eventId'] ?? null,
                        'title' => $row['title'] ?? null,
                        'subtitle' => $row['subtitle'] ?? null,
                    ]);
                }
                return self::isRelevantForStudent($student, $row);
            })
            ->take($limit)
            ->values()
            ->all();
    }

    public static function unreadCountForStudent(Student $student): int
    {
        if (! Schema::hasTable('notifications') || ! method_exists($student, 'unreadNotifications')) {
            return 0;
        }

        return $student->unreadNotifications()
            ->limit(50)
            ->get()
            ->map(fn (DatabaseNotification $notification) => self::format($notification))
            ->filter(fn (?array $row) => $row !== null && self::isRelevantForStudent($student, $row))
            ->count();
    }

    public static function format(DatabaseNotification $notification): ?array
    {
        $data = self::decodeData($notification->data);
        $type = (string) ($data['type'] ?? '');

        if ($type === '' || ! in_array($type, self::ALLOWED_TYPES, true)) {
            return null;
        }

        $title = (string) ($data['title'] ?? $data['message'] ?? 'Notification');
        $subtitle = (string) ($data['subtitle'] ?? '');
        $eventId = null;
        $evaluationId = null;

        if ($type === 'admission_slip_status_updated') {
            $status = (string) ($data['status'] ?? '');
            $slipId = (string) ($data['slip_id'] ?? '');
            $subtitle = trim("Admission Slip #{$slipId} • {$status}");
        }

        if ($type === 'admission_slip_submitted') {
            $subtitle = 'Please visit the Office of Student Affairs (OSA) for approval and to collect your printed admission slip.';
        }

        if ($type === 'incident_reported_student') {
            $incidentType = (string) ($data['incident_type'] ?? '');
            $subtitle = (string) ($data['subtitle'] ?? $data['message'] ?? '');
        }

        if ($type === 'scanner_portal_access_granted') {
            $eventName = (string) ($data['event_name'] ?? '');
            $eventDate = (string) ($data['event_date'] ?? '');
            $subtitle = trim(implode(' • ', array_filter([$eventName, $eventDate])));
            // Be tolerant about key casing coming from different dispatchers/tests
            $eventId = $data['event_id'] ?? $data['eventId'] ?? null;
            $title = $title !== 'Notification' ? $title : 'Scanner portal access';
        }

        if (in_array($type, ['event_upcoming', 'event_updated', 'event_announcement', 'attendance_scanner_available', 'attendance_recorded', 'attendance_scan_issue'], true)) {
            $eventName = (string) ($data['event_name'] ?? '');
            $eventDate = (string) ($data['event_date'] ?? '');
            $subtitle = trim(implode(' • ', array_filter([$eventName, $eventDate])));

            // Be tolerant about key casing coming from different dispatchers/tests
            $eventId = $data['event_id'] ?? $data['eventId'] ?? null;
        }

        if (in_array($type, ['student_announcement', 'disciplinary_announcement'], true)) {
            $category = (string) ($data['category'] ?? 'General');
            $subtitle = trim($category);
        }

        if (in_array($type, ['disciplinary_record_added', 'disciplinary_status_updated'], true)) {
            $status = (string) ($data['status'] ?? '');
            $classification = (string) ($data['classification'] ?? '');
            $subtitle = trim(implode(' • ', array_filter([$classification, $status])));
        }

        if ($type === 'evaluation_available') {
            $eventName = (string) ($data['event_name'] ?? '');
            $eventDate = (string) ($data['event_date'] ?? '');
            $evaluationName = (string) ($data['evaluation_name'] ?? '');
            $subtitle = trim(implode(' • ', array_filter([$eventName ?: $evaluationName, $eventDate])));
            $eventId = $data['event_id'] ?? null;
            $evaluationId = $data['evaluation_id'] ?? null;
            $title = $title !== 'Notification' ? $title : 'Evaluation available';
        }

        return [
            'id' => $notification->id,
            'type' => $type,
            'eventId' => $eventId,
            'evaluationId' => $evaluationId,
            'title' => $title,
            'subtitle' => $subtitle,
            'timeAgo' => $notification->created_at?->diffForHumans() ?? '',
            'is_read' => $notification->read_at !== null,
        ];
    }

    public static function isRelevantForStudent(Student $student, array $notification): bool
    {
        $type = (string) ($notification['type'] ?? '');

        if ($type === 'attendance_scanner_available') {
            Log::info('[StudentNotificationPresenter] isRelevantForStudent attendance_scanner_available (entry)', [
                'student_id' => $student->id,
                'notification_id' => $notification['id'] ?? null,
                'eventId_eventIdKey' => $notification['eventId'] ?? null,
                'eventId_sniff' => $notification['eventId'] ?? null,
            ]);
        }

        return match ($type) {
            'scanner_portal_access_granted' => self::isActiveScannerPortalForStudent($student, $notification),
            'attendance_scanner_available' => self::isActiveScannerPortalForStudent($student, $notification),
            'evaluation_available' => self::isActiveEvaluationForStudent($student, $notification),
            'admission_slip_status_updated' => true,
            'admission_slip_submitted' => true,
            'incident_reported_student' => true,
            'event_upcoming',
            'event_updated',
            'event_announcement',
            'student_announcement',
            'disciplinary_announcement',
            'attendance_recorded',
            'attendance_scan_issue',
            'disciplinary_record_added',
            'disciplinary_status_updated' => true,
            default => false,
        };
    }

    private static function isActiveScannerPortalForStudent(Student $student, array $notification): bool
    {
        if ($student->status !== 'approved') {
            Log::info('[StudentNotificationPresenter] scanner portal relevance rejected (student not approved)', [
                'student_id' => $student->id,
                'status' => $student->status,
            ]);
            return false;
        }

        $eventId = $notification['eventId'] ?? $notification['event_id'] ?? null;
        if (! $eventId) {
            Log::info('[StudentNotificationPresenter] scanner portal relevance rejected (missing eventId)', [
                'student_id' => $student->id,
                'notification_id' => $notification['id'] ?? null,
            ]);
            return false;
        }

        $event = Event::query()->find($eventId);
        if (! $event) {
            Log::info('[StudentNotificationPresenter] scanner portal relevance rejected (event not found)', [
                'student_id' => $student->id,
                'eventId' => $eventId,
                'notification_id' => $notification['id'] ?? null,
            ]);
            return false;
        }

        if ($event->archived_at !== null) {
            Log::info('[StudentNotificationPresenter] scanner portal relevance rejected (event archived)', [
                'student_id' => $student->id,
                'eventId' => $eventId,
                'archived_at' => $event->archived_at,
                'notification_id' => $notification['id'] ?? null,
            ]);
            return false;
        }

        if ((string) ($event->status ?? '') === 'completed') {
            return false;
        }

        $courses = is_array($event->courses) ? $event->courses : [];
        $yearLevels = is_array($event->year_levels) ? $event->year_levels : [];

        if (! empty($courses) && ! in_array($student->course, $courses, true)) {
            return false;
        }

        if (! empty($yearLevels) && ! in_array($student->year_level, $yearLevels, true)) {
            return false;
        }

        $allowed = $event->scanner_student_ids;
        if (! is_array($allowed)) {
            $allowed = [];
        }

        $legacy = trim((string) ($event->scanner_student_id ?? ''));
        if ($legacy !== '' && ! in_array($legacy, $allowed, true)) {
            $allowed[] = $legacy;
        }

        if (! empty($allowed)) {
            $studentId = trim((string) ($student->student_id ?? ''));
            if ($studentId === '' || ! in_array($studentId, $allowed, true)) {
                return false;
            }
        }

        return true;
    }

    private static function isActiveEvaluationForStudent(Student $student, array $notification): bool
    {
        $evaluationId = $notification['evaluationId'] ?? null;
        if (! $evaluationId || ! Schema::hasTable('evaluations')) {
            return false;
        }

        $evaluation = Evaluation::query()->find($evaluationId);
        if (! $evaluation) {
            return false;
        }

        if (Schema::hasTable('evaluation_responses')) {
            $submitted = EvaluationResponse::query()
                ->where('evaluation_id', $evaluation->id)
                ->where('student_id', $student->id)
                ->exists();

            if ($submitted) {
                return false;
            }
        }

        return EvaluationEligibilityService::studentCanAccessEvaluation($student, $evaluation);
    }

    public static function studentIsAllowedScanner(Student $student, Event $event): bool
    {
        $studentId = trim((string) ($student->student_id ?? ''));
        if ($studentId === '') {
            return false;
        }

        $allowed = $event->scanner_student_ids;
        if (! is_array($allowed)) {
            $allowed = [];
        }

        $legacy = trim((string) ($event->scanner_student_id ?? ''));
        if ($legacy !== '' && ! in_array($legacy, $allowed, true)) {
            $allowed[] = $legacy;
        }

        return in_array($studentId, $allowed, true);
    }

    private static function decodeData(mixed $data): array
    {
        if (is_array($data)) {
            return $data;
        }

        if (is_string($data)) {
            return json_decode($data, true) ?? [];
        }

        if (is_object($data)) {
            return (array) $data;
        }

        return [];
    }
}
