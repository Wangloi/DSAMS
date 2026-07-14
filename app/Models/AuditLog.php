<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

class AuditLog extends Model
{
    use Prunable;

    protected $fillable = [
        'actor_id',
        'role',
        'target_id',
        'action',
        'old',
        'new',
        'ip',
        'device',
        'request_id',
    ];

    protected $casts = [
        'old' => 'array',
        'new' => 'array',
    ];

    /**
     * Get the prunable model query.
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subDays(30));
    }
}
