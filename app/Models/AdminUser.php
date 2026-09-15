<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\TwoFactorAuthenticatable;

class AdminUser extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'handover_expires_at',
        'is_active',
        'created_by_admin_id',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected $appends = [
        'is_handover_active',
        'handover_expires_at_formatted',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'handover_expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function isHandoverExpired(): bool
    {
        if ($this->handover_expires_at && Carbon::now()->greaterThanOrEqualTo($this->handover_expires_at)) {
            return true;
        }
        return false;
    }

    public function isUnderHandover(): bool
    {
        if ($this->handover_expires_at && Carbon::now()->lessThan($this->handover_expires_at)) {
            return true;
        }
        return false;
    }

    public function getIsHandoverActiveAttribute(): bool
    {
        return $this->isUnderHandover();
    }

    public function getHandoverExpiresAtFormattedAttribute(): ?string
    {
        return $this->handover_expires_at ? $this->handover_expires_at->format('M d, Y g:i A') : null;
    }

    public function creator()
    {
        return $this->belongsTo(AdminUser::class, 'created_by_admin_id');
    }
}
