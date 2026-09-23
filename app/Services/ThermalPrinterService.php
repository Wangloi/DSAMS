<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ThermalPrinterService
{
    protected string $bridgeUrl;

    public function __construct(?string $bridgeUrl = null)
    {
        $this->bridgeUrl = rtrim($bridgeUrl ?? config('services.thermal_printer.url', 'http://127.0.0.1:9101'), '/');
    }

    /**
     * Check health and status of the local PT210 print bridge.
     */
    public function checkHealth(): array
    {
        try {
            $response = Http::timeout(3)->get("{$this->bridgeUrl}/health");
            if ($response->successful()) {
                return $response->json();
            }
            return [
                'status' => 'offline',
                'configured' => false,
                'message' => 'Print bridge returned HTTP ' . $response->status(),
            ];
        } catch (\Exception $e) {
            Log::debug('Thermal print bridge health check failed: ' . $e->getMessage());
            return [
                'status' => 'offline',
                'configured' => false,
                'message' => 'PT-210 Print Bridge is not running at ' . $this->bridgeUrl,
            ];
        }
    }

    /**
     * Get available and detected serial ports.
     */
    public function getPrinters(): array
    {
        try {
            $response = Http::timeout(4)->get("{$this->bridgeUrl}/printers");
            return $response->successful() ? $response->json() : ['availablePorts' => []];
        } catch (\Exception $e) {
            return ['availablePorts' => [], 'error' => $e->getMessage()];
        }
    }

    /**
     * Configure the active COM port on the local bridge.
     */
    public function configurePrinter(string $port, ?string $printerName = 'PT210_AE81', int $baudRate = 9600): array
    {
        try {
            $response = Http::timeout(4)->post("{$this->bridgeUrl}/setup/printer", [
                'port' => $port,
                'printerName' => $printerName,
                'baudRate' => $baudRate,
            ]);
            return $response->json();
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Trigger a test receipt print.
     */
    public function printTest(): array
    {
        try {
            $response = Http::timeout(6)->post("{$this->bridgeUrl}/print-test");
            return $response->json();
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'Failed to connect') || str_contains($msg, 'cURL error 7') || str_contains($msg, 'port 9101')) {
                return [
                    'success' => false,
                    'message' => 'PT-210 Print Bridge is not running on your computer. Please start "start-bridge.bat" in tools/PT210PrintBridge, or use Browser/PDF Print.',
                ];
            }
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Send admission slip print request to local bridge.
     */
    public function printAdmissionSlip(array $data): array
    {
        try {
            $response = Http::timeout(8)->post("{$this->bridgeUrl}/print/admission-slip", [
                'studentName' => $data['student_name'] ?? $data['studentName'] ?? '',
                'studentId' => $data['student_id'] ?? $data['studentId'] ?? '',
                'program' => $data['program'] ?? $data['program_year_level'] ?? $data['programYear'] ?? '',
                'caseText' => $data['case_text'] ?? $data['caseText'] ?? '',
                'reasonText' => $data['reason_text'] ?? $data['reasonText'] ?? '',
                'date' => $data['date'] ?? $data['date_issued'] ?? $data['dateIssued'] ?? date('Y-m-d'),
                'validUntil' => $data['valid_until'] ?? $data['validUntil'] ?? '',
                'status' => $data['status'] ?? 'APPROVED',
                'deanName' => $data['dean_name'] ?? $data['deanName'] ?? 'Rey John N. Bongcas',
                'slipId' => (string) ($data['id'] ?? $data['slip_id'] ?? $data['slipId'] ?? ''),
            ]);

            return $response->json();
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'Failed to connect') || str_contains($msg, 'cURL error 7') || str_contains($msg, 'port 9101')) {
                return [
                    'success' => false,
                    'message' => 'PT-210 Print Bridge is not running on your computer. Please launch "start-bridge.bat" in tools/PT210PrintBridge, or use "Browser / PDF Print" instead.',
                ];
            }
            return [
                'success' => false,
                'message' => 'Thermal print error: ' . $msg,
            ];
        }
    }
}
