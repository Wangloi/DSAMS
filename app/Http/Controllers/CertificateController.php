<?php

namespace App\Http\Controllers;

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
use Illuminate\Support\Facades\Response as ResponseFacade;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    public function index(Request $request): Response
    {
        $student = auth()->guard('student')->user();

        if (! $student) {
            abort(403);
        }

        $certificates = Certificate::query()
            ->with(['event', 'student', 'evaluation'])
            ->where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('student/certificates/index', [
            'student' => [
                'id' => $student->id,
                'name' => (string) ($student->name ?? ''),
                'student_id' => (string) ($student->student_id ?? ''),
                'course' => (string) ($student->course ?? $student->program ?? ''),
                'year_level' => (string) ($student->year_level ?? ''),
            ],
            'certificates' => $certificates
                ->map(fn (Certificate $certificate) => $this->formatCertificate($certificate))
                ->values()
                ->all(),
            'availableCertificates' => $this->availableCertificatesForStudent($student),
            'highlightCertificateId' => $request->query('certificate'),
        ]);
    }

    public function generateCertificate(Request $request, Event $event): JsonResponse
    {
        $student = auth()->guard('student')->user();

        if (! $student) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if student attended the event
        $attendance = Attendance::query()
            ->where('event_id', $event->id)
            ->where('student_id', $student->id)
            ->where('status', 'present')
            ->first();

        if (! $attendance) {
            return response()->json(['message' => 'You must attend this event to receive a certificate'], 422);
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

        // Check if certificate already exists
        $existingCertificate = Certificate::query()
            ->where('student_id', $student->id)
            ->where('event_id', $event->id)
            ->first();

        if ($existingCertificate) {
            return response()->json([
                'message' => 'Certificate already generated',
                'certificate' => $this->formatCertificate($existingCertificate->load(['student', 'event', 'evaluation'])),
            ]);
        }

        // Create certificate record
        $certificate = Certificate::create([
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
            'signature_name' => 'DSA Director',
            'signature_title' => 'Director, Student Affairs',
            'is_generated' => false,
        ]);

        return response()->json([
            'message' => 'Certificate record created successfully',
            'certificate' => $this->formatCertificate($certificate->load(['student', 'event', 'evaluation'])),
        ]);
    }

    public function downloadCertificate(Request $request, Certificate $certificate)
    {
        $student = auth()->guard('student')->user();

        if (! $student || $certificate->student_id !== $student->id) {
            abort(403);
        }

        if (! $certificate->is_generated || ! $certificate->certificate_file_path) {
            $certificate = $this->generateAndStorePdf($certificate);
        }

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
        $data = [
            'certificate' => $certificate,
            'student' => $certificate->student,
            'event' => $certificate->event,
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
        $student = auth()->guard('student')->user();

        if (! $student) {
            abort(403);
        }

        return response()->json([
            'available_certificates' => $this->availableCertificatesForStudent($student),
        ]);
    }

    private function availableCertificatesForStudent(Student $student): array
    {
        // Get events the student attended and can get certificates for
        $attendedEvents = Event::query()
            ->whereHas('attendances', function ($query) use ($student) {
                $query->where('student_id', $student->id)
                    ->where('status', 'present');
            })
            ->where('status', 'completed')
            ->where('event_date', '<', Carbon::now())
            ->with(['attendances' => function ($query) use ($student) {
                $query->where('student_id', $student->id);
            }])
            ->get();

        $availableCertificates = [];

        foreach ($attendedEvents as $event) {
            // Check if certificate already exists
            $hasCertificate = Certificate::query()
                ->where('student_id', $student->id)
                ->where('event_id', $event->id)
                ->exists();

            // Check if evaluation is required and completed
            $evaluationRequired = EvaluationResponse::query()
                ->join('evaluations', 'evaluation_responses.evaluation_id', '=', 'evaluations.id')
                ->where('evaluations.event_id', $event->id)
                ->where('evaluations.is_active', true)
                ->exists();

            $evaluationCompleted = ! $evaluationRequired || EvaluationResponse::query()
                ->join('evaluations', 'evaluation_responses.evaluation_id', '=', 'evaluations.id')
                ->where('evaluations.event_id', $event->id)
                ->where('evaluations.is_active', true)
                ->where('evaluation_responses.student_id', $student->id)
                ->exists();

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
    }

    private function formatCertificate(Certificate $certificate): array
    {
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
            'signature_name' => (string) ($certificate->signature_name ?? ''),
            'signature_title' => (string) ($certificate->signature_title ?? ''),
            'is_generated' => (bool) $certificate->is_generated,
            'is_downloaded' => (bool) $certificate->is_downloaded,
            'generated_at' => optional($certificate->generated_at)->format('Y-m-d H:i:s'),
            'downloaded_at' => optional($certificate->downloaded_at)->format('Y-m-d H:i:s'),
        ];
    }
}
