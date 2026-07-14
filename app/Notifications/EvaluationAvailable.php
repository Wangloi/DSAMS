<?php

namespace App\Notifications;

use App\Models\Evaluation;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class EvaluationAvailable extends Notification
{
    public function __construct(public Evaluation $evaluation)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $eventName = '';
        $eventDate = '';

        $event = $this->evaluation->eventRecord;
        if ($event) {
            $eventName = (string) ($event->event_name ?? '');
            $eventDate = optional($event->event_date)->format('Y-m-d') ?? '';
        }

        return new DatabaseMessage(
            data: [
                'type' => 'evaluation_available',
                'message' => 'Evaluation is now available.',
                'evaluation_id' => $this->evaluation->id,
                'evaluation_name' => $this->evaluation->name,
                'event_id' => $this->evaluation->event_id,
                'event_name' => $eventName,
                'event_date' => $eventDate,
            ]
        );
    }
}
