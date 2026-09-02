import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { router } from '@inertiajs/react';
import {
    BookOpen,
    CheckCircle2,
    CheckSquare,
    FileText,
    GraduationCap,
    Layers,
    RotateCcw,
    Search,
    Shield,
    Square,
    UserCheck,
    Users,
    UserX,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';

export type BulkActionType =
    | 'year_level'
    | 'program'
    | 'entry_status'
    | 'reset_officer_role';

export interface UserItem {
    id: number | string;
    name: string;
    student_id?: string;
    email?: string;
    year_level?: string;
    course?: string;
    program?: string;
    entry_status?: string;
    role?: string;
    verification_status?: string;
    is_active?: boolean;
    status?: string;
}

interface BulkActionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: UserItem[];
    selectedUserIds: number[];
    setSelectedUserIds: React.Dispatch<React.SetStateAction<number[]>>;
    availablePrograms?: string[];
    onSuccess: () => void;
}

export default function BulkActionsModal({
    open,
    onOpenChange,
    users,
    selectedUserIds,
    setSelectedUserIds,
    availablePrograms = ['BSIT', 'BSBA', 'BEED', 'BSED', 'BSCrim', 'BSHM'],
    onSuccess,
}: BulkActionsModalProps) {
    const [actionType, setActionType] =
        useState<BulkActionType>('year_level');
    const [targetYearLevel, setTargetYearLevel] =
        useState<string>('3rd Year');
    const [targetProgram, setTargetProgram] =
        useState<string>(availablePrograms[0] ?? 'BSIT');
    const [targetEntryStatus, setTargetEntryStatus] =
        useState<string>('Freshman');
    const [searchQuery, setSearchQuery] = useState('');
    const [yearFilter, setYearFilter] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter users list inside modal (Students only)
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const userTypeRaw = String((u as any)?.userType ?? (u as any)?.user_type ?? '').toLowerCase();
            const roleRaw = String(u.role ?? '').toLowerCase();
            const isStudent =
                userTypeRaw !== 'program_head' &&
                userTypeRaw !== 'admin' &&
                !roleRaw.includes('admin') &&
                !roleRaw.includes('program');

            if (!isStudent) return false;

            const isOfficer =
                Boolean(u.role && u.role.trim() !== '' && u.role.toLowerCase() !== 'student') ||
                (Array.isArray((u as any).officer_features) && (u as any).officer_features.length > 0);

            const matchesFilter =
                yearFilter === 'all' ||
                (yearFilter === 'officers'
                    ? isOfficer
                    : u.year_level === yearFilter);

            const matchesSearch =
                !searchQuery ||
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.student_id &&
                    u.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (u.course &&
                    u.course.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (u.role &&
                    u.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (u.email &&
                    u.email.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesFilter && matchesSearch;
        });
    }, [users, searchQuery, yearFilter]);

    const isAllFilteredSelected =
        filteredUsers.length > 0 &&
        filteredUsers.every((u) => selectedUserIds.includes(Number(u.id)));

    const toggleSelectAllFiltered = () => {
        const filteredIds = filteredUsers.map((u) => Number(u.id));
        if (isAllFilteredSelected) {
            setSelectedUserIds((prev) =>
                prev.filter((id) => !filteredIds.includes(id)),
            );
        } else {
            setSelectedUserIds((prev) =>
                Array.from(new Set([...prev, ...filteredIds])),
            );
        }
    };

    const toggleUserSelect = (id: number) => {
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleApplyAction = () => {
        if (selectedUserIds.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Users Selected',
                text: 'Please select at least one user to perform bulk action.',
            });
            return;
        }

        setIsSubmitting(true);

        let endpoint = '/admin/manage-users/bulk/year-level';
        let payload: any = { ids: selectedUserIds };
        let successTitle = 'Bulk Action Completed';
        let successText = `Successfully updated ${selectedUserIds.length} student(s).`;

        if (actionType === 'year_level') {
            endpoint = '/admin/manage-users/bulk/year-level';
            payload.year_level = targetYearLevel;
            successTitle = 'Year Level Updated';
            successText = `Successfully updated ${selectedUserIds.length} student(s) to ${targetYearLevel}.`;
        } else if (actionType === 'program') {
            endpoint = '/admin/manage-users/bulk/program';
            payload.program = targetProgram;
            successTitle = 'Program/Course Updated';
            successText = `Successfully updated ${selectedUserIds.length} student(s) to ${targetProgram}.`;
        } else if (actionType === 'entry_status') {
            endpoint = '/admin/manage-users/bulk/entry-status';
            payload.entry_status = targetEntryStatus;
            successTitle = 'Entry Status Updated';
            successText = `Successfully updated ${selectedUserIds.length} student(s) to ${targetEntryStatus}.`;
        } else if (actionType === 'reset_officer_role') {
            endpoint = '/admin/manage-users/bulk/reset-officer-role';
            successTitle = 'Officer Roles Reset';
            successText = `Successfully reset officer role to Student for ${selectedUserIds.length} student(s).`;
        }

        router.post(endpoint, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                onOpenChange(false);
                onSuccess();

                Swal.fire({
                    icon: 'success',
                    title: successTitle,
                    text: successText,
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onError: (err) => {
                setIsSubmitting(false);
                console.error('Bulk action error:', err);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-w-4xl overflow-hidden p-0 gap-0 bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
                {/* Header with System Primary Navy Gradient Banner */}
                <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#1e3a8a] px-6 py-4 flex items-center justify-between text-white border-b border-slate-800/40">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 text-amber-400 shadow-inner">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                                Bulk User Actions Manager
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-300/90 font-normal">
                                Batch update student year levels, programs, entry status, or officer roles.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* 2-Column Main Area (Fits directly without vertical scrolling) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 bg-slate-50/50 dark:bg-[#0B192C]/80">
                    {/* LEFT COLUMN: User Selection List (Col Span 7) */}
                    <div className="md:col-span-7 flex flex-col space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                        {/* Title Bar & Counter */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-[#1E3E62] dark:text-blue-400" />
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                                    Target Students
                                </span>
                                <span className="rounded-full bg-[#0B192C] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm dark:bg-blue-900/60 dark:text-blue-200">
                                    {selectedUserIds.length} Selected
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs font-bold text-[#1E3E62] hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/60"
                                    onClick={toggleSelectAllFiltered}
                                >
                                    {isAllFilteredSelected ? (
                                        <>
                                            <Square className="mr-1 h-3.5 w-3.5" />
                                            Deselect All
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare className="mr-1 h-3.5 w-3.5" />
                                            Select All
                                        </>
                                    )}
                                </Button>

                                {selectedUserIds.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60"
                                        onClick={() => setSelectedUserIds([])}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Search & Filter Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="relative sm:col-span-2">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search name, ID, course..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 font-medium"
                                />
                            </div>
                            <Select value={yearFilter} onValueChange={setYearFilter}>
                                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 font-medium">
                                    <SelectValue placeholder="All Students" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Students</SelectItem>
                                    <SelectItem value="officers">Student Officers</SelectItem>
                                    <SelectItem value="1st Year">1st Year</SelectItem>
                                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                                    <SelectItem value="4th Year">4th Year</SelectItem>
                                    <SelectItem value="Irregular">Irregular</SelectItem>
                                    <SelectItem value="Graduated">Graduated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Internal User List Box (Fixed Height: 250px) */}
                        <div className="h-[250px] overflow-y-auto rounded-lg border border-slate-200/80 bg-slate-50/30 p-1.5 dark:border-slate-800 dark:bg-slate-950/50 space-y-1">
                            {filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-500 font-medium">
                                    No students match the current filter criteria.
                                </div>
                            ) : (
                                filteredUsers.map((u) => {
                                    const userId = Number(u.id);
                                    const isSelected = selectedUserIds.includes(userId);
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleUserSelect(userId)}
                                            className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                                                isSelected
                                                    ? 'bg-[#0B192C] text-white shadow-sm border-l-4 border-amber-400 font-semibold dark:bg-[#1E3E62]'
                                                    : 'hover:bg-white text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60 bg-white/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleUserSelect(userId)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={isSelected ? 'border-white data-[state=checked]:bg-amber-400 data-[state=checked]:text-[#0B192C]' : ''}
                                                />
                                                <div className="truncate">
                                                    <span className={isSelected ? 'text-white font-bold' : 'font-semibold text-slate-900 dark:text-slate-100'}>
                                                        {u.name}
                                                    </span>
                                                    {u.student_id && (
                                                        <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-mono ${
                                                            isSelected ? 'bg-white/10 text-slate-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                        }`}>
                                                            {u.student_id}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                                                {((u.role && u.role.toLowerCase() !== 'student') || (Array.isArray((u as any).officer_features) && (u as any).officer_features.length > 0)) && (
                                                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                                        isSelected ? 'bg-purple-400/20 text-purple-200 border border-purple-400/30' : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40'
                                                    }`}>
                                                        {u.role && u.role.toLowerCase() !== 'student' ? u.role : 'Officer'}
                                                    </span>
                                                )}
                                                {u.year_level && (
                                                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                                        isSelected ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                                                    }`}>
                                                        {u.year_level}
                                                    </span>
                                                )}
                                                {u.course && (
                                                    <span className={`hidden sm:inline text-[11px] truncate max-w-[70px] font-medium ${
                                                        isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                        {u.course}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Action Selector & Controls (Col Span 5) */}
                    <div className="md:col-span-5 flex flex-col justify-between space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="space-y-3.5">
                            {/* Action Type Dropdown */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                    Choose Bulk Action
                                </Label>
                                <Select
                                    value={actionType}
                                    onValueChange={(val) => setActionType(val as BulkActionType)}
                                >
                                    <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 font-semibold text-xs border-slate-200 dark:border-slate-700">
                                        <SelectValue placeholder="Select Bulk Action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="year_level">
                                            <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
                                                <GraduationCap className="h-4 w-4" />
                                                Change Year Level
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="program">
                                            <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
                                                <BookOpen className="h-4 w-4" />
                                                Change Program / Course
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="entry_status">
                                            <div className="flex items-center gap-2 font-semibold text-purple-600 dark:text-purple-400">
                                                <FileText className="h-4 w-4" />
                                                Change Entry Status
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="reset_officer_role">
                                            <div className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
                                                <RotateCcw className="h-4 w-4" />
                                                Reset Officer Role to Student
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dynamic Target Parameter Cards */}
                            {actionType === 'year_level' && (
                                <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-slate-900 space-y-2 shadow-sm">
                                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                                        <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <span>Target Year Level</span>
                                    </div>
                                    <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                                        All selected students will be updated to this year level.
                                    </p>
                                    <Select
                                        value={targetYearLevel}
                                        onValueChange={setTargetYearLevel}
                                    >
                                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-800 text-xs font-semibold shadow-sm">
                                            <SelectValue placeholder="Select Year Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1st Year">1st Year</SelectItem>
                                            <SelectItem value="2nd Year">2nd Year</SelectItem>
                                            <SelectItem value="3rd Year">3rd Year</SelectItem>
                                            <SelectItem value="4th Year">4th Year</SelectItem>
                                            <SelectItem value="Irregular">Irregular</SelectItem>
                                            <SelectItem value="Graduated">Graduated</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {actionType === 'program' && (
                                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 dark:border-blue-900/40 dark:from-blue-950/40 dark:to-slate-900 space-y-2 shadow-sm">
                                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-xs">
                                        <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span>Target Program / Course</span>
                                    </div>
                                    <p className="text-[11px] text-blue-700/90 dark:text-blue-400/90 leading-relaxed">
                                        All selected students will be transferred to this program.
                                    </p>
                                    <Select
                                        value={targetProgram}
                                        onValueChange={setTargetProgram}
                                    >
                                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-800 text-xs font-semibold shadow-sm">
                                            <SelectValue placeholder="Select Program" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePrograms.map((prog) => (
                                                <SelectItem key={prog} value={prog}>
                                                    {prog}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {actionType === 'entry_status' && (
                                <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50/50 p-4 dark:border-purple-900/40 dark:from-purple-950/40 dark:to-slate-900 space-y-2 shadow-sm">
                                    <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-xs">
                                        <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <span>Target Entry Status</span>
                                    </div>
                                    <p className="text-[11px] text-purple-700/90 dark:text-purple-400/90 leading-relaxed">
                                        All selected students will be updated to this entry classification.
                                    </p>
                                    <Select
                                        value={targetEntryStatus}
                                        onValueChange={setTargetEntryStatus}
                                    >
                                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-purple-300 dark:border-purple-800 text-xs font-semibold shadow-sm">
                                            <SelectValue placeholder="Select Entry Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Freshman">Freshman</SelectItem>
                                            <SelectItem value="Transferee">Transferee</SelectItem>
                                            <SelectItem value="Returnee">Returnee</SelectItem>
                                            <SelectItem value="Old Student">Old Student</SelectItem>
                                            <SelectItem value="Regular">Regular</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {actionType === 'reset_officer_role' && (
                                <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50/50 p-4 dark:border-rose-900/40 dark:from-rose-950/40 dark:to-slate-900 space-y-2 shadow-sm">
                                    <div className="flex items-center gap-2 text-rose-900 dark:text-rose-300 font-bold text-xs">
                                        <RotateCcw className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                        <span>Reset Role to Student</span>
                                    </div>
                                    <p className="text-[11px] text-rose-700/90 dark:text-rose-400/90 leading-relaxed">
                                        Selected students assigned to officer roles (President, Vice President, Secretary, Finance Officer, etc.) will be reset back to standard <strong>Student</strong> role and officer access privileges will be revoked.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons inside Right Panel - Always visible without scrolling! */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 text-xs font-semibold border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="flex-1 bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#1e3a8a] text-white hover:opacity-95 text-xs font-bold shadow-md shadow-blue-950/20"
                                disabled={isSubmitting || selectedUserIds.length === 0}
                                onClick={handleApplyAction}
                            >
                                {isSubmitting
                                    ? 'Applying...'
                                    : `Apply Action (${selectedUserIds.length})`}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
