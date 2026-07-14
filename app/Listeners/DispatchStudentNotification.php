<?php

namespace App\Listeners;

use App\Events\StudentNotificationRequested;
use App\Models\Student;
use App\Notifications\StudentSystemNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;

class DispatchStudentNotification
{
    public function handle(StudentNotificationRequested $event): void
    {
        if (! Schema::hasTable('notifications') || empty($event->studentIds)) {
            return;
        }

        $students = Student::query()
            ->whereIn('id', $event->studentIds)
            ->get()
            ->filter(fn (Student $student) => ! $this->alreadyNotified($student, $event));

        if ($students->isEmpty()) {
            return;
        }

        Notification::send($students, new StudentSystemNotification(
            type: $event->type,
            title: $event->title,
            message: $event->message,
            data: $event->data,
            dedupeKey: $event->dedupeKey,
            allowMail: $event->allowMail,
        ));
    }

    private function alreadyNotified(Student $student, StudentNotificationRequested $event): bool
    {
        if (! $event->dedupeKey || ! method_exists($student, 'notifications')) {
            return false;
        }

        return $student->notifications()
            ->where('type', StudentSystemNotification::class)
            ->where('data->dedupe_key', $event->dedupeKey)
            ->exists();
    }
}
