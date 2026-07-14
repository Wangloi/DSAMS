import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = {
    title: string;
    isViewMode: boolean;
};

export default function IncidentReportDialogHeader({ title, isViewMode }: Props) {
    return (
        <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white">
            <DialogHeader className="space-y-1">
                <DialogTitle className="text-white">{title}</DialogTitle>
                <DialogDescription className="text-white/80">
                    {isViewMode
                        ? 'View the incident report details below.'
                        : 'Provide details about the incident to create a new report.'}
                </DialogDescription>
            </DialogHeader>
        </div>
    );
}
