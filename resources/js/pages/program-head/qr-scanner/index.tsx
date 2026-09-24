import { Button } from '@/components/ui/button';
import { programHeadAttendance } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, QrCode } from 'lucide-react';
import { useState } from 'react';
import RealTimeMonitoringPanel from '../../admin-dashboard/attendance/RealTimeMonitoringPanel';
import ProgramHeadLayout from '../components/ProgramHeadLayout';

export default function ProgramHeadQrScannerPage({ event }: { event?: any }) {
    const [events, setEvents] = useState<any[]>(event ? [event] : []);

    return (
        <ProgramHeadLayout>
            <Head title="QR Code Scanner - Program Head" />
            <div className="min-h-screen bg-slate-50/50 dark:bg-[#020817]">
                <div className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                    {event ? (
                        <RealTimeMonitoringPanel
                            monitoredEvent={event}
                            onBack={() => {
                                window.location.href = programHeadAttendance();
                            }}
                            hasBackendEvents={true}
                            handleViewStudentsByCourse={() => {}}
                            setEvents={setEvents}
                            userRole="program_head"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#0B192C]">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <QrCode className="h-8 w-8" />
                            </div>
                            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                                Select an Event to Scan
                            </h2>
                            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                                Please go to Attendance Monitoring and select an active event to open the real-time QR code scanner.
                            </p>
                            <Link
                                href={programHeadAttendance()}
                                className="mt-6"
                            >
                                <Button className="gap-2 rounded-xl bg-[#0b2d66] text-white hover:bg-blue-700">
                                    <ArrowLeft className="h-4 w-4" />
                                    Go to Attendance
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </ProgramHeadLayout>
    );
}
