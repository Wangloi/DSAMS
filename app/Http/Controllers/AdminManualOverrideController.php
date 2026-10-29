<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Event;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AdminManualOverrideController extends Controller
{
    public function index(Request $request, Event $event): JsonResponse
    {
        // Return attendance rows for this event, showing overrides
        $rows = Attendance::query()
            ->with('student')
            ->where('event_id', $event->id)
            ->orderByDesc('scanned_at')
            ->get()
            ->map(function ($attendance) {
                /** @var Attendance $attendance */
                $student = $attendance->student;

                return [
                    'attendance_id' => $attendance->id,
                    'student_id' => (string) ($student?->student_id ?? $attendance->student_id),
                    'name' => (string) ($student?->name ?? ''),
                    'program' => (string) (($student?->course ?? $student?->program ?? '') ?: '—'),
                    'scanned_at' => optional($attendance->scanned_at)->toDateTimeString(),
                    'checked_in_at' => optional($attendance->checked_in_at)->toDateTimeString(),
                    'checked_out_at' => optional($attendance->checked_out_at)->toDateTimeString(),
                    'status' => (string) ($attendance->status ?? ''),
                    'is_manual_override' => (bool) $attendance->is_manual_override,
                    'manual_override_reason' => $attendance->manual_override_reason,
                ];
            })
            ->values();

        return response()->json([
            'event' => [
                'id' => $event->id,
                'name' => $event->event_name,
                'date' => $event->event_date ? Carbon::parse($event->event_date)->format('Y-m-d') : '',
                'time' => (string) ($event->event_time ?? ''),
                'geofence_enabled' => (bool) ($event->geofence_enabled ?? false),
            ],
            'rows' => $rows,
        ]);
    }

    public function store(Request $request, Event $event): JsonResponse
    {
        $admin = Auth::guard('admin')->user();
        if (!$admin) {
            abort(403);
        }

        if (in_array(strtolower($event->status ?? ''), ['cancelled', 'archived'])) {
            return response()->json(['message' => 'Attendance overrides cannot be applied to cancelled or archived events.'], 422);
        }

        $validated = $request->validate([
            'student_id' => 'required|string',
            'action' => 'required|in:check_in,check_out',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $student = Student::query()->where('student_id', $validated['student_id'])->first();
        if (!$student && ctype_digit($validated['student_id'])) {
            $student = Student::query()->whereKey((int) $validated['student_id'])->first();
        }
        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        try {
            $result = \Illuminate\Support\Facades\DB::transaction(function () use ($event, $student, $admin, $validated) {
                $attendance = Attendance::query()
                    ->where('event_id', $event->id)
                    ->where('student_id', $student->id)
                    ->lockForUpdate()
                    ->first();

                $now = Carbon::now();
                $status = 'present';

                if (!empty($event->registration_end_time) && !empty($event->event_date)) {
                    $eventDateStr = Carbon::parse($event->event_date)->format('Y-m-d');
                    $cutoff = Carbon::parse($eventDateStr . ' ' . $event->registration_end_time);
                    if ($now->greaterThan($cutoff)) {
                        $status = 'late';
                    }
                }

                if (!$attendance) {
                    $attendance = Attendance::create([
                        'event_id' => $event->id,
                        'student_id' => $student->id,
                        'scanned_at' => $now,
                        'status' => $status,
                        'checked_in_at' => $validated['action'] === 'check_in' ? $now : null,
                        'checked_out_at' => $validated['action'] === 'check_out' ? $now : null,
                        'is_manual_override' => true,
                        'manual_override_by_admin_id' => $admin->id,
                        'manual_override_reason' => $validated['reason'],
                        'manual_override_notes' => $validated['notes'] ?? null,
                    ]);
                } elseif ($validated['action'] === 'check_in' && !$attendance->checked_in_at) {
                    $attendance->update([
                        'scanned_at' => $now,
                        'checked_in_at' => $now,
                        'status' => $status,
                        'is_manual_override' => true,
                        'manual_override_by_admin_id' => $admin->id,
                        'manual_override_reason' => $validated['reason'],
                        'manual_override_notes' => $validated['notes'] ?? null,
                    ]);
                } elseif ($validated['action'] === 'check_out' && !$attendance->checked_out_at) {
                    $attendance->update([
                        'scanned_at' => $now,
                        'checked_out_at' => $now,
                        'is_manual_override' => true,
                        'manual_override_by_admin_id' => $admin->id,
                        'manual_override_reason' => $validated['reason'],
                        'manual_override_notes' => $validated['notes'] ?? null,
                    ]);
                } else {
                    return [
                        'conflict' => true,
                        'message' => 'Invalid action or attendance already recorded for this student.',
                    ];
                }

                $event->updateAttendanceCounts();

                if (\Illuminate\Support\Facades\Schema::hasTable('activity_logs')) {
                    \App\Models\ActivityLog::logForUser(
                        $admin,
                        'Attendance Override',
                        ucfirst($validated['action']),
                        "Manual {$validated['action']} override applied for student {$student->name} ({$student->student_id}) on event '{$event->event_name}'. Reason: {$validated['reason']}"
                    );
                }

                return [
                    'conflict' => false,
                    'attendance' => $attendance,
                    'scanned_at' => $now->toDateTimeString(),
                ];
            });

            if ($result['conflict']) {
                return response()->json(['message' => $result['message']], 409);
            }

            /** @var Attendance $attendance */
            $attendance = $result['attendance'];

            return response()->json([
                'attendance_id' => $attendance->id,
                'status' => $attendance->status,
                'action' => $validated['action'],
                'scanned_at' => $result['scanned_at'],
                'student' => [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->name,
                    'program' => (string) ($student->course ?? $student->program ?? ''),
                ],
            ]);
        } catch (\Illuminate\Database\QueryException $qe) {
            \Log::warning('Manual override query exception: ' . $qe->getMessage(), [
                'event_id' => $event->id,
                'student_id' => $student->id,
            ]);
            return response()->json(['message' => 'A database conflict occurred while processing the attendance override.'], 409);
        } catch (\Throwable $e) {
            \Log::error('Manual override unexpected error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'An error occurred while processing the attendance override.'], 500);
        }
    }
}
