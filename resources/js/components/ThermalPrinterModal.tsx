import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Printer,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Bluetooth,
    Radio,
    FileText,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    thermalPrinterClient,
    type DetectedPort,
    type PrinterHealth,
} from '@/services/thermalPrinterClient';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ThermalPrinterModal({ open, onOpenChange }: Props) {
    const [health, setHealth] = useState<PrinterHealth | null>(null);
    const [ports, setPorts] = useState<DetectedPort[]>([]);
    const [selectedPort, setSelectedPort] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);

    const refreshStatus = async () => {
        setLoading(true);
        try {
            const h = await thermalPrinterClient.checkHealth();
            setHealth(h);
            if (h.port && h.port !== 'NONE') {
                setSelectedPort(h.port);
            }

            const p = await thermalPrinterClient.getPrinters();
            setPorts(p.availablePorts || []);
            if (p.currentPort && !selectedPort) {
                setSelectedPort(p.currentPort);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            refreshStatus();
        }
    }, [open]);

    const handleSavePort = async () => {
        if (!selectedPort) {
            Swal.fire('No Port Selected', 'Please select a COM port for your PT-210 printer.', 'warning');
            return;
        }

        setSaving(true);
        try {
            const res = await thermalPrinterClient.setupPort(selectedPort);
            if (res.success) {
                Swal.fire({
                    title: 'Printer Configured!',
                    text: `PT-210 is now set to ${selectedPort} on this PC.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
                refreshStatus();
            } else {
                Swal.fire('Configuration Error', res.message, 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleTestPrint = async () => {
        setTesting(true);
        try {
            const res = await thermalPrinterClient.printTest();
            if (res.success) {
                Swal.fire({
                    title: 'Test Page Sent!',
                    text: 'The test slip is now printing on your GOOJPRT PT-210.',
                    icon: 'success',
                });
            } else {
                Swal.fire('Print Test Failed', res.message, 'error');
            }
        } finally {
            setTesting(false);
        }
    };

    const isOnline = health?.status === 'online' && health.configured;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md overflow-hidden rounded-3xl border-0 p-0 shadow-2xl dark:bg-slate-900">
                <div className="bg-gradient-to-br from-[#0b2d66] to-[#1e40af] p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md">
                            <Printer className="h-6 w-6 text-blue-200" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black tracking-tight text-white">
                                PT-210 Thermal Printer
                            </DialogTitle>
                            <DialogDescription className="text-xs text-blue-200/80">
                                58mm Bluetooth SPP Local Print Bridge
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 p-6">
                    {/* Status Card */}
                    <div
                        className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                            isOnline
                                ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/20'
                                : 'border-rose-200 bg-rose-50/60 dark:border-rose-800/40 dark:bg-rose-950/20'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    isOnline
                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                        : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                                }`}
                            >
                                {isOnline ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <XCircle className="h-5 w-5" />
                                )}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                    {isOnline
                                        ? `Connected on ${health?.port}`
                                        : 'Printer Bridge Offline / Not Detected'}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {isOnline
                                        ? 'GOOJPRT PT-210 Ready (9600 Baud)'
                                        : health?.message || 'Bridge not running at 127.0.0.1:9101'}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={refreshStatus}
                            disabled={loading}
                            className="h-8 w-8 text-slate-500 hover:bg-slate-200/50"
                            title="Refresh status"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {/* COM Port Selection */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            Select Bluetooth Serial Port (This PC)
                        </label>

                        {ports.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                                No serial ports found. Make sure PT-210 is paired in Windows Settings.
                            </div>
                        ) : (
                            <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                                {ports.map((p) => {
                                    const isSelected = selectedPort === p.portName;
                                    return (
                                        <button
                                            key={p.portName}
                                            type="button"
                                            onClick={() => setSelectedPort(p.portName)}
                                            className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100'
                                                    : 'border-slate-200/80 bg-slate-50/50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Bluetooth className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <div>
                                                    <span className="font-bold">{p.portName}</span>
                                                    <span className="ml-2 text-[10px] text-slate-400">
                                                        {p.description}
                                                    </span>
                                                </div>
                                            </div>
                                            {p.isLikelyPT210 && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                    PT-210
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Quick Bridge Setup Guide Alert */}
                    {!isOnline && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-200">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                                <div>
                                    <div className="font-bold">First-Time Setup:</div>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                                        Run <strong>start-bridge.bat</strong> located in your DSAMS <code>tools/PT210PrintBridge</code> folder to activate local Bluetooth printing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestPrint}
                        disabled={testing || !selectedPort}
                        className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                    >
                        {testing ? 'Printing...' : 'Print Test Slip'}
                    </Button>

                    <Button
                        type="button"
                        onClick={handleSavePort}
                        disabled={saving || !selectedPort}
                        className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95"
                    >
                        {saving ? 'Saving...' : 'Set Active Port'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
