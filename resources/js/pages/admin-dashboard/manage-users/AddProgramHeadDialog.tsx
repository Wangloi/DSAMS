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
import { GraduationCap, KeyRound, Mail, User } from 'lucide-react';
import type React from 'react';
import type { UserForm, UserRow } from './types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingUser: UserRow | null;
    hasAnyError: boolean;
    errors: Record<string, string>;
    form: UserForm;
    setForm: React.Dispatch<React.SetStateAction<UserForm>>;
    onClose: () => void;
    onSubmit: () => void;
};

export default function AddProgramHeadDialog({
    open,
    onOpenChange,
    editingUser,
    hasAnyError,
    errors,
    form,
    setForm,
    onClose,
    onSubmit,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-w-4xl dark:bg-slate-900 [&>button]:hidden">
                {/* Hero Gradient Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 py-6 text-white shadow-md">
                    <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <DialogHeader className="p-0 text-left">
                                <DialogTitle className="text-xl font-black tracking-tight text-white">
                                    {editingUser
                                        ? 'Edit Program Head User'
                                        : 'Add Program Head Account'}
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs font-medium text-blue-100/80">
                                    {editingUser
                                        ? 'Update program head credentials and assigned details.'
                                        : 'Fill out the form below to register a new program head in the system.'}
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                    </div>
                </div>

                {/* Dialog Form Scroll Area */}
                <div className="scrollbar-thin max-h-[72vh] space-y-6 overflow-y-auto px-6 py-6">
                    {hasAnyError && (
                        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-700 shadow-sm dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                                !
                            </span>
                            Please review and fix the highlighted fields below.
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Main Input Form Column */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-12">
                            {/* Full Name */}
                            <div className="grid gap-1.5 sm:col-span-2">
                                <Label
                                    htmlFor="ph_name"
                                    className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                >
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="ph_name"
                                        placeholder="e.g. Dr. Maria Santos"
                                        value={String(form.name ?? '')}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                name: e.target.value,
                                            }))
                                        }
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-800"
                                    />
                                </div>
                                <InputError message={(errors as any).name} />
                            </div>

                            {/* Email Address */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="ph_email"
                                    className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                >
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="ph_email"
                                        type="email"
                                        placeholder="e.g. msantos@srcb.edu.ph"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                email: e.target.value,
                                            }))
                                        }
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-800"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            {/* Assigned Program */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="ph_program"
                                    className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                >
                                    Assigned Program
                                </Label>
                                <Select
                                    value={form.program}
                                    onValueChange={(value) =>
                                        setForm((p) => ({
                                            ...p,
                                            program: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger
                                        id="ph_program"
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium dark:border-slate-700 dark:bg-slate-800/50"
                                    >
                                        <SelectValue placeholder="Select program" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="BSIT">
                                            BSIT
                                        </SelectItem>
                                        <SelectItem value="BSBA">
                                            BSBA
                                        </SelectItem>
                                        <SelectItem value="BEED">
                                            BEED
                                        </SelectItem>
                                        <SelectItem value="BSED">
                                            BSED
                                        </SelectItem>
                                        <SelectItem value="BSCrim">
                                            BSCrim
                                        </SelectItem>
                                        <SelectItem value="BSHM">
                                            BSHM
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={(errors as any).program} />
                            </div>

                            {/* Password */}
                            <div className="grid gap-1.5 sm:col-span-2">
                                <Label
                                    htmlFor="ph_password"
                                    className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                >
                                    Password
                                </Label>
                                <div className="relative">
                                    <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="ph_password"
                                        type="password"
                                        placeholder={
                                            editingUser
                                                ? 'Leave blank to keep current password'
                                                : 'Enter account password (min 8 characters)'
                                        }
                                        value={form.password}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                password: e.target.value,
                                            }))
                                        }
                                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-800"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dialog Footer Actions */}
                <DialogFooter className="flex items-center justify-end gap-3 border-t border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="rounded-xl bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
                        onClick={onSubmit}
                    >
                        {editingUser ? 'Update Account' : 'Create User Account'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
