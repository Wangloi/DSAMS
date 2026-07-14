import { UserPlus } from 'lucide-react';
import QRCode from 'qrcode';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { UserForm, UserRow } from './types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingUser: UserRow | null;
    hasAnyError: boolean;
    errors: Record<string, string>;
    form: UserForm;
    setForm: React.Dispatch<React.SetStateAction<UserForm>>;
    onOpenCreate: () => void;
    onClose: () => void;
    onSubmit: (qrCodeDataUrl?: string | null) => void;
};

export default function AddEditUserDialog({
    open,
    onOpenChange,
    editingUser,
    hasAnyError,
    errors,
    form,
    setForm,
    onOpenCreate,
    onClose,
    onSubmit,
}: Props) {
    const isEditingProgramHead = String((editingUser as any)?.userType ?? '').toLowerCase() === 'program_head';
    const qrText = useMemo(() => form.student_id?.trim() ?? '', [form.student_id]);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!qrText || isEditingProgramHead) {
                setQrDataUrl(null);
                return;
            }

            try {
                const url = await QRCode.toDataURL(qrText, {
                    margin: 1,
                    width: 256,
                    errorCorrectionLevel: 'M',
                });
                if (!cancelled) setQrDataUrl(url);
            } catch {
                if (!cancelled) setQrDataUrl(null);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [qrText]);

    return (
        <>
            {/* This button should be OUTSIDE the Dialog - it's the trigger */}
            <Button className="bg-blue-600 text-white hover:bg-blue-700" type="button" onClick={onOpenCreate}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add New User
            </Button>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-3xl overflow-hidden p-0 bg-white dark:bg-slate-800">
                    <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                {editingUser ? (isEditingProgramHead ? 'Edit Program Head User' : 'Edit Student User') : 'Add Student User'}
                            </DialogTitle>
                            <DialogDescription className="text-white/80">
                                {editingUser
                                    ? isEditingProgramHead
                                        ? 'Update the program head details to edit the account.'
                                        : 'Update the student details to edit the account.'
                                    : 'Fill in the student details to create an account.'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-6">
                        {hasAnyError && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
                                Please fix the highlighted fields.
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            <div className={isEditingProgramHead ? 'grid gap-4 lg:col-span-12 sm:grid-cols-2' : 'grid gap-4 lg:col-span-8 sm:grid-cols-2'}>
                                {isEditingProgramHead ? (
                                    <>
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter Name"
                                                value={String(form.name ?? '')}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        name: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={(errors as any).name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="e.g. user@srcb.edu.ph"
                                                value={form.email}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        email: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="program" className="text-slate-700 dark:text-slate-300">Program</Label>
                                            <Input
                                                id="program"
                                                placeholder="e.g. BSIT"
                                                value={String(form.program ?? '')}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        program: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={(errors as any).program} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Leave blank to keep current password"
                                                value={form.password}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        password: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={errors.password} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="student_id" className="text-slate-700 dark:text-slate-300">Student ID</Label>
                                            <Input
                                                id="student_id"
                                                placeholder="e.g. 230123"
                                                value={form.student_id}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        student_id: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={errors.student_id} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="first_name" className="text-slate-700 dark:text-slate-300">First Name</Label>
                                            <Input
                                                id="first_name"
                                                placeholder="e.g. Juan"
                                                value={form.first_name}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        first_name: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={errors.first_name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="last_name" className="text-slate-700 dark:text-slate-300">Last Name</Label>
                                            <Input
                                                id="last_name"
                                                placeholder="e.g. Dela Cruz"
                                                value={form.last_name}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        last_name: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={errors.last_name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="e.g. user@srcb.edu.ph"
                                                value={form.email}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        email: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder={editingUser ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                                                value={form.password}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        password: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="course" className="text-slate-700 dark:text-slate-300">Course</Label>
                                            <Select
                                                value={form.course}
                                                onValueChange={(value) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        course: value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger id="course" className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                                                    <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BSIT">BSIT</SelectItem>
                                                    <SelectItem value="BSBA">BSBA</SelectItem>
                                                    <SelectItem value="BEED">BEED</SelectItem>
                                                    <SelectItem value="BSED">BSED</SelectItem>
                                                    <SelectItem value="BSCrim">BSCrim</SelectItem>
                                                    <SelectItem value="BSHM">BSHM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.course} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="year_level" className="text-slate-700 dark:text-slate-300">Year Level</Label>
                                            <Select
                                                value={form.year_level}
                                                onValueChange={(value) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        year_level: value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger id="year_level" className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                                                    <SelectValue placeholder="Select year level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1st year">1st year</SelectItem>
                                                    <SelectItem value="2nd year">2nd year</SelectItem>
                                                    <SelectItem value="3rd year">3rd year</SelectItem>
                                                    <SelectItem value="4th year">4th year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.year_level} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">Role</Label>
                                            <Input
                                                id="role"
                                                placeholder="Student"
                                                value={form.role}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        role: e.target.value,
                                                    }))
                                                }
                                                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                            />
                                            <InputError message={errors.role} />
                                        </div>
                                    </>
                                )}
                            </div>

                            {!isEditingProgramHead && (
                                <div className="lg:col-span-4">
                                    <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4">
                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">QR Code Preview</div>
                                        <div className="mt-3 flex items-center justify-center">
                                            {qrDataUrl ? (
                                                <div className="w-full max-w-[220px] rounded-md bg-white dark:bg-slate-800 p-2">
                                                    <img src={qrDataUrl} alt="Student ID QR" className="h-auto w-full" />
                                                </div>
                                            ) : (
                                                <div className="grid h-[220px] w-full place-items-center rounded-md border border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400">
                                                    Enter Student ID to generate QR
                                                </div>
                                            )}
                                        </div>
                                        {qrText ? (
                                            <div className="mt-3 rounded-md bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                                                ID: <span className="font-semibold text-slate-800 dark:text-white">{qrText}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-6 py-4">
                        <Button variant="secondary" type="button" onClick={onClose} className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-[#121F78] hover:bg-[#0f1a66]"
                            onClick={() => onSubmit(qrDataUrl)}
                        >
                            {editingUser ? 'Update' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}