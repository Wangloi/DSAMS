import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export function AnalysisPanels() {
    const useChartWidth = () => {
        const ref = useRef<HTMLDivElement | null>(null);
        const [width, setWidth] = useState(0);

        useEffect(() => {
            const el = ref.current;
            if (!el) return;

            const ro = new ResizeObserver((entries) => {
                const entry = entries[0];
                const next = Math.floor(entry?.contentRect?.width ?? 0);
                if (next > 0) setWidth(next);
            });

            ro.observe(el);
            return () => ro.disconnect();
        }, []);

        return { ref, width };
    };

    const chartHeights = useMemo(() => ({ h72: 288, h80: 320 }), []);
    const incidentsChart = useChartWidth();
    const attendanceChart = useChartWidth();
    const summaryChart = useChartWidth();
    const intramuralsChart = useChartWidth();

    const incidentsData = [
        { name: 'Today', resolved: 2, pending: 1 },
        { name: 'This Week', resolved: 7, pending: 3 },
        { name: 'This Month', resolved: 15, pending: 6 },
    ];

    const attendanceByProgram = [
        { name: 'IT', value: 28, color: '#ef4444' },
        { name: 'BSBA', value: 22, color: '#f59e0b' },
        { name: 'EDUC', value: 18, color: '#3b82f6' },
        { name: 'CRM', value: 16, color: '#22c55e' },
        { name: 'HM', value: 12, color: '#eab308' },
    ];

    const summaryReports = [
        {
            name: 'Daily',
            attendance: 12,
            evaluation: 6,
            incidents: 3,
            violations: 1,
        },
        {
            name: 'Weekly',
            attendance: 24,
            evaluation: 11,
            incidents: 6,
            violations: 4,
        },
        {
            name: 'Monthly',
            attendance: 40,
            evaluation: 20,
            incidents: 9,
            violations: 7,
        },
        {
            name: 'Yearly',
            attendance: 85,
            evaluation: 60,
            incidents: 14,
            violations: 9,
        },
    ];

    const intramurals = [
        { name: 'IT', value: 45, color: '#ef4444' },
        { name: 'BSBA', value: 70, color: '#f59e0b' },
        { name: 'EDUC', value: 65, color: '#3b82f6' },
        { name: 'CRM', value: 75, color: '#fb923c' },
        { name: 'HM', value: 55, color: '#22c55e' },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="min-w-0 border-0 shadow-sm lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            Incidents & Violations Analysis
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Overview for today, week, and month
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-72 w-full min-w-0">
                        <div
                            ref={incidentsChart.ref}
                            className="h-full min-h-0 w-full min-w-0"
                        >
                            {incidentsChart.width > 0 ? (
                                <BarChart
                                    width={Math.max(1, incidentsChart.width)}
                                    height={chartHeights.h72}
                                    data={incidentsData}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        left: -8,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e2e8f0"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar
                                        dataKey="resolved"
                                        name="Resolved"
                                        fill="#16a34a"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="pending"
                                        name="Pending"
                                        fill="#ef4444"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            ) : (
                                <div className="h-full w-full rounded-lg bg-slate-50" />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            Recent Activities
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Latest system updates (sample)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-xs text-slate-700">
                            <div className="font-medium">User added</div>
                            <div className="text-slate-500">1 hour ago</div>
                        </div>
                        <div className="text-xs text-slate-700">
                            <div className="font-medium">Student updated</div>
                            <div className="text-slate-500">4 hours ago</div>
                        </div>
                        <div className="text-xs text-slate-700">
                            <div className="font-medium">Incident reported</div>
                            <div className="text-slate-500">Yesterday</div>
                        </div>
                        <div className="pt-2">
                            <Button
                                type="button"
                                className="h-8 w-full"
                                variant="default"
                            >
                                View all
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Card className="min-w-0 border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            Attendance by Program
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Distribution (sample)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-72 w-full min-w-0">
                        <div
                            ref={attendanceChart.ref}
                            className="h-full min-h-0 w-full min-w-0"
                        >
                            {attendanceChart.width > 0 ? (
                                <PieChart
                                    width={attendanceChart.width}
                                    height={chartHeights.h72}
                                >
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Pie
                                        data={attendanceByProgram}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={95}
                                        innerRadius={55}
                                        paddingAngle={2}
                                    >
                                        {attendanceByProgram.map((entry) => (
                                            <Cell
                                                key={entry.name}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            ) : (
                                <div className="h-full w-full rounded-lg bg-slate-50" />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                        Summary Reports Analytics
                    </CardTitle>
                    <CardDescription className="text-xs">
                        System analytics for attendance, evaluation, incidents,
                        and violations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-80 w-full min-w-0">
                    <div
                        ref={summaryChart.ref}
                        className="h-full min-h-0 w-full min-w-0"
                    >
                        {summaryChart.width > 0 ? (
                            <BarChart
                                width={summaryChart.width}
                                height={chartHeights.h80}
                                data={summaryReports}
                                margin={{
                                    top: 8,
                                    right: 8,
                                    left: -8,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e2e8f0"
                                />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar
                                    dataKey="attendance"
                                    name="Attendance"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="evaluation"
                                    name="Evaluation"
                                    fill="#16a34a"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="incidents"
                                    name="Incidents"
                                    fill="#f97316"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="violations"
                                    name="Violations"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        ) : (
                            <div className="h-full w-full rounded-lg bg-slate-50" />
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="min-w-0 border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                        Intramurals Evaluation Analytics
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Participation by program (sample)
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-72 w-full min-w-0">
                    <div
                        ref={intramuralsChart.ref}
                        className="h-full min-h-0 w-full min-w-0"
                    >
                        {intramuralsChart.width > 0 ? (
                            <BarChart
                                width={Math.max(1, intramuralsChart.width)}
                                height={chartHeights.h72}
                                data={intramurals}
                                margin={{
                                    top: 8,
                                    right: 8,
                                    left: -8,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e2e8f0"
                                />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="value" name="Participation">
                                    {intramurals.map((entry) => (
                                        <Cell
                                            key={entry.name}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : (
                            <div className="h-full w-full rounded-lg bg-slate-50" />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
