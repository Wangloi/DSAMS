<?php

namespace App\Notifications;

use App\Models\AdmissionSlip;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class AdmissionSlipRequested extends Notification
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
                'type' => 'admission_slip_requested',
                'slip_id' => $this->slip->id,
                'student_name' => $this->slip->student_name,
                'program_year_level' => $this->slip->program_year_level,
                'status' => $this->slip->status,
                'title' => 'New Admission Slip Request',
                'subtitle' => 'From ' . $this->slip->student_name . ' - ' . $this->slip->case_text,
                'message' => 'New admission slip request submitted.',
            ]
        );
    }
}
