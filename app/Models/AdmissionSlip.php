<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionSlip extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'student_name',
        'program_year_level',
        'date_issued',
        'case_text',
        'reason_text',
        'valid_until',
        'status',
        'is_archived',
    ];
}
