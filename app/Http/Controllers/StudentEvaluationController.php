<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Services\EvaluationEligibilityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StudentEvaluationController extends Controller
{
    public function show(Request $request, Evaluation $evaluation): Response
    {
        $student = Auth::guard('student')->user();
        if (! $student) {
            abort(403);
        }

        if ($evaluation->is_archived) {
            abort(404);
        }

        if (! EvaluationEligibilityService::studentCanAccessEvaluation($student, $evaluation)) {
            abort(403, 'You are not eligible to access this evaluation. You must have been marked present at the event and match the target course/year level.');
        }

        $alreadySubmitted = EvaluationResponse::query()
            ->where('evaluation_id', $evaluation->id)
            ->where('student_id', $student->id)
            ->exists();

        return Inertia::render('student/evaluation/show', [
            'evaluation' => [
                'id' => $evaluation->id,
                'name' => $evaluation->name,
                'eventId' => $evaluation->event_id,
                'eventLabel' => $evaluation->event,
                'formData' => $evaluation->form_data ?? [],
            ],
            'alreadySubmitted' => $alreadySubmitted,
        ]);
    }

    public function submit(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $student = Auth::guard('student')->user();
        if (! $student) {
            abort(403);
        }

        if ($evaluation->is_archived) {
            abort(404);
        }

        if (! EvaluationEligibilityService::studentCanAccessEvaluation($student, $evaluation)) {
            abort(403, 'You are not eligible to submit this evaluation.');
        }

        $already = EvaluationResponse::query()
            ->where('evaluation_id', $evaluation->id)
            ->where('student_id', $student->id)
            ->exists();

        if ($already) {
            return redirect()->back()->with('success', 'You already submitted this evaluation.');
        }

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $answers = is_array($validated['answers']) ? $validated['answers'] : [];
        $questions = is_array($evaluation->form_data) ? ($evaluation->form_data['questions'] ?? []) : [];
        $questions = is_array($questions) ? $questions : [];

        foreach ($questions as $q) {
            if (! is_array($q)) {
                continue;
            }
            $qid = $q['id'] ?? null;
            $type = $q['type'] ?? null;
            $required = (bool) ($q['required'] ?? false);
            $options = $q['options'] ?? [];
            $options = is_array($options) ? $options : [];

            if (! $qid || ! $type) {
                continue;
            }

            $value = $answers[$qid] ?? null;

            if ($required) {
                if ($type === 'rating') {
                    $n = (int) $value;
                    if ($n < 1 || $n > 5) {
                        return redirect()->back()->with('error', 'Please answer all required questions.')->setStatusCode(303);
                    }
                } elseif ($type === 'checkbox') {
                    if (! is_array($value) || count($value) === 0) {
                        return redirect()->back()->with('error', 'Please answer all required questions.')->setStatusCode(303);
                    }
                } else {
                    if (! is_string($value) || trim($value) === '') {
                        return redirect()->back()->with('error', 'Please answer all required questions.')->setStatusCode(303);
                    }
                }
            }

            if ($value === null || $value === '') {
                continue;
            }

            if ($type === 'rating') {
                $n = (int) $value;
                if ($n < 1 || $n > 5) {
                    return redirect()->back()->with('error', 'Invalid rating value.')->setStatusCode(303);
                }
            }

            if ($type === 'multiple_choice') {
                if (! is_string($value) || trim($value) === '') {
                    return redirect()->back()->with('error', 'Invalid multiple choice answer.')->setStatusCode(303);
                }
                if (count($options) > 0 && ! in_array($value, $options, true)) {
                    return redirect()->back()->with('error', 'Invalid multiple choice answer.')->setStatusCode(303);
                }
            }

            if ($type === 'checkbox') {
                if (! is_array($value)) {
                    return redirect()->back()->with('error', 'Invalid checkbox answer.')->setStatusCode(303);
                }
                if (count($options) > 0) {
                    foreach ($value as $v) {
                        if (! is_string($v) || ! in_array($v, $options, true)) {
                            return redirect()->back()->with('error', 'Invalid checkbox answer.')->setStatusCode(303);
                        }
                    }
                }
            }

            if ($type === 'short_text' || $type === 'long_text') {
                if (! is_string($value)) {
                    return redirect()->back()->with('error', 'Invalid text answer.')->setStatusCode(303);
                }
            }
        }

        EvaluationResponse::create([
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id,
            'answers' => $answers,
            'submitted_at' => now(),
        ]);

        $certificate = EvaluationEligibilityService::issueEvaluationCertificate($student, $evaluation);
        if ($certificate && (! $certificate->is_generated || ! $certificate->certificate_file_path)) {
            app(CertificateController::class)->generateAndStorePdf($certificate);
        }

        return redirect()
            ->route('student.certificates.index', ['certificate' => $certificate?->id])
            ->with('success', 'Evaluation submitted successfully. Your e-certificate has been issued.');
    }
}
