<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramEvaluationApproval extends Model
{
    public const COMPLETION_THRESHOLD = 85;

    protected $fillable = [
        'event_id',
        'evaluation_id',
        'program',
        'eligible_count',
        'submitted_count',
        'completion_percent',
        'approved_for_next_activity',
        'approved_at',
        'approved_by_admin_id',
    ];

    protected $casts = [
        'eligible_count' => 'integer',
        'submitted_count' => 'integer',
        'completion_percent' => 'float',
        'approved_for_next_activity' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function meetsThreshold(): bool
    {
        if ($this->eligible_count <= 0) {
            return false;
        }

        return (float) $this->completion_percent >= self::COMPLETION_THRESHOLD;
    }
}
