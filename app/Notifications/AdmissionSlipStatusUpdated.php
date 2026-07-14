<?php

namespace App\Notifications;

use App\Models\AdmissionSlip;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class AdmissionSlipStatusUpdated extends Notification
{
    public function __construct(public AdmissionSlip $slip)
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
                'type' => 'admission_slip_status_updated',
                'slip_id' => $this->slip->id,
                'status' => $this->slip->status,
                'message' => 'Your admission slip request status was updated.',
            ]
        );
    }
}
