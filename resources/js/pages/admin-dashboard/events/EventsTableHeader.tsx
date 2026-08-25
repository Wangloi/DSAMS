import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function EventsTableHeader({
    onCreateClick,
}: {
    onCreateClick?: () => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <Button
                type="button"
                className="h-10 gap-2 rounded-xl bg-blue-600 font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
                onClick={onCreateClick}
            >
                <PlusCircle className="h-5 w-5" />
                Create New Event
            </Button>
        </div>
    );
}
