import { ClipboardList, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    onCreateNew: () => void;
};

export default function AdmissionSlipHeader({ onCreateNew }: Props) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                    <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Admission Slip
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage and track student admission slip records
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    type="button"
                    className="h-11 shrink-0 gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700"
                    onClick={onCreateNew}
                >
                    <PlusCircle className="h-5 w-5" />
                    Create Admission Slip
                </Button>
            </div>
        </div>
    );
}
