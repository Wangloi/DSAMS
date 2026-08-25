import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { QrCode, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type QRScannerProps = {
    open: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
};

export default function QRScanner({ open, onClose, onScan }: QRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);
    const controlsRef = useRef<any>(null);

    useEffect(() => {
        if (open) {
            startScanning();
        } else {
            stopScanning();
        }

        return () => {
            stopScanning();
        };
    }, [open]);

    const startScanning = async () => {
        try {
            setError(null);
            setScanning(true);

            codeReader.current = new BrowserMultiFormatReader();

            const videoInputDevices =
                await BrowserMultiFormatReader.listVideoInputDevices();
            if (videoInputDevices.length === 0) {
                throw new Error('No camera devices found');
            }

            const selectedDeviceId = videoInputDevices[0].deviceId;

            if (videoRef.current) {
                controlsRef.current =
                    await codeReader.current.decodeFromVideoDevice(
                        selectedDeviceId,
                        videoRef.current,
                        (result, err) => {
                            if (result) {
                                onScan(result.getText());
                                stopScanning();
                                onClose();
                            }
                            if (err && !(err instanceof NotFoundException)) {
                                console.error(err);
                                setError('Error scanning QR code');
                            }
                        },
                    );
            }
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError('Failed to access camera. Please check permissions.');
            setScanning(false);
        }
    };

    const stopScanning = () => {
        setScanning(false);
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
        if (codeReader.current) {
            codeReader.current = null;
        }
    };

    const handleClose = () => {
        stopScanning();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Scan QR Code
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
                        <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            playsInline
                            muted
                        />
                        {scanning && (
                            <div className="absolute inset-0 border-2 border-blue-500">
                                <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 border-2 border-white" />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
