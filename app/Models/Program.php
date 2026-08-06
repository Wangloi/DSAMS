<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $fillable = [
        'name',
        'description',
        'code',
        'department',
        'duration',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the events for this program.
     */
    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_program');
    }

    /**
     * Get students for this program.
     */
    public function students()
    {
        return $this->hasMany(Student::class, 'course', 'code');
    }

    /**
     * Get the student count for this program based on Section / Course.
     */
    public function getStudentCountAttribute()
    {
        return Student::whereRaw('LOWER(TRIM(course)) = ?', [strtolower(trim((string) $this->code))])
            ->orWhereRaw('LOWER(TRIM(course)) = ?', [strtolower(trim((string) $this->name))])
            ->count();
    }

    /**
     * Get the status attribute for display purposes.
     */
    public function getStatusAttribute()
    {
        return $this->is_active ? 'active' : 'inactive';
    }

    /**
     * Scope a query to only include active programs.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include inactive programs.
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope a query to filter by department.
     */
    public function scopeByDepartment($query, $department)
    {
        return $query->where('department', $department);
    }
}
