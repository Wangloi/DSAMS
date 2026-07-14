<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentNotificationRequested
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public array $studentIds,
        public string $type,
        public string $title,
        public string $message,
        public array $data = [],
        public ?string $dedupeKey = null,
        public bool $allowMail = true,
    ) {
        $this->studentIds = array_values(array_unique(array_map('intval', $studentIds)));
    }
}
