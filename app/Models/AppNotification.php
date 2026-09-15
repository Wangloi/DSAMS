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

    protected $appends = [
        'timeAgo',
    ];

    public function getTimeAgoAttribute(): string
    {
        return $this->created_at ? $this->created_at->diffForHumans() : '';
    }

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
     * Scope for specific user / recipient with role isolation
     */
    public function scopeForRecipient($query, $userId, ?string $userType = null)
    {
        return $query->where(function ($q) use ($userId, $userType) {
            $q->where(function ($sub) use ($userId, $userType) {
                $sub->where('user_id', $userId);
                if ($userType) {
                    $sub->where('user_type', $userType);
                }
            });
            if ($userType) {
                $q->orWhere(function ($broadcast) use ($userType) {
                    $broadcast->whereNull('user_id')
                        ->where(function ($b) use ($userType) {
                            $b->where('user_type', 'broadcast')
                              ->orWhere('user_type', $userType);
                        });
                });
            } else {
                $q->orWhereNull('user_id');
            }
        });
    }
}
