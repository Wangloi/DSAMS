import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { Download, FileSpreadsheet, Upload, Users } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type ParsedRow = {
    student_id: string;
    first_name: string;
    last_name: string;
    year_level: string;
    course: string;
    program: string;
};

function splitCsvLine(line: string) {
    return line
        .split(',')
        .map((v) => v.trim())
        .map((v) =>
            v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v,
        );
}

export default function BulkAddUsersDialog({ open, onOpenChange }: Props) {
    const [mode, setMode] = useState<'file' | 'text'>('file');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [rawText, setRawText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Parsing raw CSV text for real-time preview
    const parsedTextRows = useMemo(() => {
        const lines = rawText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);

        if (lines.length === 0) return [];

        const firstLineCols = splitCsvLine(lines[0]);
        const lowerFirst = firstLineCols.map((h) => h.toLowerCase());

        const hasHeader =
            ['student id', 'firstname', 'lastname'].some((k) =>
                lowerFirst.includes(k),
            ) ||
            ['student_id', 'first_name', 'last_name'].some((k) =>
                lowerFirst.includes(k),
            );

        const startIndex = hasHeader ? 1 : 0;
        const rows: ParsedRow[] = [];

        for (let i = startIndex; i < lines.length; i += 1) {
            const cols = splitCsvLine(lines[i]);
            if (cols.every((c) => !c)) continue;

            const rawId = cols[0] ?? '';
            const formattedId = pregMatchId(rawId);

            rows.push({
                student_id: formattedId,
                first_name: cols[1] ?? '',
                last_name: cols[2] ?? '',
                year_level: cols[3] ?? '',
                course: cols[4] ?? '',
                program: cols[5] ?? '',
            });
        }

        return rows;
    }, [rawText]);

    function pregMatchId(idStr: string) {
        if (!idStr) return '';
        const clean = idStr.trim();
        if (/^ID-/i.test(clean)) {
            return 'ID-' + clean.replace(/^ID-/i, '');
        }
        return 'ID-' + clean;
    }

    const close = () => {
        onOpenChange(false);
        setSelectedFile(null);
        setRawText('');
        setIsSubmitting(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const submit = () => {
        if (mode === 'file') {
            if (!selectedFile) {
                Swal.fire({
                    icon: 'error',
                    title: 'No File Selected',
                    text: 'Please select a CSV or XLSX file to import.',
                });
                return;
            }

            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('file', selectedFile);

            router.post('/admin/manage-users/bulk-import', formData, {
                preserveScroll: true,
                onSuccess: () => {
                    close();
                },
                onError: (err) => {
                    setIsSubmitting(false);
                    const msg =
                        Object.values(err)[0] ||
                        'Import failed. Please check the file format.';
                    Swal.fire({
                        icon: 'error',
                        title: 'Import Error',
                        text: String(msg),
                    });
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        } else {
            if (parsedTextRows.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'No Data',
                    text: 'Please enter valid CSV text lines to import.',
                });
                return;
            }

            setIsSubmitting(true);
            router.post(
                '/admin/manage-users/bulk-import',
                { rows: parsedTextRows },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        close();
                    },
                    onError: (err) => {
                        setIsSubmitting(false);
                        const msg = Object.values(err)[0] || 'Import failed.';
                        Swal.fire({
                            icon: 'error',
                            title: 'Import Error',
                            text: String(msg),
                        });
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                    },
                },
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden border-slate-200 bg-white p-0 shadow-2xl sm:max-w-3xl dark:border-slate-700 dark:bg-slate-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                            <Users className="h-6 w-6 text-blue-200" />
                            Bulk Add Students
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-white/80">
                            Import multiple student records into the database
                            via CSV or Excel (.xlsx).
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="scrollbar-thin max-h-[52vh] space-y-6 overflow-y-auto px-6 py-6">
                    {/* Template Download Section */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-blue-900 dark:text-blue-200">
                                    <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Download Import Template
                                </h4>
                                <p className="mt-0.5 text-xs text-blue-700/80 dark:text-blue-300/70">
                                    Expected columns:{' '}
                                    <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px] dark:bg-blue-900/60">
                                        Student ID
                                    </code>
                                    ,{' '}
                                    <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px] dark:bg-blue-900/60">
                                        Firstname
                                    </code>
                                    ,{' '}
                                    <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px] dark:bg-blue-900/60">
                                        Lastname
                                    </code>
                                    ,{' '}
                                    <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px] dark:bg-blue-900/60">
                                        Grade/Year Level
                                    </code>
                                    ,{' '}
                                    <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px] dark:bg-blue-900/60">
                                        Section/Course
                                    </code>
                                    ,{' '}
                                    <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px] dark:bg-blue-900/60">
                                        Department
                                    </code>
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <a
                                    href="/admin/manage-users/bulk-template?format=csv"
                                    download="student_bulk_template.csv"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    CSV Template
                                </a>
                                <a
                                    href="/admin/manage-users/bulk-template?format=xlsx"
                                    download="student_bulk_template.xlsx"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    XLSX Template
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Mode selector */}
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setMode('file')}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                                mode === 'file'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Upload className="h-4 w-4" />
                            File Upload (.xlsx / .csv)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('text')}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                                mode === 'text'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                        >
                            Paste CSV Text
                        </button>
                    </div>

                    {/* File Upload Mode */}
                    {mode === 'file' && (
                        <div className="grid gap-3">
                            <Label
                                htmlFor="bulk_file_upload"
                                className="text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Choose File (.csv, .xlsx, .xls)
                            </Label>
                            <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center transition-colors hover:border-blue-500 dark:border-slate-600 dark:bg-slate-900/30">
                                <input
                                    id="bulk_file_upload"
                                    type="file"
                                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    {selectedFile ? (
                                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                            Selected: {selectedFile.name} (
                                            {(selectedFile.size / 1024).toFixed(
                                                1,
                                            )}{' '}
                                            KB)
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Click or drag and drop your file
                                                here
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Supports CSV and Excel files up
                                                to 10MB
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paste CSV Text Mode */}
                    {mode === 'text' && (
                        <div className="grid gap-3">
                            <Label
                                htmlFor="bulk_csv_textarea"
                                className="text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Paste CSV Text Lines
                            </Label>
                            <textarea
                                id="bulk_csv_textarea"
                                className="min-h-[180px] w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder={
                                    'Student ID,Firstname,Lastname,Grade/Year Level,Section/Course,Department\n' +
                                    'C230103,Vincent Jay,Abelidas,4th Year,BSBA,HED\n' +
                                    'ID-C230104,Maria,Santos,1st Year,BSIT,HED\n'
                                }
                            />
                            {parsedTextRows.length > 0 && (
                                <div className="overflow-hidden rounded-lg border border-slate-200 text-xs dark:border-slate-700">
                                    <div className="flex justify-between bg-slate-100 px-3 py-2 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <span>
                                            Parsed Records Preview (
                                            {parsedTextRows.length} rows)
                                        </span>
                                        <span className="text-[11px] font-normal text-slate-500">
                                            Student ID auto-prefix applied
                                        </span>
                                    </div>
                                    <div className="max-h-[140px] overflow-y-auto">
                                        <table className="w-full border-collapse text-left">
                                            <thead className="border-b bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60">
                                                <tr>
                                                    <th className="px-3 py-1.5">
                                                        Student ID
                                                    </th>
                                                    <th className="px-3 py-1.5">
                                                        First Name
                                                    </th>
                                                    <th className="px-3 py-1.5">
                                                        Last Name
                                                    </th>
                                                    <th className="px-3 py-1.5">
                                                        Year Level
                                                    </th>
                                                    <th className="px-3 py-1.5">
                                                        Course
                                                    </th>
                                                    <th className="px-3 py-1.5">
                                                        Department
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                {parsedTextRows
                                                    .slice(0, 5)
                                                    .map((r, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                                        >
                                                            <td className="px-3 py-1 font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                                {r.student_id}
                                                            </td>
                                                            <td className="px-3 py-1">
                                                                {r.first_name}
                                                            </td>
                                                            <td className="px-3 py-1">
                                                                {r.last_name}
                                                            </td>
                                                            <td className="px-3 py-1">
                                                                {r.year_level}
                                                            </td>
                                                            <td className="px-3 py-1">
                                                                {r.course}
                                                            </td>
                                                            <td className="px-3 py-1">
                                                                {r.program}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {parsedTextRows.length > 5 && (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="bg-slate-50/40 px-3 py-1 text-center text-slate-400 italic dark:bg-slate-800/30"
                                                        >
                                                            ...and{' '}
                                                            {parsedTextRows.length -
                                                                5}{' '}
                                                            more rows
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Information Note */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
                        <span className="font-bold">
                            Defaults applied on bulk add:
                        </span>
                        <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] opacity-90">
                            <li>
                                <span className="font-semibold">
                                    Student ID
                                </span>{' '}
                                format: Auto-prepended with{' '}
                                <code className="py-0.2 rounded bg-amber-100 px-1 font-mono dark:bg-amber-900/60">
                                    ID-
                                </code>{' '}
                                if missing.
                            </li>
                            <li>
                                <span className="font-semibold">Full Name</span>
                                : Automated as{' '}
                                <code className="py-0.2 rounded bg-amber-100 px-1 font-mono dark:bg-amber-900/60">
                                    Firstname Lastname
                                </code>{' '}
                                in database.
                            </li>
                            <li>
                                <span className="font-semibold">Defaults</span>:
                                Password:{' '}
                                <code className="font-mono">password123</code> |
                                Role: <code className="font-mono">Student</code>{' '}
                                | Status:{' '}
                                <code className="font-mono">Approved</code> |
                                Active: <code className="font-mono">1</code> |
                                Verification:{' '}
                                <code className="font-mono">Approved</code> |
                                Email: <code className="font-mono">null</code>
                            </li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={close}
                        disabled={isSubmitting}
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="min-w-[100px] bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={submit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Importing...' : 'Import Students'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
