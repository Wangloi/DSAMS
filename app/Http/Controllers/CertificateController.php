<?php

namespace App\Http\Controllers;

use App\Models\AdminUser;
use App\Models\Attendance;
use App\Models\Certificate;
use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\Event;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Student|null $student */
        $student = auth()->guard('student')->user();

        if (! $student instanceof Student) {
            abort(403);
        }

        try {
            $admin = AdminUser::query()->first();
            $activeAdminName = $admin?->name ?? 'Rey John N. Bongcas';

            $withRelations = ['event', 'student'];
            if (Schema::hasTable('certificates') && Schema::hasColumn('certificates', 'evaluation_id')) {
                $withRelations[] = 'evaluation';
            }

            $certificates = Certificate::query()
                ->with($withRelations)
                ->where('student_id', $student->id)
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedCerts = $certificates
                ->map(function ($certificate) use ($activeAdminName) {
                    return $certificate instanceof Certificate
                        ? $this->formatCertificate($certificate, $activeAdminName)
                        : null;
                })
                ->filter()
                ->values()
                ->all();

            $availableCerts = $this->availableCertificatesForStudent($student);
        } catch (\Throwable $e) {
            Log::error('[CertificateController::index] Error loading certificates: ' . $e->getMessage(), [
                'exception' => $e,
                'student_id' => $student->id,
            ]);
            $activeAdminName = 'Rey John N. Bongcas';
            $formattedCerts = [];
            $availableCerts = [];
        }

        return Inertia::render('student/certificates/index', [
            'student' => [
                'id' => $student->id,
                'name' => (string) ($student->name ?? ''),
                'student_id' => (string) ($student->student_id ?? ''),
                'course' => (string) ($student->course ?? $student->program ?? ''),
                'year_level' => (string) ($student->year_level ?? ''),
            ],
            'activeAdminName' => $activeAdminName,
            'certificates' => $formattedCerts,
            'availableCertificates' => $availableCerts,
            'highlightCertificateId' => $request->query('certificate'),
        ]);
    }

    public function generateCertificate(Request $request, Event $event): JsonResponse
    {
        /** @var Student|null $student */
        $student = auth()->guard('student')->user();

        if (! $student instanceof Student) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if student attended the event
        $attendance = Attendance::query()
            ->where('event_id', $event->id)
            ->where('student_id', $student->id)
            ->first();

        if (! $attendance) {
            return response()->json(['message' => 'You must have an official attendance record for this event to receive a certificate.'], 422);
        }

        if (in_array(strtolower((string) $attendance->status), ['incomplete', 'left_early', 'absent'], true) || empty($attendance->checked_out_at)) {
            return response()->json([
                'message' => 'Incomplete Attendance: Certificate cannot be issued because you did not record a valid Time-Out inside the venue upon event conclusion.',
            ], 422);
        }

        if (! empty($attendance->is_flagged)) {
            return response()->json([
                'message' => 'Attendance Flagged for Review: ' . ($attendance->flagged_reason ?: 'Your attendance was flagged for missing mid-session presence verification.') . ' Please contact your Program Head or DSA Marshal to review and clear this flag before generating your certificate.',
            ], 422);
        }

        $evaluation = Evaluation::query()
            ->where('event_id', $event->id)
            ->where('is_active', true)
            ->where('is_archived', false)
            ->orderByDesc('id')
            ->first();

        if ($evaluation) {
            $evaluationCompleted = EvaluationResponse::query()
                ->where('evaluation_id', $evaluation->id)
                ->where('student_id', $student->id)
                ->exists();

            if (! $evaluationCompleted) {
                return response()->json(['message' => 'You must complete the evaluation for this event to receive a certificate'], 422);
            }
        }

        $admin = AdminUser::query()->first();
        $adminName = $admin?->name ?? 'Rey John N. Bongcas';

        try {
            $certificate = \Illuminate\Support\Facades\DB::transaction(function () use ($student, $event, $evaluation, $adminName) {
                // Check if certificate already exists with row-level locking
                $existingCertificate = Certificate::query()
                    ->where('student_id', $student->id)
                    ->where('event_id', $event->id)
                    ->lockForUpdate()
                    ->first();

                if ($existingCertificate) {
                    return $existingCertificate;
                }

                // Create certificate record
                return Certificate::create([
                    'student_id' => $student->id,
                    'event_id' => $event->id,
                    'evaluation_id' => $evaluation?->id,
                    'certificate_type' => $evaluation ? 'evaluation_completion' : 'participation',
                    'certificate_number' => Certificate::generateCertificateNumber(),
                    'title' => $evaluation ? 'Certificate of Evaluation Completion' : 'Certificate of Participation',
                    'description' => $evaluation
                        ? 'This certifies that the student has completed the evaluation for '.$event->event_name
                        : 'This is to certify that the student has successfully participated in the event',
                    'issue_date' => Carbon::now(),
                    'issued_by' => 'Department of Student Affairs',
                    'signature_name' => $adminName,
                    'signature_title' => 'Dean of Student Affairs',
                    'is_generated' => false,
                ]);
            });

            return response()->json([
                'message' => 'Certificate generated successfully',
                'certificate' => $this->formatCertificate($certificate->load(['student', 'event', 'evaluation']), $adminName),
            ]);
        } catch (\Illuminate\Database\QueryException $qe) {
            Log::warning('[CertificateController::generateCertificate] Query exception: ' . $qe->getMessage(), [
                'student_id' => $student->id,
                'event_id' => $event->id,
            ]);

            $existing = Certificate::query()
                ->where('student_id', $student->id)
                ->where('event_id', $event->id)
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'Certificate already generated',
                    'certificate' => $this->formatCertificate($existing->load(['student', 'event', 'evaluation']), $adminName),
                ]);
            }

            return response()->json(['message' => 'A conflict occurred while creating your certificate.'], 409);
        } catch (\Throwable $e) {
            Log::error('[CertificateController::generateCertificate] Error generating certificate: ' . $e->getMessage(), [
                'exception' => $e,
                'student_id' => $student->id,
                'event_id' => $event->id,
            ]);

            return response()->json(['message' => 'An unexpected error occurred while generating the certificate.'], 500);
        }
    }

    public function downloadCertificate(Request $request, Certificate $certificate)
    {
        /** @var Student|null $student */
        $student = auth()->guard('student')->user();

        if (! $student instanceof Student || $certificate->student_id !== $student->id) {
            abort(403);
        }

        $certificate = $this->generateAndStorePdf($certificate);

        // Mark as downloaded
        $certificate->update([
            'is_downloaded' => true,
            'downloaded_at' => Carbon::now(),
        ]);

        $filePath = (string) $certificate->certificate_file_path;
        if ($filePath === '' || ! Storage::disk('public')->exists($filePath)) {
            abort(404, 'Certificate file not found');
        }

        return ResponseFacade::download(
            Storage::disk('public')->path($filePath),
            'certificate_'.$certificate->certificate_number.'.pdf',
            ['Content-Type' => 'application/pdf'],
        );
    }

    private function generateCertificatePDF(Certificate $certificate)
    {
        $admin = AdminUser::query()->first();
        $adminName = $admin?->name ?? 'Rey John N. Bongcas';

        if (empty($certificate->signature_name) || $certificate->signature_name === 'DSA Director') {
            $certificate->signature_name = $adminName;
        }
        if (empty($certificate->signature_title) || $certificate->signature_title === 'Director, Student Affairs') {
            $certificate->signature_title = 'Dean of Student Affairs';
        }

        $data = [
            'certificate' => $certificate,
            'student' => $certificate->student,
            'event' => $certificate->event,
            'adminName' => $adminName,
        ];

        $pdf = Pdf::loadView('certificates.template', $data);
        $pdf->setPaper('a4', 'landscape');

        return $pdf;
    }

    public function generateAndStorePdf(Certificate $certificate): Certificate
    {
        $certificate->loadMissing(['student', 'event', 'evaluation']);

        $pdf = $this->generateCertificatePDF($certificate);
        $fileName = 'certificate_'.$certificate->certificate_number.'.pdf';
        $filePath = 'certificates/'.$fileName;

        Storage::disk('public')->put($filePath, $pdf->output());

        $certificate->update([
            'certificate_file_path' => $filePath,
            'is_generated' => true,
            'generated_at' => Carbon::now(),
        ]);

        return $certificate->fresh(['student', 'event', 'evaluation']);
    }

    public function getAvailableCertificates(Request $request)
    {
        /** @var Student|null $student */
        $student = auth()->guard('student')->user();

        if (! $student instanceof Student) {
            abort(403);
        }

        return response()->json([
            'available_certificates' => $this->availableCertificatesForStudent($student),
        ]);
    }

    private function availableCertificatesForStudent(Student $student): array
    {
        try {
            if (! Schema::hasTable('events') || ! Schema::hasTable('attendances')) {
                return [];
            }

            $hasIsFlagged = Schema::hasColumn('attendances', 'is_flagged');

            // Get events the student attended and can get certificates for
            $attendedEvents = Event::query()
                ->whereHas('attendances', function ($query) use ($student, $hasIsFlagged) {
                    $query->where('student_id', $student->id)
                        ->whereIn('status', ['present', 'late', 'completed'])
                        ->whereNotNull('checked_out_at');

                    if ($hasIsFlagged) {
                        $query->where(function ($q) {
                            $q->where('is_flagged', false)->orWhereNull('is_flagged');
                        });
                    }
                })
                ->where('status', 'completed')
                ->where('event_date', '<', Carbon::now())
                ->with(['attendances' => function ($query) use ($student) {
                    $query->where('student_id', $student->id);
                }])
                ->get();

            $availableCertificates = [];
            $hasEvaluationsTable = Schema::hasTable('evaluations');
            $hasResponsesTable = Schema::hasTable('evaluation_responses');

            foreach ($attendedEvents as $event) {
                // Check if certificate already exists
                $hasCertificate = Certificate::query()
                    ->where('student_id', $student->id)
                    ->where('event_id', $event->id)
                    ->exists();

                // Check if evaluation is required and completed
                $evaluationRequired = false;
                $evaluationCompleted = true;

                if ($hasEvaluationsTable) {
                    $evaluationRequired = Evaluation::query()
                        ->where('event_id', $event->id)
                        ->where('is_active', true)
                        ->exists();

                    if ($evaluationRequired) {
                        if ($hasResponsesTable) {
                            $evaluationCompleted = EvaluationResponse::query()
                                ->join('evaluations', 'evaluation_responses.evaluation_id', '=', 'evaluations.id')
                                ->where('evaluations.event_id', $event->id)
                                ->where('evaluations.is_active', true)
                                ->where('evaluation_responses.student_id', $student->id)
                                ->exists();
                        } else {
                            $evaluationCompleted = false;
                        }
                    }
                }

                $availableCertificates[] = [
                    'event_id' => $event->id,
                    'event_name' => $event->event_name,
                    'event_date' => optional($event->event_date)->format('Y-m-d'),
                    'has_certificate' => $hasCertificate,
                    'evaluation_required' => $evaluationRequired,
                    'evaluation_completed' => $evaluationCompleted,
                    'can_generate' => ! $hasCertificate && $evaluationCompleted,
                ];
            }

            return $availableCertificates;
        } catch (\Throwable $e) {
            Log::error('[CertificateController::availableCertificatesForStudent] Error: ' . $e->getMessage(), [
                'exception' => $e,
                'student_id' => $student->id,
            ]);
            return [];
        }
    }

    /**
     * @param Certificate|mixed $certificate
     * @param string|null $activeAdminName
     * @return array<string, mixed>
     */
    private function formatCertificate($certificate, ?string $activeAdminName = null): array
    {
        $adminName = $activeAdminName ?? AdminUser::query()->first()?->name ?? 'Rey John N. Bongcas';
        $signatureName = (string) ($certificate->signature_name ?? '');
        if ($signatureName === '' || $signatureName === 'DSA Director') {
            $signatureName = $adminName;
        }

        return [
            'id' => (string) $certificate->id,
            'certificate_number' => (string) $certificate->certificate_number,
            'title' => (string) $certificate->title,
            'description' => (string) ($certificate->description ?? ''),
            'certificate_type' => (string) ($certificate->certificate_type ?? 'participation'),
            'student_name' => (string) ($certificate->student?->name ?? ''),
            'student_id' => (string) ($certificate->student?->student_id ?? ''),
            'event_name' => (string) ($certificate->event?->event_name ?? ''),
            'event_date' => optional($certificate->event?->event_date)->format('Y-m-d'),
            'issue_date' => optional($certificate->issue_date)->format('Y-m-d'),
            'issued_by' => (string) ($certificate->issued_by ?? ''),
            'signature_name' => $signatureName,
            'signature_title' => (string) ($certificate->signature_title ?: 'Dean of Student Affairs'),
            'is_generated' => (bool) $certificate->is_generated,
            'is_downloaded' => (bool) $certificate->is_downloaded,
            'generated_at' => optional($certificate->generated_at)->format('Y-m-d H:i:s'),
            'downloaded_at' => optional($certificate->downloaded_at)->format('Y-m-d H:i:s'),
        ];
    }
}
