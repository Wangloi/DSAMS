import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Activity, ClipboardList, ShieldAlert, UserRound } from 'lucide-react';

export function QuickActions() {
    return (
        <>
            <div className="text-sm font-semibold text-slate-700">
                Quick Actions
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-0 bg-gradient-to-br from-rose-600 to-rose-900 text-white">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <ShieldAlert className="h-5 w-5" />
                            <Badge
                                variant="secondary"
                                className="bg-white/15 text-white"
                            >
                                Pending
                            </Badge>
                        </div>
                        <CardTitle className="text-base">
                            Manage Incidents
                        </CardTitle>
                        <CardDescription className="text-white/85">
                            Review and respond to incident reports
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-900 text-white">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <ClipboardList className="h-5 w-5" />
                            <Badge
                                variant="secondary"
                                className="bg-white/15 text-white"
                            >
                                Pending
                            </Badge>
                        </div>
                        <CardTitle className="text-base">
                            Admission Slip
                        </CardTitle>
                        <CardDescription className="text-white/85">
                            Process admission slip requests
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-emerald-600 to-emerald-900 text-white">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <UserRound className="h-5 w-5" />
                            <Badge
                                variant="secondary"
                                className="bg-white/15 text-white"
                            >
                                Active
                            </Badge>
                        </div>
                        <CardTitle className="text-base">
                            Manage Students
                        </CardTitle>
                        <CardDescription className="text-white/85">
                            View and manage student accounts
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-slate-600 to-slate-900 text-white">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <Activity className="h-5 w-5" />
                            <Badge
                                variant="secondary"
                                className="bg-white/15 text-white"
                            >
                                Recent
                            </Badge>
                        </div>
                        <CardTitle className="text-base">
                            Activity Log
                        </CardTitle>
                        <CardDescription className="text-white/85">
                            View system activity and logs
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </>
    );
}
