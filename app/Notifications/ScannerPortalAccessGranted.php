<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class ScannerPortalAccessGranted extends Notification
{
    public function __construct(public Event $event)
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
                'type' => 'scanner_portal_access_granted',
                'event_id' => $this->event->id,
                'event_name' => $this->event->event_name,
                'event_date' => optional($this->event->event_date)->format('Y-m-d'),
                'message' => 'You have been granted access to the Attendance Scanner Portal.',
            ]
        );
    }
}
