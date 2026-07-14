<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    protected $fillable = [
        'student_id',
        'event_id',
        'evaluation_id',
        'certificate_type',
        'certificate_number',
        'title',
        'description',
        'issue_date',
        'issued_by',
        'signature_name',
        'signature_title',
        'certificate_file_path',
        'is_generated',
        'is_downloaded',
        'generated_at',
        'downloaded_at',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'is_generated' => 'boolean',
        'is_downloaded' => 'boolean',
        'generated_at' => 'datetime',
        'downloaded_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public static function generateCertificateNumber(): string
    {
        $year = date('Y');
        $sequence = self::whereYear('created_at', $year)->count() + 1;
        return sprintf('CERT-%s-%04d', $year, $sequence);
    }
}
