<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoundItem extends Model
{
    protected $fillable = [
        'date_found',
        'time_found',
        'item_description',
        'place_found',
        'finder_name',
        'contact_info',
        'program',
        'year_level',
        'image_path',
        'status',
        'is_archived',
        'claimed_by',
        'admin_notes',
        'claimed_at',
    ];
}
