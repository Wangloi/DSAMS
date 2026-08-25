type AttendanceRow = {
    id: string;
    event: string;
    dateTime: string;
    organizer: string;
    totalAttendees: number;
    presentCount: number;
    status: 'upcoming' | 'ongoing' | 'completed';
    location: string;
};

type Props = {
    event: AttendanceRow;
};

export default function AttendanceSheetPrint({ event }: Props) {
    const eventDate = new Date(event.dateTime);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Generate empty rows for printing
    const emptyRows = Array.from({ length: 25 }, (_, i) => i);

    return (
        <div className="hidden w-full bg-white p-8 print:block">
            <style>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .print-container {
                        width: 100%;
                        page-break-after: always;
                    }
                }
            `}</style>

            <div className="print-container">
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="mb-4 flex justify-center">
                        <img
                            src="/images/SRCB.png"
                            alt="School Logo"
                            className="h-16 w-16"
                        />
                    </div>
                    <h1 className="text-lg font-bold">
                        ST. RITA'S COLLEGE OF BALINGASAG, INC.
                    </h1>
                    <p className="text-sm text-gray-600">
                        Balingasag, Misamis Oriental
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        ACADEMIC YEAR 2025 - 2026
                    </p>
                </div>

                {/* Title */}
                <div className="mb-6 border-b-2 border-black pb-4 text-center">
                    <h2 className="text-xl font-bold">Attendance Sheet</h2>
                    <h3 className="mt-2 inline-block bg-yellow-300 px-4 py-1 text-lg font-bold">
                        {event.event}
                    </h3>
                </div>

                {/* Event Details */}
                <div className="mb-6 text-sm">
                    <p className="mb-2">
                        <span className="font-semibold">Date:</span>{' '}
                        {formattedDate} |{' '}
                        <span className="font-semibold">Time:</span>{' '}
                        {formattedTime}
                    </p>
                    <p className="mb-2">
                        <span className="font-semibold">Location:</span>{' '}
                        {event.location}
                    </p>
                    <p className="mb-2">
                        <span className="font-semibold">Organizer:</span>{' '}
                        {event.organizer}
                    </p>
                </div>

                {/* Table */}
                <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="w-[45%] border border-black px-4 py-2 text-left font-bold">
                                Student's Name
                            </th>
                            <th className="w-[25%] border border-black px-4 py-2 text-left font-bold">
                                Course/Program
                            </th>
                            <th className="w-[15%] border border-black px-4 py-2 text-left font-bold">
                                Time-In
                            </th>
                            <th className="w-[15%] border border-black px-4 py-2 text-left font-bold">
                                Time-Out
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {emptyRows.map((_, index) => (
                            <tr key={index} className="h-12">
                                <td className="border border-black px-4 py-2"></td>
                                <td className="border border-black px-4 py-2"></td>
                                <td className="border border-black px-4 py-2"></td>
                                <td className="border border-black px-4 py-2"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-600">
                    <p>
                        Printed on:{' '}
                        {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
}
