import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import type React from 'react';
import type { StudentInfo } from './types';

type Props = {
    studentDraft: string;
    onStudentDraftChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
    loadingStudents: boolean;
    isViewMode: boolean;
    showSuggestions: boolean;
    suggestions: StudentInfo[];
    selectedSuggestionIndex: number;
    setSelectedSuggestionIndex: (index: number) => void;
    setShowSuggestions: (show: boolean) => void;
    addStudent: (student: StudentInfo) => void;
    studentsInvolved: StudentInfo[];
    removeStudent: (studentId: string) => void;
};

export default function IncidentReportDialogStudents({
    studentDraft,
    onStudentDraftChange,
    onKeyDown,
    onFocus,
    loadingStudents,
    isViewMode,
    showSuggestions,
    suggestions,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex,
    setShowSuggestions,
    addStudent,
    studentsInvolved,
    removeStudent,
}: Props) {
    return (
        <div className="grid gap-2">
            <Label
                htmlFor="students"
                className="text-slate-700 dark:text-slate-300"
            >
                Students Involved <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
                <Input
                    id="students"
                    placeholder={
                        loadingStudents
                            ? 'Loading students...'
                            : 'Enter student ID or name...'
                    }
                    value={studentDraft}
                    onChange={(e) => onStudentDraftChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                    disabled={isViewMode}
                    className="border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />

                {showSuggestions &&
                suggestions.length > 0 &&
                !loadingStudents &&
                !isViewMode ? (
                    <div
                        className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-700"
                        onMouseLeave={() => setShowSuggestions(false)}
                    >
                        {suggestions.map((student, index) => (
                            <div
                                key={student.id}
                                className={`cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 ${
                                    index === selectedSuggestionIndex
                                        ? 'bg-slate-100 dark:bg-slate-600'
                                        : ''
                                }`}
                                onClick={() => addStudent(student)}
                                onMouseEnter={() =>
                                    setSelectedSuggestionIndex(index)
                                }
                            >
                                <div className="font-medium text-slate-900 dark:text-white">
                                    {student.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    ID: {student.id}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            {studentsInvolved.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {studentsInvolved.map((student) => (
                        <Badge
                            key={student.id}
                            variant="secondary"
                            className="gap-1 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                        >
                            {student.name} ({student.id})
                            <button
                                type="button"
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                onClick={() => removeStudent(student.id)}
                                aria-label={`Remove ${student.name}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            ) : null}

            <div className="text-xs text-slate-500 dark:text-slate-400">
                Start typing a student ID or name to see suggestions. Use arrow
                keys to navigate, Enter to select.
            </div>
        </div>
    );
}
