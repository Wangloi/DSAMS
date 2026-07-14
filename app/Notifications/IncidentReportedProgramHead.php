<?php

namespace App\Notifications;

use App\Models\Incident;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class IncidentReportedProgramHead extends Notification
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
                'type' => 'incident_reported_program_head',
                'incident_id' => $this->incident->id,
                'incident_type' => $this->incident->incident_type,
                'status' => $this->incident->status,
                'title' => 'New Incident Report',
                'subtitle' => 'Incident Type: ' . $this->incident->incident_type,
                'message' => 'A new ' . $this->incident->incident_type . ' incident has been reported involving students in your program.',
            ]
        );
    }
}
