<?php

namespace App\Services\Attendance;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Student;
use App\Services\StudentNotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class ConflictAttendanceService
{
    /**
     * Get conflicting events for a given event.
     *
     * @return Collection<int, Event>
     */
    public function getConflictingEvents(Event $event, bool $sameVenueOnly = false): Collection
    {
        return $event->getConflictingEvents($sameVenueOnly);
    }

    /**
     * Given an event and student, find any conflicting events that the student is eligible for.
     *
     * @return Collection<int, Event>
     */
    public function getEligibleConflictingEvents(Event $event, Student $student): Collection
    {
        $conflicts = $this->getConflictingEvents($event);

        return $conflicts->filter(function (Event $conflictEvent) use ($student) {
            return EventEligibilityService::isStudentEligible($student, $conflictEvent);
        })->values();
    }

    /**
     * Record attendance for all eligible conflicting events.
     *
     * @param Event $primaryEvent The event originally being scanned
     * @param Student $student The attendee
     * @param Carbon $now The scan timestamp
     * @param string $action 'check_in' or 'check_out'
     * @param string $status 'present' or 'late'
     * @param array $geoData Optional geolocation and metadata
     * @param Request|null $request Optional request for activity logging
     * @return array<int, array> Details of the conflicted events that were recorded
     */
    public function recordAttendanceForEligibleConflicts(
        Event $primaryEvent,
        Student $student,
        Carbon $now,
        string $action,
        string $status,
        array $geoData = [],
        ?Request $request = null
    ): array {
        $eligibleConflicts = $this->getEligibleConflictingEvents($primaryEvent, $student);
        $recorded = [];

        foreach ($eligibleConflicts as $conflictEvent) {
            $conflictAttendance = Attendance::query()
                ->where('event_id', $conflictEvent->id)
                ->where('student_id', $student->id)
                ->first();

            $lat = $geoData['latitude'] ?? null;
            $lng = $geoData['longitude'] ?? null;
            $accuracyM = $geoData['accuracy_m'] ?? null;
            $distanceM = $geoData['distance_m'] ?? null;
            $tokenId = $geoData['token_id'] ?? null;
            $userAgent = $geoData['user_agent'] ?? null;

            if ($action === 'check_in') {
                if (! $conflictAttendance) {
                    $conflictAttendance = Attendance::create([
                        'event_id' => $conflictEvent->id,
                        'student_id' => $student->id,
                        'scanned_at' => $now,
                        'status' => $status,
                        'checked_in_at' => $now,
                        'check_in_latitude' => $lat,
                        'check_in_longitude' => $lng,
                        'check_in_accuracy_m' => $accuracyM !== null ? (int) round((float) $accuracyM) : null,
                        'check_in_distance_m' => $distanceM !== null ? (int) round((float) $distanceM) : null,
                        'check_in_token_id' => $tokenId,
                        'check_in_user_agent' => $userAgent,
                        'location' => $conflictEvent->location ?? $primaryEvent->location,
                    ]);

                    $conflictEvent->updateAttendanceCounts();
                    try {
                        app(StudentNotificationDispatcher::class)->attendanceRecorded($conflictEvent, $conflictAttendance);
                    } catch (\Throwable) {}

                    $recorded[] = [
                        'event_id' => $conflictEvent->id,
                        'event_name' => $conflictEvent->event_name,
                        'action' => 'check_in',
                        'status' => $status,
                        'time' => $now->format('h:i A'),
                    ];
                }
            } else {
                // check_out
                if ($conflictAttendance && empty($conflictAttendance->checked_out_at)) {
                    $conflictAttendance->update([
                        'scanned_at' => $now,
                        'checked_out_at' => $now,
                        'check_out_latitude' => $lat,
                        'check_out_longitude' => $lng,
                        'check_out_accuracy_m' => $accuracyM !== null ? (int) round((float) $accuracyM) : null,
                        'check_out_distance_m' => $distanceM !== null ? (int) round((float) $distanceM) : null,
                        'check_out_token_id' => $tokenId,
                        'check_out_user_agent' => $userAgent,
                    ]);

                    $conflictEvent->updateAttendanceCounts();

                    $recorded[] = [
                        'event_id' => $conflictEvent->id,
                        'event_name' => $conflictEvent->event_name,
                        'action' => 'check_out',
                        'status' => $conflictAttendance->status ?? $status,
                        'time' => $now->format('h:i A'),
                    ];
                }
            }
        }

        return $recorded;
    }

    /**
     * If the student is not eligible for the primary event, attempt to scan for a conflicting event
     * that the student IS eligible for.
     */
    public function scanConflictingEventIfPrimaryIneligible(
        Event $primaryEvent,
        Student $student,
        Carbon $now,
        array $geoData = [],
        ?Request $request = null
    ): ?array {
        $eligibleConflicts = $this->getEligibleConflictingEvents($primaryEvent, $student);
        if ($eligibleConflicts->isEmpty()) {
            return null;
        }

        $recordedList = [];
        $primaryRecorded = null;

        foreach ($eligibleConflicts as $conflictEvent) {
            $conflictAttendance = Attendance::query()
                ->where('event_id', $conflictEvent->id)
                ->where('student_id', $student->id)
                ->first();

            $requestedMode = $request ? ($request->input('mode') ?? $request->input('scan_type')) : null;
            $scanEval = $conflictEvent->evaluateAttendanceScan($now, $conflictAttendance, $requestedMode);
            if (! $scanEval['allowed']) {
                continue;
            }

            $status = $scanEval['status'];
            $isTimeOut = ($scanEval['action'] === 'check_out');

            $lat = $geoData['latitude'] ?? null;
            $lng = $geoData['longitude'] ?? null;
            $accuracyM = $geoData['accuracy_m'] ?? null;
            $distanceM = $geoData['distance_m'] ?? null;
            $tokenId = $geoData['token_id'] ?? null;
            $userAgent = $geoData['user_agent'] ?? null;

            if (! $conflictAttendance) {
                $conflictAttendance = Attendance::create([
                    'event_id' => $conflictEvent->id,
                    'student_id' => $student->id,
                    'scanned_at' => $now,
                    'status' => $status,
                    'checked_in_at' => $now,
                    'check_in_latitude' => $lat,
                    'check_in_longitude' => $lng,
                    'check_in_accuracy_m' => $accuracyM !== null ? (int) round((float) $accuracyM) : null,
                    'check_in_distance_m' => $distanceM !== null ? (int) round((float) $distanceM) : null,
                    'check_in_token_id' => $tokenId,
                    'check_in_user_agent' => $userAgent,
                    'location' => $conflictEvent->location,
                ]);
            } else {
                $conflictAttendance->update([
                    'scanned_at' => $now,
                    'checked_out_at' => $now,
                    'check_out_latitude' => $lat,
                    'check_out_longitude' => $lng,
                    'check_out_accuracy_m' => $accuracyM !== null ? (int) round((float) $accuracyM) : null,
                    'check_out_distance_m' => $distanceM !== null ? (int) round((float) $distanceM) : null,
                    'check_out_token_id' => $tokenId,
                    'check_out_user_agent' => $userAgent,
                ]);
            }

            $conflictEvent->updateAttendanceCounts();
            try {
                app(StudentNotificationDispatcher::class)->attendanceRecorded($conflictEvent, $conflictAttendance);
            } catch (\Throwable) {}

            $item = [
                'event_id' => $conflictEvent->id,
                'event_name' => $conflictEvent->event_name,
                'attendance_id' => $conflictAttendance->id,
                'action' => $isTimeOut ? 'check_out' : 'check_in',
                'status' => $conflictAttendance->status,
                'time' => $now->format('h:i A'),
            ];

            if ($primaryRecorded === null) {
                $primaryRecorded = [
                    'attendance' => $conflictAttendance,
                    'event' => $conflictEvent,
                    'scanEval' => $scanEval,
                ];
            } else {
                $recordedList[] = $item;
            }
        }

        if (! $primaryRecorded) {
            return null;
        }

        return [
            'primary' => $primaryRecorded,
            'additional_conflicts' => $recordedList,
        ];
    }
}
