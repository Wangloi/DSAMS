<?php

namespace App\Listeners;

use App\Events\StudentNotificationRequested;
use App\Models\Student;
use App\Notifications\StudentSystemNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;

class DispatchStudentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(StudentNotificationRequested $event): void
    {
        if (! Schema::hasTable('notifications') || empty($event->studentIds)) {
            return;
        }

        try {
            $pendingIds = $event->studentIds;

            if ($event->dedupeKey) {
                try {
                    $alreadyNotifiedIds = \Illuminate\Support\Facades\DB::table('notifications')
                        ->where('type', StudentSystemNotification::class)
                        ->where('notifiable_type', Student::class)
                        ->whereIn('notifiable_id', $event->studentIds)
                        ->where('data->dedupe_key', $event->dedupeKey)
                        ->pluck('notifiable_id')
                        ->all();

                    $pendingIds = array_values(array_diff($event->studentIds, $alreadyNotifiedIds));
                } catch (\Throwable) {
                    // If JSON path querying fails on older MySQL, fall back to full list
                    $pendingIds = $event->studentIds;
                }
            }

            if (empty($pendingIds)) {
                return;
            }

            $students = Student::query()
                ->whereIn('id', $pendingIds)
                ->get();

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
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('DispatchStudentNotification error: ' . $e->getMessage());
        }
    }
}
