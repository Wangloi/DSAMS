import { router } from '@inertiajs/react';
import { Users } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BulkRow = {
    student_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    course: string;
    year_level: string;
    role: string;
    password: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const defaultHeader = ['student_id', 'first_name', 'middle_name', 'last_name', 'email', 'course', 'year_level', 'role', 'password'];

function splitCsvLine(line: string) {
    return line
        .split(',')
        .map((v) => v.trim())
        .map((v) => (v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v));
}

export default function BulkAddUsersDialog({ open, onOpenChange }: Props) {
    const [raw, setRaw] = useState('');
    const [defaultPassword, setDefaultPassword] = useState('');

    const parsed = useMemo(() => {
        const lines = raw
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);

        if (lines.length === 0) return { rows: [] as BulkRow[], error: '' };

        const first = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
        const hasHeader = defaultHeader.every((h) => first.includes(h));
        const header = hasHeader ? first : defaultHeader;
        const startIndex = hasHeader ? 1 : 0;

        const rows: BulkRow[] = [];

        for (let i = startIndex; i < lines.length; i += 1) {
            const cols = splitCsvLine(lines[i]);
            const obj: any = {};
            for (let c = 0; c < header.length; c += 1) {
                obj[header[c]] = cols[c] ?? '';
            }

            const password = String(obj.password ?? '').trim() || defaultPassword.trim();

            rows.push({
                student_id: String(obj.student_id ?? '').trim(),
                first_name: String(obj.first_name ?? '').trim(),
                middle_name: String(obj.middle_name ?? '').trim(),
                last_name: String(obj.last_name ?? '').trim(),
                email: String(obj.email ?? '').trim(),
                course: String(obj.course ?? '').trim(),
                year_level: String(obj.year_level ?? '').trim(),
                role: String(obj.role ?? 'Student').trim() || 'Student',
                password,
            });
        }

        return { rows, error: '' };
    }, [raw, defaultPassword]);

    const close = () => {
        onOpenChange(false);
        setRaw('');
        setDefaultPassword('');
    };

    const submit = () => {
        if (parsed.rows.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'No rows to import',
                text: 'Paste CSV rows first.',
            });
            return;
        }

        router.post(
            '/admin/manage-users/bulk',
            { rows: parsed.rows },
            {
                preserveScroll: true,
                onSuccess: () => {
                    close();
                },
                onError: () => {
                    onOpenChange(true);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Button className="bg-white/15 text-white hover:bg-white/25" type="button" onClick={() => onOpenChange(true)}>
                <Users className="mr-2 h-4 w-4" />
                Bulk Add
            </Button>

            <DialogContent className="sm:max-w-3xl overflow-hidden p-0 bg-white dark:bg-slate-800">
                <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Bulk Add Users</DialogTitle>
                        <DialogDescription className="text-white/80">
                            Paste CSV with columns: student_id, first_name, middle_name, last_name, email, course, year_level, role, password.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="space-y-4 px-6 py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="default_password" className="text-slate-700 dark:text-slate-300">Default Password (optional)</Label>
                        <Input
                            id="default_password"
                            type="password"
                            value={defaultPassword}
                            onChange={(e) => setDefaultPassword(e.target.value)}
                            placeholder="Used if password column is blank"
                            className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bulk_csv" className="text-slate-700 dark:text-slate-300">CSV Rows</Label>
                        <textarea
                            id="bulk_csv"
                            className="min-h-[240px] w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 text-sm text-slate-900 dark:text-white"
                            value={raw}
                            onChange={(e) => setRaw(e.target.value)}
                            placeholder={
                                'student_id,first_name,middle_name,last_name,email,course,year_level,role,password\n' +
                                '230001,Juan,,Dela Cruz,juan@srcb.edu.ph,BSIT,1st year,Student,password123\n'
                            }
                        />
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Parsed rows: {parsed.rows.length}</div>
                    </div>
                </div>

                <DialogFooter className="px-6 pb-6 border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
                    <Button type="button" variant="outline" onClick={close} className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                        Cancel
                    </Button>
                    <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={submit}>
                        Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
