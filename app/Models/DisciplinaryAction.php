<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisciplinaryAction extends Model
{
    protected $fillable = [
        'incident_id',
        'student_id',
        'recommended_action',
        'recommendation_reason',
        'final_action',
        'final_action_reason',
        'remarks',
        'reviewed_by',
        'reviewed_at',
        'status',
        'decision_history',
    ];

    protected $casts = [
        'decision_history' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(AdminUser::class, 'reviewed_by');
    }
}
