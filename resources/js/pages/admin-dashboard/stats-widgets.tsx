import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function StatsWidgets() {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pending Admission Slips</CardTitle>
                    <CardDescription className="text-xs">
                        Requests awaiting review
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-semibold text-slate-900">3</div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Students</CardTitle>
                    <CardDescription className="text-xs">
                        Active student accounts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-semibold text-slate-900">420</div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Open Incidents</CardTitle>
                    <CardDescription className="text-xs">
                        Unresolved reports
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <div className="text-2xl font-semibold text-slate-900">5</div>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
