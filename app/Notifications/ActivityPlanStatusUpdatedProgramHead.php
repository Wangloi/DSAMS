<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class ActivityPlanStatusUpdatedProgramHead extends Notification
{
    public function __construct(public Event $event, public string $approvalStatus)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $statusText = strtoupper($this->approvalStatus);

        return new DatabaseMessage(
            data: [
                'type' => 'activity_plan_status_updated',
                'event_id' => $this->event->id,
                'event_name' => $this->event->event_name,
                'status' => $this->approvalStatus,
                'title' => "Activity Plan {$statusText}",
                'subtitle' => "Schedule request for \"{$this->event->event_name}\" has been {$this->approvalStatus}.",
                'message' => "Administrator has {$this->approvalStatus} your activity plan & schedule request for \"{$this->event->event_name}\".",
            ]
        );
    }
}
