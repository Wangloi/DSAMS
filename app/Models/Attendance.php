<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'student_id',
        'scanned_at',
        'status',
        'checked_in_at',
        'checked_out_at',
        'check_in_latitude',
        'check_in_longitude',
        'check_in_accuracy_m',
        'check_in_distance_m',
        'check_in_token_id',
        'check_in_user_agent',
        'check_out_latitude',
        'check_out_longitude',
        'check_out_accuracy_m',
        'check_out_distance_m',
        'is_manual_override',
        'manual_override_by_admin_id',
        'manual_override_reason',
        'manual_override_notes',
        'mid_session_verified_at',
        'is_flagged',
        'flagged_reason',
        'flag_cleared_by_admin_id',
        'flag_cleared_at',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'mid_session_verified_at' => 'datetime',
        'is_manual_override' => 'boolean',
        'is_flagged' => 'boolean',
        'flag_cleared_at' => 'datetime',
    ];

    /**
     * Mark mid-session presence as verified.
     */
    public function verifyMidSession(): void
    {
        $this->update([
            'mid_session_verified_at' => now(),
        ]);
    }

    /**
     * Flag this attendance record for suspicious dwell gap or missing mid-session verification.
     */
    public function flagAttendance(string $reason): void
    {
        $this->update([
            'is_flagged' => true,
            'flagged_reason' => $reason,
        ]);
    }

    /**
     * Clear the attendance flag after Administrative review.
     */
    public function clearFlag(?int $adminId = null): void
    {
        $this->update([
            'is_flagged' => false,
            'flag_cleared_by_admin_id' => $adminId,
            'flag_cleared_at' => now(),
        ]);
    }

    public function event()
    {
        return $this->belongsTo(Event::class)->withoutGlobalScope('hide_program_head_events_from_admin');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
