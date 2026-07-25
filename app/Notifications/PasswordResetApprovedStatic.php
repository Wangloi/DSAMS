<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetApprovedStatic extends Notification
{
    use Queueable;

    public $staticPassword;

    /**
     * Create a new notification instance.
     */
    public function __construct($staticPassword)
    {
        $this->staticPassword = $staticPassword;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('Your Password Has Been Reset')
                    ->greeting('Hello!')
                    ->line('Your request to reset your password has been approved by the administrator.')
                    ->line('Your password has been reset to the following temporary static password:')
                    ->line('**' . $this->staticPassword . '**')
                    ->line('Please log in using this password and change it immediately from your profile settings.')
                    ->action('Go to Login', route('login'))
                    ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
