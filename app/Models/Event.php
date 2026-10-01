<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Event extends Model
{
    protected $fillable = [
        'event_name',
        'organizer',
        'location',
        'event_date',
        'event_time',
        'registration_end_time',
        'expected_attendees',
        'description',
        'status',
        'total_attendees',
        'present_count',
        'archived_at',
        'courses',
        'year_levels',
        'scanner_student_id',
        'scanner_student_ids',
        'scanner_portal_active',
        'geofence_enabled',
        'geofence_latitude',
        'geofence_longitude',
        'geofence_radius_m',
        'qr_code',
        'attendance_type',
        'approval_status',
        'activity_plan_path',
        'requested_by',
        'rejection_reason',
    ];

    protected $appends = [
        'activity_plan_url',
        'scanner_students',
    ];

    public function getActivityPlanUrlAttribute(): ?string
    {
        return $this->activity_plan_path ? \Illuminate\Support\Facades\Storage::url($this->activity_plan_path) : null;
    }

    public function getScannerStudentsAttribute(): array
    {
        $allowed = $this->scanner_student_ids;
        if (! is_array($allowed)) {
            $allowed = [];
        }
        $legacy = trim((string) ($this->scanner_student_id ?? ''));
        if ($legacy !== '' && ! in_array($legacy, $allowed, true)) {
            $allowed[] = $legacy;
        }

        if (empty($allowed)) {
            return [];
        }

        try {
            if (! \Illuminate\Support\Facades\Schema::hasTable('students')) {
                return $this->formatFallbackScannerStudents($allowed);
            }

            $students = \Illuminate\Support\Facades\DB::table('students')
                ->where(function ($q) use ($allowed) {
                    $q->whereIn('student_id', $allowed)
                      ->orWhereIn('id', $allowed);
                })
                ->get();

            $resolved = [];
            foreach ($allowed as $identifier) {
                $str = trim((string) $identifier);
                if ($str === '') continue;
                $match = $students->first(function ($s) use ($str) {
                    return (string) ($s->student_id ?? '') === $str || (string) ($s->id ?? '') === $str;
                });
                if ($match) {
                    $firstName = $match->first_name ?? '';
                    $lastName = $match->last_name ?? '';
                    $fullName = trim($firstName . ' ' . $lastName);
                    if ($fullName === '') {
                        $fullName = (string) ($match->name ?? $str);
                    }
                    $resolved[] = [
                        'id' => (string) ($match->student_id ?? $match->id ?? $str),
                        'student_id' => (string) ($match->student_id ?? $str),
                        'name' => $fullName,
                        'course' => $match->course ?? null,
                        'year_level' => $match->year_level ?? null,
                    ];
                } else {
                    $resolved[] = [
                        'id' => $str,
                        'student_id' => $str,
                        'name' => $str,
                        'course' => null,
                        'year_level' => null,
                    ];
                }
            }
            return $resolved;
        } catch (\Throwable) {
            return $this->formatFallbackScannerStudents($allowed);
        }
    }

    private function formatFallbackScannerStudents(array $allowed): array
    {
        return array_values(array_map(function ($id) {
            return [
                'id' => $id,
                'student_id' => (string) $id,
                'name' => (string) $id,
                'course' => null,
                'year_level' => null,
            ];
        }, $allowed));
    }

    protected $casts = [
        'event_date' => 'date:Y-m-d',
        'expected_attendees' => 'integer',
        'total_attendees' => 'integer',
        'present_count' => 'integer',
        'courses' => 'array',
        'year_levels' => 'array',
        'scanner_student_id' => 'string',
        'scanner_student_ids' => 'array',
        'registration_end_time' => 'string',
        'scanner_portal_active' => 'boolean',
        'geofence_enabled' => 'boolean',
        'geofence_latitude' => 'float',
        'geofence_longitude' => 'float',
        'geofence_radius_m' => 'integer',
        'attendance_type' => 'string',
    ];

    protected static function booted(): void
    {
        static::saving(function (Event $event) {
            $rawDate = $event->attributes['event_date'] ?? null;
            $rawTime = $event->attributes['event_time'] ?? null;
            $rawEnd = $event->attributes['registration_end_time'] ?? null;
            if ($rawDate !== null && $rawDate !== '') {
                $event->attributes['status'] = self::deriveLifecycleStatusFromDate($rawDate, $rawTime, $rawEnd);
            }
        });
    }

    /**
     * Resolve structured attendance time windows:
     * - time_in_start: Carbon when Time-In scanning opens
     * - time_in_cutoff: Carbon until which check-in is considered 'present' (on-time)
     * - time_out_start: Carbon when Time-Out scanning opens
     * - time_out_end: Carbon when Time-Out scanning closes
     *
     * @return array{time_in_start: ?Carbon, time_in_cutoff: ?Carbon, time_out_start: ?Carbon, time_out_end: ?Carbon}
     */
    public function getAttendanceTimeWindows(): array
    {
        $dateStr = null;
        if (! empty($this->event_date)) {
            $dateStr = $this->event_date instanceof \DateTimeInterface
                ? $this->event_date->format('Y-m-d')
                : Carbon::parse((string) $this->event_date)->format('Y-m-d');
        }

        if (! $dateStr) {
            return [
                'time_in_start' => null,
                'time_in_cutoff' => null,
                'time_out_start' => null,
                'time_out_end' => null,
            ];
        }

        $timeInStart = null;
        $timeInCutoff = null;

        // Parse event_time (e.g. "07:30", "07:30 - 08:30", "7:30 AM to 8:30 AM")
        $rawEventTime = trim((string) ($this->event_time ?? ''));
        if ($rawEventTime !== '') {
            $delimiters = [' - ', ' – ', ' to ', '-', '–'];
            $matchedDelim = null;
            foreach ($delimiters as $delim) {
                if (str_contains($rawEventTime, $delim)) {
                    $matchedDelim = $delim;
                    break;
                }
            }

            if ($matchedDelim) {
                $parts = explode($matchedDelim, $rawEventTime);
                try {
                    $timeInStart = Carbon::parse($dateStr . ' ' . trim($parts[0]));
                } catch (\Throwable) {}
                try {
                    $timeInCutoff = Carbon::parse($dateStr . ' ' . trim($parts[1]));
                } catch (\Throwable) {}
            } else {
                try {
                    $timeInStart = Carbon::parse($dateStr . ' ' . $rawEventTime);
                    // Default on-time cutoff is 60 minutes after start time if single time
                    $timeInCutoff = $timeInStart->copy()->addMinutes(60);
                } catch (\Throwable) {}
            }
        }

        $timeOutStart = null;
        $timeOutEnd = null;

        // Parse registration_end_time (e.g. "11:00", "11:00 - 12:00", "2026-09-22 11:00:00")
        $rawEndTime = trim((string) ($this->registration_end_time ?? ''));
        if ($rawEndTime !== '') {
            $delimiters = [' - ', ' – ', ' to ', '-', '–'];
            $matchedDelim = null;
            foreach ($delimiters as $delim) {
                if (str_contains($rawEndTime, $delim)) {
                    $matchedDelim = $delim;
                    break;
                }
            }

            if ($matchedDelim) {
                $parts = explode($matchedDelim, $rawEndTime);
                try {
                    $timeOutStart = Carbon::parse($dateStr . ' ' . trim($parts[0]));
                } catch (\Throwable) {}
                try {
                    $timeOutEnd = Carbon::parse($dateStr . ' ' . trim($parts[1]));
                } catch (\Throwable) {}
            } else {
                try {
                    $parsedEnd = Carbon::parse($dateStr . ' ' . $rawEndTime);
                    // Start for OUT is 30 minutes before event end time
                    $timeOutStart = $parsedEnd->copy()->subMinutes(30);
                    $timeOutEnd = $parsedEnd->copy()->addMinutes(60);
                } catch (\Throwable) {
                    try {
                        $parsedEnd = Carbon::parse($rawEndTime);
                        $timeOutStart = $parsedEnd->copy()->subMinutes(30);
                        $timeOutEnd = $parsedEnd->copy()->addMinutes(60);
                    } catch (\Throwable) {}
                }
            }
        }

        // Safety check: ensure time_in_cutoff does not exceed time_out_end if time_out_end is defined
        if ($timeInCutoff && $timeOutEnd && $timeInCutoff->greaterThan($timeOutEnd)) {
            $timeInCutoff = $timeOutEnd->copy();
        }

        return [
            'time_in_start' => $timeInStart,
            'time_in_cutoff' => $timeInCutoff,
            'time_out_start' => $timeOutStart,
            'time_out_end' => $timeOutEnd,
        ];
    }

    /**
     * Evaluate scan timing status and action based on event time windows.
     *
     * @return array{
     *     allowed: bool,
     *     action: 'check_in'|'check_out',
     *     status: 'present'|'late',
     *     error_message: ?string,
     *     status_code: int
     * }
     */
    public function evaluateAttendanceScan(\Carbon\CarbonInterface $now, ?Attendance $existingAttendance = null): array
    {
        $windows = $this->getAttendanceTimeWindows();
        $start = $windows['time_in_start'];
        $cutoff = $windows['time_in_cutoff'];
        $outStart = $windows['time_out_start'];
        $outEnd = $windows['time_out_end'];

        $checkedOutAt = $existingAttendance ? ($existingAttendance->getAttributes()['checked_out_at'] ?? $existingAttendance->checked_out_at) : null;
        $checkedInAt = $existingAttendance ? ($existingAttendance->getAttributes()['checked_in_at'] ?? $existingAttendance->checked_in_at) : null;

        // Case 1: Student is already checked out
        if ($existingAttendance && ! empty($checkedOutAt)) {
            return [
                'allowed' => false,
                'action' => 'check_out',
                'status' => $existingAttendance->status ?? 'present',
                'error_message' => 'Student has already timed out (checked out) for this event.',
                'status_code' => 409,
            ];
        }

        // Case 2: Student is already checked in (attempting Time-Out / Check-Out)
        if ($existingAttendance && ! empty($checkedInAt)) {
            // Check if Time-Out window has started
            if ($outStart && $now->lessThan($outStart)) {
                $statusLabel = ucfirst($existingAttendance->status ?? 'present');
                return [
                    'allowed' => false,
                    'action' => 'check_out',
                    'status' => $existingAttendance->status ?? 'present',
                    'error_message' => "Time-out (Check-out) is not allowed yet. You are already checked in ({$statusLabel}). Time-out scanning starts 30 minutes before event end time (at {$outStart->format('h:i A')})" . ($outEnd ? " to {$outEnd->format('h:i A')}" : '') . '.',
                    'status_code' => 400,
                ];
            }

            // Check if Time-Out window has closed
            if ($outEnd && $now->greaterThan($outEnd)) {
                return [
                    'allowed' => false,
                    'action' => 'check_out',
                    'status' => $existingAttendance->status ?? 'present',
                    'error_message' => "Time-out (Check-out) window is closed. Time-out ended at {$outEnd->format('h:i A')}.",
                    'status_code' => 403,
                ];
            }

            // Time-out is allowed
            return [
                'allowed' => true,
                'action' => 'check_out',
                'status' => $existingAttendance->status ?? 'present',
                'error_message' => null,
                'status_code' => 200,
            ];
        }

        // Case 3: Initial Check-In (no existing attendance record)
        // Check if scanning has started
        if ($start && $now->lessThan($start)) {
            return [
                'allowed' => false,
                'action' => 'check_in',
                'status' => 'present',
                'error_message' => "Attendance scanning has not started yet. Event start time is at {$start->format('h:i A')}.",
                'status_code' => 403,
            ];
        }

        // Check if event scanning has completely closed
        if ($outEnd && $now->greaterThan($outEnd)) {
            return [
                'allowed' => false,
                'action' => 'check_in',
                'status' => 'late',
                'error_message' => "Attendance scanning is closed. Event ended at {$outEnd->format('h:i A')}.",
                'status_code' => 403,
            ];
        }

        // Determine if initial check-in is 'present' (on-time) or 'late'
        $status = 'present';
        if ($cutoff && $now->greaterThan($cutoff)) {
            $status = 'late';
        }

        return [
            'allowed' => true,
            'action' => 'check_in',
            'status' => $status,
            'error_message' => null,
            'status_code' => 200,
            'time_in_cutoff' => $cutoff,
            'time_out_start' => $outStart,
        ];
    }

    /**
     * Compare event calendar date and time boundaries:
     * past date or ended time → completed, active time today → ongoing, future → upcoming.
     *
     * @param  \Carbon\CarbonInterface|string|null  $date
     * @param  string|null  $eventTime
     * @param  string|null  $registrationEndTime
     */
    public static function deriveLifecycleStatusFromDate($date, ?string $eventTime = null, ?string $registrationEndTime = null): string
    {
        if ($date === null || $date === '') {
            return 'upcoming';
        }

        try {
            $formattedDate = Carbon::parse($date)->format('Y-m-d');
            $eventDay = Carbon::parse($formattedDate)->startOfDay();
        } catch (\Throwable) {
            return 'upcoming';
        }

        $now = Carbon::now();
        $today = $now->copy()->startOfDay();

        // 1. Past dates are always completed / ended
        if ($eventDay->lt($today)) {
            return 'completed';
        }

        // 2. Future dates are upcoming
        if ($eventDay->gt($today)) {
            return 'upcoming';
        }

        // 3. Event is scheduled for today: evaluate using structured windows
        $dummy = new static([
            'event_date' => $formattedDate,
            'event_time' => $eventTime,
            'registration_end_time' => $registrationEndTime,
        ]);
        $windows = $dummy->getAttendanceTimeWindows();

        $start = $windows['time_in_start'];
        $end = $windows['time_out_end'] ?? ($windows['time_out_start'] ? $windows['time_out_start']->copy()->addMinutes(60) : null);

        if ($start && $now->lessThan($start)) {
            return 'upcoming';
        }

        if ($end && $now->greaterThanOrEqualTo($end)) {
            return 'completed';
        }

        return 'ongoing';
    }

    /**
     * Find existing schedule conflict (same venue, same date, overlapping time).
     */
    public static function findScheduleConflict(string $eventDate, string $location, string $eventTime, $ignoreEventId = null): ?Event
    {
        if (empty($eventDate) || empty($location)) {
            return null;
        }

        try {
            $formattedDate = Carbon::parse($eventDate)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }

        $cleanLocation = trim(strtolower($location));

        $query = static::whereNull('archived_at')
            ->where('approval_status', '!=', 'rejected')
            ->whereDate('event_date', '=', $formattedDate);

        if ($ignoreEventId) {
            $query->where('id', '!=', $ignoreEventId);
        }

        $sameDayEvents = $query->get();

        foreach ($sameDayEvents as $existingEvent) {
            $existingLocation = trim(strtolower($existingEvent->location ?? ''));
            if ($existingLocation === $cleanLocation || str_contains($existingLocation, $cleanLocation) || str_contains($cleanLocation, $existingLocation)) {
                if (static::isTimeOverlapping($eventTime, (string) $existingEvent->event_time)) {
                    return $existingEvent;
                }
            }
        }

        return null;
    }

    public static function isTimeOverlapping(?string $time1, ?string $time2): bool
    {
        if (empty($time1) || empty($time2)) {
            return true;
        }

        $t1 = trim(strtolower($time1));
        $t2 = trim(strtolower($time2));

        if ($t1 === $t2) {
            return true;
        }

        try {
            $start1 = Carbon::parse($t1);
            $start2 = Carbon::parse($t2);
            $end1 = (clone $start1)->addHours(2);
            $end2 = (clone $start2)->addHours(2);

            return ($start1 < $end2 && $end1 > $start2);
        } catch (\Throwable) {
            return true;
        }
    }

    /**
     * Status always follows the event date (not a manually persisted workflow).
     *
     * @param  mixed  $value
     */
    public function getStatusAttribute($value): string
    {
        $raw = $this->attributes['event_date'] ?? null;
        if ($raw === null || $raw === '') {
            return is_string($value) && in_array($value, ['upcoming', 'ongoing', 'completed'], true)
                ? $value
                : 'upcoming';
        }

        $rawTime = $this->attributes['event_time'] ?? null;
        $rawEnd = $this->attributes['registration_end_time'] ?? null;

        return self::deriveLifecycleStatusFromDate($raw, $rawTime, $rawEnd);
    }

    /**
     * Get the formatted date and time for the event.
     */
    public function getDateTimeAttribute(): string
    {
        $rawDate = $this->attributes['event_date'] ?? null;
        if (! empty($rawDate)) {
            try {
                $datePart = Carbon::parse($rawDate)->format('Y-m-d');
            } catch (\Throwable) {
                $datePart = (string) $rawDate;
            }
        } else {
            $datePart = '';
        }

        return trim($datePart . ' ' . (string) ($this->event_time ?? ''));
    }

    /**
     * Get the attendance rate for the event.
     */
    public function getAttendanceRateAttribute(): float
    {
        if ($this->total_attendees == 0) {
            return 0;
        }
        
        return round(($this->present_count / $this->total_attendees) * 100, 2);
    }

    /**
     * Scope: event date is after today (calendar day, app timezone).
     */
    public function scopeUpcoming($query)
    {
        return $query->whereDate('event_date', '>', Carbon::now()->toDateString());
    }

    /**
     * Scope: event date is today.
     */
    public function scopeOngoing($query)
    {
        return $query->whereDate('event_date', Carbon::now()->toDateString());
    }

    /**
     * Scope: event date is before today.
     */
    public function scopeCompleted($query)
    {
        return $query->whereDate('event_date', '<', Carbon::now()->toDateString());
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('event_date', [$startDate, $endDate]);
    }

    /**
     * Scope a query to search events.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('event_name', 'like', "%{$search}%")
              ->orWhere('organizer', 'like', "%{$search}%")
              ->orWhere('location', 'like', "%{$search}%");
        });
    }

    /**
     * Scope a query to only include active (non-archived) events.
     */
    public function scopeActive($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Scope a query to only include archived events.
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Archive the event.
     */
    public function archive()
    {
        $this->update(['archived_at' => now()]);
    }

    /**
     * Unarchive the event.
     */
    public function unarchive()
    {
        $this->update(['archived_at' => null]);
    }

    /**
     * Check if the event is archived.
     */
    public function isArchived()
    {
        return !is_null($this->archived_at);
    }

    /**
     * Get the programs that belong to the event.
     */
    public function programs()
    {
        return $this->belongsToMany(Program::class, 'event_program');
    }

    /**
     * Get the attendances for the event.
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Students matching this event's target courses and year levels.
     * Empty targets mean all students are eligible (same as attendance event creation).
     */
    public function eligibleStudentsCount(): int
    {
        $query = Student::query()->where('status', 'approved');
        $courses = is_array($this->courses) ? array_values(array_filter($this->courses, fn($c) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $c))) : [];
        $yearLevels = is_array($this->year_levels) ? array_values(array_filter($this->year_levels, fn($y) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $y))) : [];

        if (! empty($courses)) {
            $query->whereIn('course', $courses);
        }
        if (! empty($yearLevels)) {
            $query->whereIn('year_level', $yearLevels);
        }

        return (int) $query->count();
    }

    /**
     * Denominator for attendance UI: stored expected_attendees when set, else eligible pool size.
     */
    public function attendanceCapacity(): int
    {
        $eligible = $this->eligibleStudentsCount();

        $expected = (int) ($this->expected_attendees ?? 0);
        if ($expected > 0) {
            // Never exceed what the target courses + year levels can actually include.
            return min($expected, $eligible);
        }

        return $eligible;
    }


    public function updateAttendanceCounts()
    {
        try {
            $this->total_attendees = (int) $this->attendances()->count();
            $this->present_count = (int) $this->attendances()->where('status', 'present')->count();
            $this->save();
        } catch (\Throwable) {
            // Ignore count update failure
        }
    }

}
