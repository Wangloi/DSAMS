<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisciplinaryRule extends Model
{
    protected $fillable = [
        'name',
        'description',
        'trigger_section',
        'conditions',
        'result_action',
        'priority',
        'is_active',
    ];

    protected $casts = [
        'conditions' => 'array',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('priority', 'desc');
    }
}
