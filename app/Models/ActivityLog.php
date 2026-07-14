<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_name',
        'user_type',
        'module',
        'action',
        'details',
        'user_id',
        'ip_address',
        'user_agent',
        'old_value',
        'new_value',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function log(
        string $module,
        string $action,
        string $details = null,
        ?string $userName = null,
        ?string $userType = null,
        ?int $userId = null,
        ?Request $request = null,
        $oldValue = null,
        $newValue = null
    ): self {
        return static::create([
            'module' => $module,
            'action' => $action,
            'details' => $details,
            'user_name' => $userName,
            'user_type' => $userType,
            'user_id' => $userId,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'old_value' => $oldValue !== null ? json_encode($oldValue) : null,
            'new_value' => $newValue !== null ? json_encode($newValue) : null,
        ]);
    }

    public static function logForUser(
        $user,
        string $module,
        string $action,
        string $details = null,
        ?Request $request = null,
        $oldValue = null,
        $newValue = null
    ): self {
        return static::create([
            'module' => $module,
            'action' => $action,
            'details' => $details,
            'user_name' => $user?->name,
            'user_type' => static::getUserType($user),
            'user_id' => $user?->id,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'old_value' => $oldValue !== null ? json_encode($oldValue) : null,
            'new_value' => $newValue !== null ? json_encode($newValue) : null,
        ]);
    }

    private static function getUserType($user): ?string
    {
        if (!$user) return null;

        if ($user instanceof \App\Models\AdminUser) return 'admin';
        if ($user instanceof \App\Models\Student) return 'student';
        if ($user instanceof \App\Models\ProgramHead) return 'program_head';

        return null;
    }
}
