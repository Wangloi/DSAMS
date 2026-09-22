<?php

namespace App\Http\Controllers;

use App\Models\AdmissionSlip;
use App\Services\ThermalPrinterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThermalPrintController extends Controller
{
    public function __construct(protected ThermalPrinterService $printerService)
    {
    }

    /**
     * Check health of thermal printer bridge.
     */
    public function health(): JsonResponse
    {
        return response()->json($this->printerService->checkHealth());
    }

    /**
     * Get detected serial ports.
     */
    public function printers(): JsonResponse
    {
        return response()->json($this->printerService->getPrinters());
    }

    /**
     * Configure printer port on the bridge.
     */
    public function setup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'port' => 'required|string',
            'printerName' => 'nullable|string',
            'baudRate' => 'nullable|integer',
        ]);

        $res = $this->printerService->configurePrinter(
            $validated['port'],
            $validated['printerName'] ?? 'PT210_AE81',
            $validated['baudRate'] ?? 9600
        );

        return response()->json($res);
    }

    /**
     * Print test receipt.
     */
    public function printTest(): JsonResponse
    {
        $res = $this->printerService->printTest();
        return response()->json($res, ($res['success'] ?? false) ? 200 : 400);
    }

    /**
     * Print specific admission slip by ID.
     */
    public function printAdmissionSlip(Request $request, AdmissionSlip $admissionSlip): JsonResponse
    {
        $deanName = $request->input('dean_name', 'Rey John N. Bongcas');

        $payload = [
            'id' => $admissionSlip->id,
            'student_name' => $admissionSlip->student_name,
            'student_id' => $admissionSlip->student_id ?? '',
            'program' => $admissionSlip->program_year_level,
            'case_text' => $admissionSlip->case_text,
            'reason_text' => $admissionSlip->reason_text,
            'date_issued' => $admissionSlip->date_issued,
            'valid_until' => $admissionSlip->valid_until,
            'status' => $admissionSlip->status,
            'dean_name' => $deanName,
        ];

        // Also approve if not already approved
        if ($admissionSlip->status !== 'APPROVED') {
            $admissionSlip->update(['status' => 'APPROVED']);
        }

        $res = $this->printerService->printAdmissionSlip($payload);
        return response()->json($res, ($res['success'] ?? false) ? 200 : 400);
    }
}
