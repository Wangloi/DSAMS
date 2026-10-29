<?php

namespace App\Services\Auth;

use App\Models\ActivityLog;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class DeviceBindingService
{
    /**
     * Enforce the "One Device, One Account" policy upon student login.
     *
     * Rules:
     * 1. A physical device (identified by device_uuid) can ONLY be linked to ONE student account.
     *    -> Prevents one student from logging into multiple accounts on their phone to time-in for friends (anti-proxy).
     * 2. A student account can ONLY log in from its registered device.
     *    -> Prevents account sharing / remote credentials use.
     * 3. On initial login, the device is automatically bound to the student.
     * 4. Device switches require DSA Administrator or Program Head authorization (Device Reset).
     *
     * @throws ValidationException
     */
    public function enforceDeviceBinding(Student $student, Request $request): void
    {
        if (! Schema::hasColumn('students', 'device_uuid')) {
            return;
        }

        $deviceUuid = trim((string) $request->input('device_uuid', ''));
        $deviceName = trim((string) $request->input('device_name', ''));

        // If client did not provide a device_uuid, extract from persistent cookie or fallback header hash
        if ($deviceUuid === '') {
            $deviceUuid = trim((string) $request->cookie('dsams_device_uuid', ''));
        }

        // If still empty (e.g. initial request before JS runs), generate or rely on persistent cookie
        if ($deviceUuid === '') {
            return; // Gracefully continue if device identifier couldn't be resolved
        }

        // Rule 1: Check if this physical device is already bound to ANOTHER student account
        $conflictingStudent = Student::query()
            ->where('device_uuid', $deviceUuid)
            ->where('id', '!=', $student->id)
            ->first();

        if ($conflictingStudent) {
            $maskedId = substr((string) ($conflictingStudent->student_id ?? '***'), 0, 4) . '****';
            $otherName = (string) ($conflictingStudent->name ?? 'Another Student');

            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser(
                    $student,
                    'Authentication',
                    'Blocked',
                    "One Device, One Account policy violation: Device {$deviceUuid} is already registered to {$otherName} ({$maskedId}). Attempted proxy login.",
                    $request
                );
            }

            throw ValidationException::withMessages([
                'identifier' => "One Device, One Account Policy: This device is already registered to student {$otherName} ({$maskedId}). To prevent proxy attendance, only one student account is permitted per device.",
                'device' => "This device is already linked to another student account.",
            ]);
        }

        // Rule 2: Check if THIS student is already bound to a DIFFERENT device
        if (! empty($student->device_uuid) && $student->device_uuid !== $deviceUuid) {
            $registeredName = $student->device_name ?: 'Registered Smartphone/Device';
            $boundDate = $student->device_bound_at ? $student->device_bound_at->format('M d, Y') : 'earlier';

            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser(
                    $student,
                    'Authentication',
                    'Blocked',
                    "Device mismatch: Student is bound to [{$student->device_uuid}] ({$registeredName}), but attempted login from [{$deviceUuid}].",
                    $request
                );
            }

            throw ValidationException::withMessages([
                'identifier' => "Device Mismatch: Your student account is bound to your registered device '{$registeredName}' (bound on {$boundDate}). If you replaced or lost your phone, please contact the DSA Administrator or Program Head to reset your device binding.",
                'device' => "Account is locked to another device.",
            ]);
        }

        // Rule 3: If student has not bound a device yet, register this device as their official one
        if (empty($student->device_uuid)) {
            if (method_exists($student, 'bindDevice')) {
                $student->bindDevice($deviceUuid, $deviceName ?: $request->userAgent());
            } else {
                $data = ['device_uuid' => $deviceUuid];
                if (Schema::hasColumn('students', 'device_name')) {
                    $data['device_name'] = $deviceName ?: $request->userAgent();
                }
                if (Schema::hasColumn('students', 'device_bound_at')) {
                    $data['device_bound_at'] = now();
                }
                $student->update($data);
            }

            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser(
                    $student,
                    'Authentication',
                    'Device Registered',
                    "Device successfully bound to student account: " . ($student->device_name ?? $deviceUuid),
                    $request
                );
            }
        }
    }
}
