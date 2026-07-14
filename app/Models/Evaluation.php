<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Event;
use App\Models\EvaluationResponse;

class Evaluation extends Model
{
    protected $fillable = [
        'name',
        'description',
        'event_id',
        'event',
        'qr_code_path',
        'form_data',
        'is_active',
        'is_archived',
        'published_at',
    ];

    protected $casts = [
        'form_data' => 'array',
        'is_active' => 'boolean',
        'is_archived' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function eventRecord()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function responses()
    {
        return $this->hasMany(EvaluationResponse::class);
    }
}
