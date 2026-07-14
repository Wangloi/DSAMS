<?php

namespace App\Notifications;

use App\Models\AdmissionSlip;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class AdmissionSlipSubmitted extends Notification
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
                'type'     => 'admission_slip_submitted',
                'slip_id'  => $this->slip->id,
                'status'   => $this->slip->status,
                'title'    => 'Admission Slip Request Received',
                'subtitle' => 'Please visit the Office of Student Affairs (OSA) to get your printed admission slip approved.',
                'message'  => 'Your admission slip request has been received. Please go to the Office of Student Affairs (OSA) in person for approval and to collect your printed admission slip.',
            ]
        );
    }
}
