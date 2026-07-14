<?php

namespace App\Notifications;

use Illuminate\Bus\Batchable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;

class AttendanceScannerNotification extends Notification
{
    use Batchable;

    protected $event;

    public function __construct($event)
    {
        $this->event = $event;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database']; // can add 'mail' etc. as needed
    }

    /**
     * Get the array representation of the notification for database storage.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toDatabase($notifiable)
    {
        return [
            'title' => 'Attendance Scanner Available',
            'message' => 'You are now allowed to scan attendance for ' . $this->event->event_name,
            'event_id' => $this->event->id,
        ];
    }
}
?>
