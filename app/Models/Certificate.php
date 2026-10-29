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
        'issue_date' => 'date:Y-m-d',
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
        return $this->belongsTo(Event::class)->withoutGlobalScope('hide_program_head_events_from_admin');
    }

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public static function generateCertificateNumber(): string
    {
        $year = date('Y');
        $prefix = "CERT-{$year}-";

        // Query the highest existing certificate number sequence for this year
        $latest = self::where('certificate_number', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->value('certificate_number');

        $nextSeq = 1;
        if ($latest && preg_match('/CERT-\d{4}-(\d+)/', $latest, $matches)) {
            $nextSeq = ((int) $matches[1]) + 1;
        } else {
            $nextSeq = self::whereYear('created_at', $year)->count() + 1;
        }

        // Ensure collision avoidance if IDs or deletions caused gaps
        while (self::where('certificate_number', sprintf('CERT-%s-%04d', $year, $nextSeq))->exists()) {
            $nextSeq++;
        }

        return sprintf('CERT-%s-%04d', $year, $nextSeq);
    }
}
