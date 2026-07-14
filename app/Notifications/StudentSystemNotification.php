<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentSystemNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $type,
        public string $title,
        public string $message,
        public array $data = [],
        public ?string $dedupeKey = null,
        public bool $allowMail = true,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($this->allowMail && $this->mailNotificationsEnabled() && ! empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        return new DatabaseMessage([
            ...$this->data,
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'dedupe_key' => $this->dedupeKey,
        ]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title)
            ->greeting('Hello '.(string) ($notifiable->name ?? 'Student').',')
            ->line($this->message)
            ->line('Please sign in to DSAMS for the full details.');
    }

    private function mailNotificationsEnabled(): bool
    {
        $mailer = (string) config('mail.default', '');
        $transport = (string) config("mail.mailers.{$mailer}.transport", '');

        return $mailer !== ''
            && $transport !== ''
            && ! in_array($transport, ['array', 'log'], true)
            && ! empty(config('mail.from.address'));
    }
}
