import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { adminEvaluationAutoGenerate } from '@/routes';
import {
    AlertCircle,
    FileText,
    Loader2,
    Sparkles,
    Upload,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import Swal from 'sweetalert2';
import type { EventOption, Question } from './types';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (
        data: { name: string; description: string; questions: Question[] },
        eventId: string,
    ) => void;
    events: EventOption[];
};

export default function AutoEvaluationUploadDialog({
    isOpen,
    onClose,
    onSuccess,
    events,
}: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [isDragActive, setIsDragActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        setError(null);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        const allowedExtensions = ['pdf', 'docx', 'xlsx', 'xls'];
        const extension = selectedFile.name.split('.').pop()?.toLowerCase();

        if (!extension || !allowedExtensions.includes(extension)) {
            setError(
                'Invalid file format. Please upload a PDF, DOCX, or Excel file.',
            );
            setFile(null);
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File is too large. Maximum size allowed is 10MB.');
            setFile(null);
            return;
        }

        setFile(selectedFile);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveFile = () => {
        setFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(adminEvaluationAutoGenerate(), {
                method: 'POST',
                headers: {
                    // Include Laravel CSRF token if available
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'Failed to auto-generate evaluation form.',
                );
            }

            Swal.fire({
                icon: 'success',
                title: 'Evaluation Extracted!',
                text: `Successfully parsed ${data.questions.length} questions. You can now review and customize them.`,
                timer: 3000,
                showConfirmButton: false,
            });

            onSuccess(data, selectedEventId);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(
                err.message ||
                    'An unexpected error occurred during processing.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg animate-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl duration-200 zoom-in-95 fade-in dark:border-slate-800 dark:bg-slate-900">
                {/* Modal Header */}
                <div className="relative border-b border-slate-200/80 bg-gradient-to-r from-blue-700/5 via-indigo-600/5 to-purple-600/5 px-6 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Auto Evaluation Generator
                            </h3>
                            <p className="text-xs text-slate-500">
                                Upload a DOCX, PDF, or Excel sheet to generate
                                form questions
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    {/* Error Alert */}
                    {error && (
                        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Event Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Associate with Completed Event
                        </label>
                        <Select
                            value={selectedEventId}
                            onValueChange={setSelectedEventId}
                        >
                            <SelectTrigger className="w-full border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                                <SelectValue placeholder="Select Event (Optional - can set later)" />
                            </SelectTrigger>
                            <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                                {events.map((event) => (
                                    <SelectItem
                                        key={event.id}
                                        value={event.id.toString()}
                                    >
                                        {event.name} ({event.date})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-slate-500">
                            Only completed events are eligible for evaluation
                            forms.
                        </p>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Upload Evaluation File
                        </label>
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                                isDragActive
                                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/10'
                                    : file
                                      ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5'
                                      : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-slate-600'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isLoading}
                            />

                            {file ? (
                                <div className="space-y-3">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="max-w-[280px]">
                                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {(
                                                file.size /
                                                (1024 * 1024)
                                            ).toFixed(2)}{' '}
                                            MB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        disabled={isLoading}
                                        className="dark:hover:text-rose-350 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                                    >
                                        Remove File
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="cursor-pointer space-y-3"
                                    onClick={handleUploadClick}
                                >
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Drag & drop your file here, or{' '}
                                            <span className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">
                                                browse
                                            </span>
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Supports PDF, Word (DOCX), or Excel
                                            (XLSX, XLS) up to 10MB
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200/80 pt-3 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="h-10 px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!file || isLoading}
                            className="h-10 gap-2 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Analyzing & Extracting...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Generate Form
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
