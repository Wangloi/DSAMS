<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class PasswordResetRequestedAdmin extends Notification
{
    public function __construct(public string $targetEmail)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        return new DatabaseMessage(
            data: [
                'type' => 'password_reset_requested',
                'status' => 'Pending',
                'title' => 'Password Reset Requested',
                'subtitle' => 'For ' . $this->targetEmail,
                'message' => 'A user has requested a password reset for ' . $this->targetEmail . '. Please review and approve.',
                'url' => route('admin.manage-users') . '?tab=password-resets',
            ]
        );
    }
}
