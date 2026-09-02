<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LostReport extends Model
{
    protected $fillable = [
        'student_identifier',
        'item_description',
        'date_lost',
        'time_lost',
        'last_seen_location',
        'contact_info',
        'image_path',
        'status',
    ];

    protected $casts = [
        'date_lost' => 'date:Y-m-d',
    ];
}
