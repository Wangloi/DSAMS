<?php

namespace App\Notifications;

use App\Models\Announcement;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class AnnouncementCreated extends Notification
{
    public function __construct(public Announcement $announcement)
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
                'type' => 'announcement_created',
                'announcement_id' => $this->announcement->id,
                'title' => (string) $this->announcement->title,
                'message' => 'New announcement posted.',
            ]
        );
    }
}
