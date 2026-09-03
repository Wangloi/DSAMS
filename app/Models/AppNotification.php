<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AppNotification extends Model
{
    use HasFactory;

    protected $table = 'app_notifications';

    protected $fillable = [
        'user_id',
        'user_type',
        'type',
        'title',
        'message',
        'related_id',
        'related_type',
        'is_read',
        'meta_data',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'meta_data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Polymorphic relation to user / student / admin / program head
     */
    public function notifiable(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'user_type', 'user_id');
    }

    /**
     * Scope for unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for specific user / recipient
     */
    public function scopeForRecipient($query, $userId, ?string $userType = null)
    {
        $q = $query->where(function ($sub) use ($userId, $userType) {
            $sub->where('user_id', $userId);
            if ($userType) {
                $sub->where('user_type', $userType);
            }
        })->orWhereNull('user_id'); // Allow global / broadcast notifications

        return $q;
    }
}
