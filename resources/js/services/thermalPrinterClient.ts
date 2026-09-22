export interface PrinterHealth {
    status: 'online' | 'offline';
    printer: string;
    configured: boolean;
    port: string;
    baudRate?: number;
    autoDetected?: boolean;
    message?: string;
}

export interface DetectedPort {
    portName: string;
    description: string;
    deviceId: string;
    isBluetooth: boolean;
    isLikelyPT210: boolean;
}

export interface PrinterDiscoveryResponse {
    currentPort: string;
    printerName: string;
    availablePorts: DetectedPort[];
}

export interface AdmissionSlipPrintData {
    studentName: string;
    studentId?: string;
    program?: string;
    caseText?: string;
    reasonText?: string;
    date?: string;
    validUntil?: string;
    status?: string;
    deanName?: string;
    slipId?: string | number;
}

const LOCAL_BRIDGE_URL = 'http://127.0.0.1:9101';

async function safeJson(res: Response): Promise<any> {
    const text = await res.text();
    if (!text || !text.trim()) return {};
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

/**
 * Direct Client-Side thermal printer service.
 * Allows the browser on the user's local PC to communicate directly with PT210PrintBridge,
 * even if DSAMS is hosted on a remote cloud server.
 */
export const thermalPrinterClient = {
    /**
     * Check if local PT-210 Print Bridge is running on this PC.
     */
    async checkHealth(): Promise<PrinterHealth> {
        try {
            const res = await fetch(`${LOCAL_BRIDGE_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });
            if (res.ok) {
                return await safeJson(res);
            }
            return {
                status: 'offline',
                printer: 'GOOJPRT PT-210',
                configured: false,
                port: 'NONE',
                message: `Bridge returned status ${res.status}`,
            };
        } catch {
            // Fallback: try via Laravel proxy
            try {
                const proxyRes = await fetch('/thermal-printer/health', {
                    headers: { Accept: 'application/json' },
                    signal: AbortSignal.timeout(2500),
                });
                if (proxyRes.ok) {
                    return await safeJson(proxyRes);
                }
            } catch {
                // Bridge completely offline
            }

            return {
                status: 'offline',
                printer: 'GOOJPRT PT-210',
                configured: false,
                port: 'NONE',
                message: 'Local PT-210 Print Bridge is not running on this PC.',
            };
        }
    },

    /**
     * Enumerate available COM ports from local bridge.
     */
    async getPrinters(): Promise<PrinterDiscoveryResponse> {
        try {
            const res = await fetch(`${LOCAL_BRIDGE_URL}/printers`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000),
            });
            if (res.ok) {
                return await safeJson(res);
            }
        } catch {
            try {
                const proxyRes = await fetch('/thermal-printer/printers', {
                    headers: { Accept: 'application/json' },
                });
                if (proxyRes.ok) {
                    return await safeJson(proxyRes);
                }
            } catch {
                // fallback below
            }
        }

        return { currentPort: '', printerName: 'PT210_AE81', availablePorts: [] };
    },

    /**
     * Configure the active COM port for this PC.
     */
    async setupPort(port: string, printerName = 'PT210_AE81'): Promise<{ success: boolean; message: string }> {
        try {
            const res = await fetch(`${LOCAL_BRIDGE_URL}/setup/printer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ port, printerName, baudRate: 9600 }),
            });
            const data = await safeJson(res);
            return {
                success: res.ok,
                message: data.message || (res.ok ? 'Port saved.' : data.error || 'Failed to save port.'),
            };
        } catch (err: any) {
            return { success: false, message: err.message || 'Cannot reach local print bridge.' };
        }
    },

    /**
     * Send test print to the local PT-210 printer.
     */
    async printTest(): Promise<{ success: boolean; message: string }> {
        try {
            const res = await fetch(`${LOCAL_BRIDGE_URL}/print-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(8000),
            });
            const data = await safeJson(res);
            return {
                success: data.success ?? res.ok,
                message: data.message || (res.ok ? 'Test page sent to printer.' : 'Print failed.'),
            };
        } catch (err: any) {
            return {
                success: false,
                message: err.message || 'Could not connect to local PT-210 printer bridge.',
            };
        }
    },

    /**
     * Print Admission Slip on the 58mm Bluetooth Thermal Printer.
     */
    async printAdmissionSlip(data: AdmissionSlipPrintData): Promise<{ success: boolean; message: string }> {
        try {
            const res = await fetch(`${LOCAL_BRIDGE_URL}/print/admission-slip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_name: data.studentName,
                    student_id: data.studentId || '',
                    program_year_level: data.program || '',
                    case_text: data.caseText || '',
                    reason_text: data.reasonText || '',
                    date_issued: data.date || '',
                    valid_until: data.validUntil || '',
                    status: data.status || 'APPROVED',
                    dean_name: data.deanName || 'Rey John N. Bongcas',
                    slip_id: data.slipId ? String(data.slipId) : '',
                }),
                signal: AbortSignal.timeout(10000),
            });

            const resJson = await safeJson(res);
            return {
                success: resJson.success ?? res.ok,
                message: resJson.message || (res.ok ? 'Admission slip printed.' : 'Print error.'),
            };
        } catch (err: any) {
            // Proxy fallback via Laravel
            if (data.slipId) {
                try {
                    const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
                    const proxyRes = await fetch(`/thermal-printer/print-slip/${data.slipId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': token,
                        },
                        body: JSON.stringify({
                            dean_name: data.deanName,
                        }),
                        signal: AbortSignal.timeout(10000),
                    });
                    const proxyJson = await safeJson(proxyRes);
                    return {
                        success: proxyJson.success ?? proxyRes.ok,
                        message: proxyJson.message || (proxyRes.ok ? 'Admission slip printed.' : 'Print error.'),
                    };
                } catch {
                    // Fallthrough
                }
            }

            return {
                success: false,
                message: err.message || 'PT-210 Bluetooth printer was not detected. Please make sure the printer is powered on and paired with Windows.',
            };
        }
    },
};
