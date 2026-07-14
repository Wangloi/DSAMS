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
        'check_out_latitude',
        'check_out_longitude',
        'check_out_accuracy_m',
        'check_out_distance_m',
        'is_manual_override',
        'manual_override_by_admin_id',
        'manual_override_reason',
        'manual_override_notes',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'is_manual_override' => 'boolean',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
