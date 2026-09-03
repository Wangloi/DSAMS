<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    protected $fillable = [
        'violation_id',
        'incident_type',
        'incident_date',
        'incident_time',
        'location',
        'reported_by',
        'students_involved',
        'description',
        'immediate_action',
        'evidence_paths',
        'classification',
        'status',
        'calling_phase',
        'calling_phase_history',
        'investigation_details',
        'calling_notice_sent_at',
        'calling_notice_details',
        'received_by',
        'is_archived',
    ];

    protected $casts = [
        'students_involved' => 'array',
        'evidence_paths' => 'array',
        'calling_phase_history' => 'array',
        'investigation_details' => 'array',
        'calling_notice_sent_at' => 'datetime',
        'calling_notice_details' => 'array',
        'incident_date' => 'date:Y-m-d',
    ];

    public function violation()
    {
        return $this->belongsTo(Violation::class);
    }

    public function disciplinaryActions()
    {
        return $this->hasMany(DisciplinaryAction::class);
    }
}
