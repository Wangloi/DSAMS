<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Evaluation;
use App\Models\Student;

class EvaluationResponse extends Model
{
    protected $fillable = [
        'evaluation_id',
        'student_id',
        'answers',
        'submitted_at',
    ];

    protected $casts = [
        'answers' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function evaluation()
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
