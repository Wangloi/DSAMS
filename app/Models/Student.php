<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class Student extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'first_name',
        'middle_name',
        'last_name',
        'student_id',
        'course',
        'year_level',
        'role',
        'is_active',
        'status',
        'verification_status',
        'qr_code_path',
        'is_archived',
        // Student Information Sheet fields
        'entry_status', // 1st Year, 2nd Year, 3rd Year, 4th Year, Freshman, Returnee, Transferee, Old Student
        'program',
        'major',
        'home_address',
        'birthday',
        'place_of_birth',
        'religion',
        'gender', // Male, Female
        'contact_no',
        'nationality',
        // Academic Background
        'elementary_school',
        'elementary_year_graduated',
        'junior_high_school',
        'junior_high_year_graduated',
        'senior_high_school',
        'senior_high_year_graduated',
        // Family Background
        'mother_name',
        'mother_contact',
        'father_name',
        'father_contact',
        'guardian_name',
        'guardian_relation',
        'guardian_contact',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'student_id', 'id');
    }

    public function program()
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function disciplinaryActions()
    {
        return $this->hasMany(DisciplinaryAction::class);
    }

    public function getDisciplinaryHistoryAttribute()
    {
        return $this->disciplinaryActions()
            ->whereIn('status', ['Approved', 'Modified', 'Overridden'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
