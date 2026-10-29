<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionSlip extends Model
{
    use HasFactory;

    public const MONTHLY_LIMIT = 3;

    /**
     * Standard institutional validity rules (in calendar days) based on admission reason.
     */
    public const REASON_VALIDITY_DAYS = [
        'Illness / Not Feeling Well'    => 3,
        'Medical / Dental Appointment' => 1,
        'Family Emergency'              => 3,
        'Bereavement in the Family'     => 7,
        'Transportation Problem'        => 1,
        'Bad Weather / Calamity'        => 2,
        'Official School Activity'      => 5,
        'Financial Concern'             => 3,
        'Others'                        => 2,
    ];

    /**
     * Resolve recommended duration in days for a given reason string.
     */
    public static function getValidityDaysForReason(?string $reason): int
    {
        if (empty($reason)) {
            return 2;
        }

        foreach (self::REASON_VALIDITY_DAYS as $key => $days) {
            if (stripos($reason, $key) !== false) {
                return $days;
            }
        }

        return 2;
    }

    /**
     * Calculate recommended valid until date based on reason and issue date.
     */
    public static function calculateValidUntil(?string $reason, ?string $issueDate = null): string
    {
        $baseDate = $issueDate ? \Carbon\Carbon::parse($issueDate) : now();
        $days = self::getValidityDaysForReason($reason);
        return $baseDate->copy()->addDays($days)->toDateString();
    }

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

    protected $casts = [
        'is_archived' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Helper to return English ordinal suffix (1st, 2nd, 3rd, 4th, etc.).
     */
    public static function formatOrdinal(int $number): string
    {
        if (in_array(($number % 100), [11, 12, 13])) {
            return $number . 'th';
        }
        return match ($number % 10) {
            1 => $number . 'st',
            2 => $number . 'nd',
            3 => $number . 'rd',
            default => $number . 'th',
        };
    }

    /**
     * Number of non-rejected slips requested by this student in the current calendar month up to this slip.
     */
    public function getMonthlySlipCountAttribute(): int
    {
        $created = $this->created_at ? \Carbon\Carbon::parse($this->created_at) : now();

        $query = static::query()
            ->where('id', '<=', (int) ($this->id ?? 0))
            ->where('status', '!=', 'REJECTED')
            ->whereBetween('created_at', [
                $created->copy()->startOfMonth(),
                $created->copy()->endOfMonth(),
            ]);

        if (!empty($this->student_id)) {
            $query->where('student_id', $this->student_id);
        } else {
            $query->where('student_name', $this->student_name);
        }

        return max(1, $query->count());
    }

    /**
     * Lifetime count of non-rejected slips for this student up to this slip (e.g. "4th Request Overall").
     */
    public function getAllTimeSlipCountAttribute(): string
    {
        $query = static::query()
            ->where('id', '<=', (int) ($this->id ?? 0))
            ->where('status', '!=', 'REJECTED');

        if (!empty($this->student_id)) {
            $query->where('student_id', $this->student_id);
        } else {
            $query->where('student_name', $this->student_name);
        }

        $count = max(1, $query->count());

        return self::formatOrdinal($count) . ' Request Overall';
    }

    /**
     * Position of this slip among student's slips in the month it was requested.
     * E.g.: "Slip 2 of 3 (October 2026)"
     */
    public function getSlipCountAttribute(): string
    {
        $created = $this->created_at ? \Carbon\Carbon::parse($this->created_at) : now();
        $count = $this->monthly_slip_count;
        $monthYear = $created->format('F Y');

        return 'Slip ' . $count . ' of ' . self::MONTHLY_LIMIT . ' (' . $monthYear . ')';
    }
}
