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
    ];

    public function getActivityPlanUrlAttribute(): ?string
    {
        return $this->activity_plan_path ? \Illuminate\Support\Facades\Storage::url($this->activity_plan_path) : null;
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
            $raw = $event->attributes['event_date'] ?? null;
            if ($raw !== null && $raw !== '') {
                $event->attributes['status'] = self::deriveLifecycleStatusFromDate($raw);
            }
        });
    }

    /**
     * Compare event calendar date to "today" in the app timezone:
     * before today → completed, today → ongoing, after today → upcoming.
     *
     * @param  \Carbon\CarbonInterface|string|null  $date
     */
    public static function deriveLifecycleStatusFromDate($date): string
    {
        if ($date === null || $date === '') {
            return 'upcoming';
        }

        try {
            $eventDay = Carbon::parse($date)->startOfDay();
        } catch (\Throwable) {
            return 'upcoming';
        }
        $today = Carbon::now()->startOfDay();

        if ($eventDay->lt($today)) {
            return 'completed';
        }
        if ($eventDay->gt($today)) {
            return 'upcoming';
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

        return self::deriveLifecycleStatusFromDate($raw);
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
        $courses = is_array($this->courses) ? $this->courses : [];
        $yearLevels = is_array($this->year_levels) ? $this->year_levels : [];
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


    /**
     * Update the total attendees and present count based on attendance records.
     */
    public function updateAttendanceCounts()
    {
        $courses = is_array($this->courses) ? $this->courses : [];
        $yearLevels = is_array($this->year_levels) ? $this->year_levels : [];

        $eligibleStudentIdsQuery = Student::query()->select('id')->where('status', 'approved');
        if (!empty($courses)) {
            $eligibleStudentIdsQuery->whereIn('course', $courses);
        }
        if (!empty($yearLevels)) {
            $eligibleStudentIdsQuery->whereIn('year_level', $yearLevels);
        }

        $this->total_attendees = $this->attendances()
            ->whereIn('student_id', $eligibleStudentIdsQuery)
            ->count();

        $this->present_count = $this->attendances()
            ->whereIn('student_id', $eligibleStudentIdsQuery)
            ->where('status', 'present')
            ->count();

        $this->save();
    }

}
