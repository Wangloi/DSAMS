<?php

namespace App\Http\Controllers;

use App\Models\DisciplinaryAction;
use App\Models\DisciplinaryRule;
use App\Models\Violation;
use App\Services\DisciplinaryService;
use Illuminate\Http\Request;

class DisciplinaryController extends Controller
{
    protected $disciplinaryService;

    public function __construct(DisciplinaryService $disciplinaryService)
    {
        $this->disciplinaryService = $disciplinaryService;
    }

    // Violations endpoints
    public function indexViolations()
    {
        return response()->json(Violation::all());
    }

    public function storeViolation(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|unique:violations',
            'name' => 'required',
            'description' => 'nullable',
            'section' => 'required|in:Warning,Suspension,Exclusion,Expulsion',
        ]);

        $violation = Violation::create($validated);
        return response()->json($violation, 201);
    }

    public function showViolation(Violation $violation)
    {
        return response()->json($violation);
    }

    public function updateViolation(Request $request, Violation $violation)
    {
        $validated = $request->validate([
            'code' => 'required|unique:violations,code,' . $violation->id,
            'name' => 'required',
            'description' => 'nullable',
            'section' => 'required|in:Warning,Suspension,Exclusion,Expulsion',
        ]);

        $violation->update($validated);
        return response()->json($violation);
    }

    public function destroyViolation(Violation $violation)
    {
        $violation->delete();
        return response()->json(null, 204);
    }

    // Disciplinary Rules endpoints
    public function indexRules()
    {
        return response()->json(DisciplinaryRule::active()->get());
    }

    public function storeRule(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required',
            'description' => 'nullable',
            'trigger_section' => 'required|in:Warning,Suspension,Exclusion,Expulsion',
            'conditions' => 'required|array',
            'result_action' => 'required|in:Warning,Suspension,Exclusion,Expulsion',
            'priority' => 'integer|default:0',
            'is_active' => 'boolean',
        ]);

        $rule = DisciplinaryRule::create($validated);
        return response()->json($rule, 201);
    }

    public function showRule(DisciplinaryRule $rule)
    {
        return response()->json($rule);
    }

    public function updateRule(Request $request, DisciplinaryRule $rule)
    {
        $validated = $request->validate([
            'name' => 'required',
            'description' => 'nullable',
            'trigger_section' => 'required|in:Warning,Suspension,Exclusion,Expulsion',
            'conditions' => 'required|array',
            'result_action' => 'required|in:Warning,Suspension,Exclusion,Expulsion',
            'priority' => 'integer',
            'is_active' => 'boolean',
        ]);

        $rule->update($validated);
        return response()->json($rule);
    }

    public function destroyRule(DisciplinaryRule $rule)
    {
        $rule->delete();
        return response()->json(null, 204);
    }

    // Disciplinary Actions endpoints
    public function indexActions()
    {
        return response()->json(DisciplinaryAction::with(['incident', 'student', 'reviewer'])->get());
    }

    public function showAction(DisciplinaryAction $action)
    {
        return response()->json($action->load(['incident', 'student', 'reviewer']));
    }

    public function reviewAction(Request $request, DisciplinaryAction $action)
    {
        $validated = $request->validate([
            'status' => 'required|in:Approved,Modified,Overridden',
            'final_action' => 'nullable|in:Warning,Suspension,Exclusion,Expulsion',
            'final_action_reason' => 'nullable',
            'remarks' => 'nullable',
        ]);

        $user = auth()->user(); // Get the admin/program head reviewing

        $updatedAction = $this->disciplinaryService->reviewDisciplinaryAction(
            $action,
            $validated['status'],
            $validated['final_action'] ?? null,
            $validated['final_action_reason'] ?? null,
            $validated['remarks'] ?? null,
            $user->id
        );

        return response()->json($updatedAction);
    }
}
