<?php

namespace App\Models;

use App\Support\ActiveAuth;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

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
        'created_by_program_head_id',
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
        if (is_string($allowed)) {
            $decoded = json_decode($allowed, true);
            $allowed = is_array($decoded) ? $decoded : (trim($allowed) !== '' ? [$allowed] : []);
        } elseif (! is_array($allowed)) {
            $allowed = [];
        }
        $allowed = array_values(array_unique(array_filter(array_map('strval', (array) $allowed))));

        $legacy = trim((string) ($this->scanner_student_id ?? ''));
        if ($legacy !== '' && ! in_array($legacy, $allowed, true)) {
            $allowed[] = $legacy;
        }

        if (empty($allowed)) {
            return [];
        }

        try {
            if (! Schema::hasTable('students')) {
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

    /** @var bool|null */
    private static ?bool $hasCreatorColumn = null;

    /**
     * Determine if the active request / context is acting as an administrator.
     */
    public static function isAdminActing(): bool
    {
        try {
            if (function_exists('request') && request()) {
                $active = ActiveAuth::resolve(request());
                if ($active === 'admin') {
                    return true;
                }
                if ($active === 'program_head') {
                    return false;
                }
            }
        } catch (\Throwable) {}

        if (Auth::getDefaultDriver() === 'admin') {
            return true;
        }

        try {
            if (Auth::guard('admin')->check() && !Auth::guard('program_head')->check()) {
                return true;
            }
        } catch (\Throwable) {}

        return false;
    }

    /**
     * ID of the logged-in program head when the current request is acting as a program head.
     */
    public static function currentProgramHeadId(): ?int
    {
        if (self::isAdminActing()) {
            return null;
        }

        try {
            if (function_exists('request') && request()) {
                $active = ActiveAuth::resolve(request());
                if ($active === 'program_head' && Auth::guard('program_head')->check()) {
                    return (int) Auth::guard('program_head')->id();
                }
            }
        } catch (\Throwable) {}

        try {
            if (Auth::guard('program_head')->check()) {
                $id = Auth::guard('program_head')->id();
                if ($id) {
                    return (int) $id;
                }
            }
        } catch (\Throwable) {}

        if (Auth::getDefaultDriver() === 'program_head') {
            $user = Auth::guard('program_head')->user() ?: Auth::user();
            return $user ? (int) $user->getAuthIdentifier() : null;
        }

        return null;
    }

    /**
     * Whether the events table supports tracking the creating program head.
     */
    public static function supportsCreatorTracking(): bool
    {
        if (self::$hasCreatorColumn === null) {
            try {
                self::$hasCreatorColumn = Schema::hasColumn('events', 'created_by_program_head_id');
            } catch (\Throwable) {
                self::$hasCreatorColumn = false;
            }
        }

        return self::$hasCreatorColumn;
    }

    /**
     * Scope: events created by a specific program head.
     */
    public function scopeCreatedByProgramHead(Builder $query, int $programHeadId): Builder
    {
        return $query->where($this->getTable() . '.created_by_program_head_id', $programHeadId);
    }

    protected static function booted(): void
    {
        // 1. Events created by program heads must never appear on the admin side.
        static::addGlobalScope('hide_program_head_events_from_admin', function (Builder $builder) {
            if (self::supportsCreatorTracking() && self::isAdminActing()) {
                $builder->whereNull($builder->getModel()->getTable() . '.created_by_program_head_id');
            }
        });

        // 2. Program heads must NEVER see events created by OTHER program heads.
        static::addGlobalScope('isolate_program_head_events', function (Builder $builder) {
            if (!self::supportsCreatorTracking()) {
                return;
            }

            $programHeadId = self::currentProgramHeadId();
            if ($programHeadId !== null) {
                $table = $builder->getModel()->getTable();
                $builder->where(function ($query) use ($table, $programHeadId) {
                    $query->whereNull($table . '.created_by_program_head_id')
                          ->orWhere($table . '.created_by_program_head_id', $programHeadId);
                });
            }
        });

        static::creating(function (Event $event) {
            if (self::supportsCreatorTracking() && empty($event->created_by_program_head_id)) {
                $programHeadId = self::currentProgramHeadId();
                if ($programHeadId !== null) {
                    $event->created_by_program_head_id = $programHeadId;
                }
            }
        });

        static::saving(function (Event $event) {
            $rawDate = $event->attributes['event_date'] ?? null;
            $rawTime = $event->attributes['event_time'] ?? null;
            $rawEnd = $event->attributes['registration_end_time'] ?? null;
            if ($rawDate !== null && $rawDate !== '') {
                $event->attributes['status'] = self::deriveLifecycleStatusFromDate($rawDate, $rawTime, $rawEnd);
            }

            self::filterNonExistentColumns($event);
        });
    }

    protected static ?array $tableColumns = null;

    /**
     * Get cached list of actual columns in the events table
     */
    public static function getTableColumns(): array
    {
        if (self::$tableColumns === null) {
            try {
                self::$tableColumns = Schema::getColumnListing('events');
            } catch (\Throwable) {
                self::$tableColumns = [];
            }
        }

        return self::$tableColumns;
    }

    /**
     * Remove any attributes that do not exist in the database table to prevent SQL 1054 errors on unmigrated hosts
     */
    public static function filterNonExistentColumns(Event $event): void
    {
        $cols = self::getTableColumns();
        if (!empty($cols)) {
            $colsLookup = array_flip($cols);
            foreach (array_keys($event->attributes) as $key) {
                if (!isset($colsLookup[$key])) {
                    unset($event->attributes[$key]);
                }
            }
        }
    }

    /**
     * Whether the events table supports geofencing columns.
     */
    public static function supportsGeofencing(): bool
    {
        $cols = self::getTableColumns();
        return !empty($cols) && in_array('geofence_enabled', $cols, true);
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
    public function evaluateAttendanceScan(\Carbon\CarbonInterface $now, ?Attendance $existingAttendance = null, ?string $requestedMode = null): array
    {
        $windows = $this->getAttendanceTimeWindows();
        $start = $windows['time_in_start'];
        $cutoff = $windows['time_in_cutoff'];
        $outStart = $windows['time_out_start'];
        $outEnd = $windows['time_out_end'];

        $checkedOutAt = $existingAttendance ? ($existingAttendance->getAttributes()['checked_out_at'] ?? $existingAttendance->checked_out_at) : null;
        $checkedInAt = $existingAttendance ? ($existingAttendance->getAttributes()['checked_in_at'] ?? $existingAttendance->checked_in_at) : null;

        // Normalize requested mode ('entry'/'check_in' vs 'exit'/'check_out')
        $isExplicitCheckIn = in_array(strtolower((string) $requestedMode), ['entry', 'check_in', 'in'], true);
        $isExplicitCheckOut = in_array(strtolower((string) $requestedMode), ['exit', 'check_out', 'out'], true);

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
            $statusLabel = ucfirst($existingAttendance->status ?? 'present');

            // If the scanner explicitly set mode to Check-In / Entry, do not accidentally time-out the attendee
            if ($isExplicitCheckIn) {
                $timeStr = '';
                try {
                    $cIn = $checkedInAt instanceof \DateTimeInterface
                        ? Carbon::instance($checkedInAt)
                        : Carbon::parse((string) $checkedInAt);
                    $timeStr = $cIn->format('h:i A');
                } catch (\Throwable) {}

                return [
                    'allowed' => false,
                    'action' => 'check_in',
                    'status' => $existingAttendance->status ?? 'present',
                    'error_message' => "Student is already checked in ({$statusLabel})" . ($timeStr !== '' ? " at {$timeStr}" : '') . ". Switch to Time-Out mode to record check-out.",
                    'status_code' => 409,
                ];
            }

            // Anti-duplicate protection: prevent accidental immediate double-scan within 60 seconds of check-in
            // unless the scanner explicitly selected 'exit' / Time-Out mode
            if (! $isExplicitCheckOut) {
                try {
                    $checkInCarbon = $checkedInAt instanceof \DateTimeInterface
                        ? Carbon::instance($checkedInAt)
                        : Carbon::parse((string) $checkedInAt);

                    if ($now->diffInSeconds($checkInCarbon, false) > -60 && $now->greaterThanOrEqualTo($checkInCarbon)) {
                        return [
                            'allowed' => false,
                            'action' => 'check_in',
                            'status' => $existingAttendance->status ?? 'present',
                            'error_message' => "Already checked in ({$statusLabel}) just now. Please wait at least 1 minute before timing out.",
                            'status_code' => 429,
                        ];
                    }
                } catch (\Throwable) {}
            }

            // Check if scanning during the active event session (before official Time-Out window opens)
            if ($outStart && $now->lessThan($outStart)) {
                // If marshal scanner explicitly set Exit / Check-out mode, record premature early departure
                if ($isExplicitCheckOut) {
                    return [
                        'allowed' => true,
                        'action' => 'check_out',
                        'status' => 'left_early',
                        'is_flagged' => true,
                        'flagged_reason' => 'Departed venue prematurely before official checkout window.',
                        'error_message' => null,
                        'status_code' => 200,
                    ];
                }

                // If scan happens during active event session, record as Mid-Session Spot-Check Presence Verification!
                $lastMidVerify = $existingAttendance->mid_session_verified_at;
                if ($lastMidVerify) {
                    try {
                        $lastMidCarbon = $lastMidVerify instanceof \DateTimeInterface
                            ? Carbon::instance($lastMidVerify)
                            : Carbon::parse((string) $lastMidVerify);
                        if ($now->diffInMinutes($lastMidCarbon) < 15) {
                            return [
                                'allowed' => true,
                                'action' => 'mid_session_verify',
                                'status' => $existingAttendance->status ?? 'present',
                                'error_message' => 'Mid-session in-venue presence already confirmed at ' . $lastMidCarbon->format('h:i A') . '. Active presence verified.',
                                'status_code' => 200,
                            ];
                        }
                    } catch (\Throwable) {}
                }

                return [
                    'allowed' => true,
                    'action' => 'mid_session_verify',
                    'status' => $existingAttendance->status ?? 'present',
                    'error_message' => null,
                    'status_code' => 200,
                ];
            }

            // Check if overall attendance scanning window has completely closed
            if ($outEnd && $now->greaterThan($outEnd)) {
                return [
                    'allowed' => false,
                    'action' => 'check_out',
                    'status' => $existingAttendance->status ?? 'present',
                    'error_message' => "Time-out (Check-out) window is closed. Attendance closed at {$outEnd->format('h:i A')}.",
                    'status_code' => 403,
                ];
            }

            // Official Time-Out Window:
            // Anti-Split Attendance: Detect dwell gap if event >= 90 mins and student skipped mid-session verification
            $sessionMinutes = ($start && $outStart) ? $start->diffInMinutes($outStart) : 0;
            $hasLongSession = $sessionMinutes >= 90;
            $missingMidVerify = empty($existingAttendance->mid_session_verified_at);

            $isFlagged = false;
            $flaggedReason = null;
            $checkoutStatus = $existingAttendance->status ?? 'present';

            if ($hasLongSession && $missingMidVerify) {
                $isFlagged = true;
                $startStr = $start ? $start->format('h:i A') : 'start';
                $outStartStr = $outStart ? $outStart->format('h:i A') : 'conclusion';
                $flaggedReason = "Dwell Gap Alert: Missing mid-session presence verification between {$startStr} and {$outStartStr}. Potential split attendance.";
                $checkoutStatus = 'flagged';
            }

            // Time-out is allowed
            return [
                'allowed' => true,
                'action' => 'check_out',
                'status' => $checkoutStatus,
                'is_flagged' => $isFlagged,
                'flagged_reason' => $flaggedReason,
                'error_message' => null,
                'status_code' => 200,
            ];
        }

        // Case 3: Initial Check-In (no existing attendance record)
        // If the scanner explicitly set mode to Check-Out / Exit, but the student never checked in:
        if ($isExplicitCheckOut) {
            return [
                'allowed' => false,
                'action' => 'check_out',
                'status' => 'absent',
                'error_message' => 'Cannot record Time-Out: Attendee has no prior Time-In record for this event.',
                'status_code' => 422,
            ];
        }

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
     * Check if two location names refer to the same venue or conflicting sub-venue.
     */
    public static function areLocationsConflicting(?string $loc1, ?string $loc2): bool
    {
        if (empty($loc1) || empty($loc2)) {
            return false;
        }

        $l1 = trim(strtolower($loc1));
        $l2 = trim(strtolower($loc2));

        $generics = ['campus / unspecified', 'campus/unspecified', 'unspecified', 'tba', 'to be announced', 'n/a', 'none', 'campus', 'tbd'];
        if (in_array($l1, $generics, true) || in_array($l2, $generics, true)) {
            return false;
        }

        if ($l1 === $l2) {
            return true;
        }

        $norm1 = preg_replace('/[^\w\s]/', ' ', $l1);
        $norm1 = trim(preg_replace('/\s+/', ' ', (string) $norm1));
        $norm2 = preg_replace('/[^\w\s]/', ' ', $l2);
        $norm2 = trim(preg_replace('/\s+/', ' ', (string) $norm2));

        if ($norm1 === $norm2) {
            return true;
        }

        $aliases = [
            'gym' => 'gymnasium',
            'avr' => 'audio visual room',
            'audiovisual room' => 'audio visual room',
            'audiovisual room avr' => 'audio visual room',
            'audio visual room avr' => 'audio visual room',
            'lib' => 'college library',
            'library' => 'college library',
            'caf' => 'cafeteria',
            'canteen' => 'cafeteria',
        ];

        $canon1 = $aliases[$norm1] ?? $norm1;
        $canon2 = $aliases[$norm2] ?? $norm2;

        if ($canon1 === $canon2) {
            return true;
        }

        // Distinct Room / Floor number checking to prevent false positives like "Room 101" vs "Room 102"
        $hasRoom1 = preg_match('/\b(room|rm|floor|flr|lab|laboratory|hall|bldg|building)\s*(\d+|[a-z])\b/i', $norm1, $m1);
        $hasRoom2 = preg_match('/\b(room|rm|floor|flr|lab|laboratory|hall|bldg|building)\s*(\d+|[a-z])\b/i', $norm2, $m2);
        if ($hasRoom1 && $hasRoom2) {
            return $m1[0] === $m2[0] && ($canon1 === $canon2 || str_contains($canon1, $canon2) || str_contains($canon2, $canon1));
        }

        if (str_contains($norm1, $norm2) || str_contains($norm2, $norm1)) {
            if ($hasRoom1 || $hasRoom2) {
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Find existing schedule conflict (same venue, same date, overlapping time window).
     */
    public static function findScheduleConflict(
        string $eventDate,
        string $location,
        string $eventTime,
        $registrationEndTimeOrIgnoreId = null,
        $ignoreEventId = null
    ): ?Event {
        if (empty($eventDate) || empty($location)) {
            return null;
        }

        $registrationEndTime = null;
        if (is_numeric($registrationEndTimeOrIgnoreId) && $ignoreEventId === null) {
            $ignoreEventId = $registrationEndTimeOrIgnoreId;
        } elseif (is_string($registrationEndTimeOrIgnoreId)) {
            $registrationEndTime = $registrationEndTimeOrIgnoreId;
        }

        try {
            $formattedDate = Carbon::parse($eventDate)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }

        $targetEvent = new static([
            'event_date' => $formattedDate,
            'location' => $location,
            'event_time' => $eventTime,
            'registration_end_time' => $registrationEndTime,
        ]);

        $query = static::withoutGlobalScopes()
            ->whereNull('archived_at')
            ->where('approval_status', '!=', 'rejected')
            ->whereDate('event_date', '=', $formattedDate);

        if ($ignoreEventId) {
            $query->where('id', '!=', $ignoreEventId);
        }

        $sameDayEvents = $query->get();

        foreach ($sameDayEvents as $existingEvent) {
            if (static::areLocationsConflicting($location, (string) ($existingEvent->location ?? ''))) {
                if (static::areEventsOverlapping($targetEvent, $existingEvent)) {
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
     * Get all active conflicting events (same date and overlapping time schedule).
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Event>
     */
    public function getConflictingEvents(bool $sameVenueOnly = false)
    {
        $rawDate = $this->getAttributes()['event_date'] ?? $this->event_date;
        if (empty($rawDate)) {
            return collect();
        }

        try {
            $formattedDate = Carbon::parse($rawDate)->format('Y-m-d');
        } catch (\Throwable) {
            return collect();
        }

        $query = static::whereNull('archived_at')
            ->where('approval_status', '!=', 'rejected')
            ->where('id', '!=', $this->id)
            ->whereDate('event_date', '=', $formattedDate);

        $sameDayEvents = $query->get();

        return $sameDayEvents->filter(function ($other) use ($sameVenueOnly) {
            /** @var Event $other */
            if ($sameVenueOnly) {
                if (! static::areLocationsConflicting((string) $this->location, (string) $other->location)) {
                    return false;
                }
            }

            return static::areEventsOverlapping($this, $other);
        })->values();
    }

    /**
     * Check if two events have overlapping time schedules.
     */
    public static function areEventsOverlapping(Event $event1, Event $event2): bool
    {
        try {
            $w1 = $event1->getAttendanceTimeWindows();
            $w2 = $event2->getAttendanceTimeWindows();

            $start1 = $w1['time_in_start'];
            $end1 = $w1['time_out_end'] ?? ($start1 ? (clone $start1)->addHours(2) : null);

            $start2 = $w2['time_in_start'];
            $end2 = $w2['time_out_end'] ?? ($start2 ? (clone $start2)->addHours(2) : null);

            if ($start1 && $end1 && $start2 && $end2) {
                return $start1->lessThan($end2) && $start2->lessThan($end1);
            }
        } catch (\Throwable) {}

        return static::isTimeOverlapping((string) $event1->event_time, (string) $event2->event_time);
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


    public function updateAttendanceCounts(bool $force = false)
    {
        try {
            $throttleKey = 'event:attendance_counts_throttle:' . $this->id;
            if (! $force && \Illuminate\Support\Facades\Cache::has($throttleKey)) {
                return;
            }
            \Illuminate\Support\Facades\Cache::put($throttleKey, true, now()->addSeconds(3));

            // Finalize abandoned / left early attendances if event is completed or past attendance window
            $windows = $this->getAttendanceTimeWindows();
            $outEnd = $windows['time_out_end'];
            $isConcluded = ($this->status === 'completed') || ($outEnd && Carbon::now()->greaterThan($outEnd));

            if ($isConcluded) {
                $this->attendances()
                    ->whereNotNull('checked_in_at')
                    ->whereNull('checked_out_at')
                    ->whereNotIn('status', ['incomplete', 'left_early', 'excused'])
                    ->update(['status' => 'incomplete']);
            }

            $this->total_attendees = (int) $this->attendances()->count();
            $this->present_count = (int) $this->attendances()->whereIn('status', ['present', 'completed'])->count();
            $this->save();
        } catch (\Throwable) {
            // Ignore count update failure
        }
    }

}
