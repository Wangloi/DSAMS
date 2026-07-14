<?php

namespace App\Notifications;

use App\Models\Incident;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class IncidentReportedAdmin extends Notification
{
    public function __construct(public Incident $incident, public ?string $reporterName = null)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $reporter = $this->reporterName ?? 'A student';

        return new DatabaseMessage(
            data: [
                'type' => 'incident_reported_admin',
                'incident_id' => $this->incident->id,
                'incident_type' => $this->incident->incident_type,
                'status' => $this->incident->status,
                'title' => 'New Incident Report',
                'subtitle' => 'Reported by ' . $reporter,
                'message' => 'A new ' . $this->incident->incident_type . ' incident has been reported by ' . $reporter . '.',
            ]
        );
    }
}
