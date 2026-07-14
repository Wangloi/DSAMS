<?php

namespace App\Notifications;

use App\Models\Incident;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class IncidentReportedStudent extends Notification
{
    public function __construct(public Incident $incident)
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
                'type' => 'incident_reported_student',
                'incident_id' => $this->incident->id,
                'incident_type' => $this->incident->incident_type,
                'status' => $this->incident->status,
                'title' => 'Incident Involvement Notice',
                'subtitle' => 'Incident Type: ' . $this->incident->incident_type,
                'message' => 'You have been listed as involved in an incident report (' . $this->incident->incident_type . '). Please check with your Program Head or the Admin for details.',
            ]
        );
    }
}
