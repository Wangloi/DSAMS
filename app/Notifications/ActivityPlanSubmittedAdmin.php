<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class ActivityPlanSubmittedAdmin extends Notification
{
    public function __construct(public Event $event, public ?string $requestedBy = null)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $requester = $this->requestedBy ?? 'Program Head';

        return new DatabaseMessage(
            data: [
                'type' => 'activity_plan_submitted_admin',
                'event_id' => $this->event->id,
                'event_name' => $this->event->event_name,
                'status' => $this->event->approval_status ?? 'pending',
                'title' => 'Activity Plan & Schedule Request',
                'subtitle' => "Submitted by {$requester} for \"{$this->event->event_name}\"",
                'message' => "Program Head ({$requester}) submitted an activity plan schedule request for \"{$this->event->event_name}\".",
            ]
        );
    }
}
