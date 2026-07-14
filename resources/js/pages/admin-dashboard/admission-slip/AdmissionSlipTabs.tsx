import type { Dispatch, SetStateAction } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Props = {
    activeTab: 'pending' | 'approved' | 'rejected';
    setActiveTab: Dispatch<SetStateAction<'pending' | 'approved' | 'rejected'>>;
    setPageIndex: Dispatch<SetStateAction<number>>;
};

export default function AdmissionSlipTabs({ activeTab, setActiveTab, setPageIndex }: Props) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <Select
                value={activeTab}
                onValueChange={(v) => {
                    setActiveTab(v as 'pending' | 'approved' | 'rejected');
                    setPageIndex(1);
                }}
            >
                <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
