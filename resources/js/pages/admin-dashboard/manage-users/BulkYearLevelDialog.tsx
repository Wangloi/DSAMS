import React, { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import Swal from 'sweetalert2';

interface BulkYearLevelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedUserIds: number[];
    onSuccess: () => void;
}

export function BulkYearLevelDialog({
    open,
    onOpenChange,
    selectedUserIds,
    onSuccess,
}: BulkYearLevelDialogProps) {
    const [targetYearLevel, setTargetYearLevel] = useState<string>('3rd Year');
    const [isUpdatingYearLevel, setIsUpdatingYearLevel] = useState(false);

    const handleUpdate = () => {
        if (selectedUserIds.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Users Selected',
                text: 'Please select at least one student.',
            });
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to update ${selectedUserIds.length} student(s) to "${targetYearLevel}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0B192C',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, update year level',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                setIsUpdatingYearLevel(true);
                router.post(
                    '/admin/manage-users/bulk/year-level',
                    {
                        ids: selectedUserIds,
                        year_level: targetYearLevel,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            onOpenChange(false);
                            setIsUpdatingYearLevel(false);
                            onSuccess();
                            Swal.fire({
                                icon: 'success',
                                title: 'Year Level Updated',
                                text: `Successfully updated student(s) to ${targetYearLevel}.`,
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                        onError: () => {
                            setIsUpdatingYearLevel(false);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to update year level. Please try again.',
                            });
                        },
                    },
                );
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <GraduationCap className="h-5 w-5 text-amber-600" />
                        Change Year Level
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Update the year level for{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                            {selectedUserIds.length}
                        </span>{' '}
                        selected student(s) (e.g., promote 2nd Year to 3rd Year).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Target Year Level
                        </Label>
                        <Select
                            value={targetYearLevel}
                            onValueChange={setTargetYearLevel}
                        >
                            <SelectTrigger className="w-full">
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
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="bg-[#1e3a8a] text-white hover:bg-blue-900"
                        disabled={isUpdatingYearLevel}
                        onClick={handleUpdate}
                    >
                        {isUpdatingYearLevel
                            ? 'Updating...'
                            : 'Update Year Level'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
