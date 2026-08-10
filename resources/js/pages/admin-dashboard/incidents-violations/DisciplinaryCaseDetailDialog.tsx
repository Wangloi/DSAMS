import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
    AlertTriangle, 
    BookOpen, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    FileText, 
    Gavel, 
    HeartHandshake, 
    MapPin, 
    Printer, 
    Scale, 
    ShieldAlert, 
    User, 
    UserCheck, 
    Users, 
    X,
    FileSpreadsheet,
    FileDown,
    PlusCircle
} from 'lucide-react';
import type { IncidentRow } from './types';

interface DisciplinaryCaseDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    incident: IncidentRow | null;
    onEdit?: (incident: IncidentRow) => void;
}

export default function DisciplinaryCaseDetailDialog({
    open,
    onOpenChange,
    incident,
    onEdit
}: DisciplinaryCaseDetailDialogProps) {
    if (!incident) return null;

    const isMajor = incident.classification !== 'Warning';
    const severityText = isMajor ? 'Critical Severity' : 'Moderate Severity';
    const severityColor = isMajor 
        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' 
        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';

    // Mock/Simulated details based on incident
    const caseId = incident.caseId || `CAS-2026-${incident.id.toString().padStart(3, '0')}`;
    const incidentTitle = incident.type;
    const incidentDescription = incident.raw?.description || `Incident reported involving ${incident.student}. Investigation under progress.`;
    const investigationStatus = incident.status;
    const assignedOfficer = incident.raw?.receivedBy || incident.raw?.reportedBy || 'Dean Marcus Aurelius';
    const location = incident.raw?.location || 'Main Campus';
    const dateTime = incident.dateTime;

    // Student Information (using active row and generating consistent mocks)
    const studentName = incident.student;
    const studentId = incident.studentId;
    const studentInitials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    // Simulate year level and course based on ID or index
    const courseMock = studentId.includes('BSCS') ? 'BSCS' : 'BSIT';
    const yearLevelMock = incident.id % 2 === 0 ? '3rd Year' : '4th Year';
    const gpaMock = incident.id % 2 === 0 ? '3.24 (Good Standing)' : '3.85 (Probation)';
    const warningCount = isMajor ? '3 WARNINGS' : '1 WARNING';

    // Trigger edit callback and close detail dialog
    const handleModifyClick = () => {
        onOpenChange(false);
        if (onEdit) {
            onEdit(incident);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl w-[95vw] md:w-[85vw] max-h-[92vh] overflow-y-auto p-0 gap-0 bg-slate-50 dark:bg-[#0B192C] border-slate-200 dark:border-slate-800 shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Disciplinary Case Detail - {caseId}</DialogTitle>
                    <DialogDescription>Detailed overview of case #{caseId} for student {studentName}</DialogDescription>
                </DialogHeader>

                {/* Top Header/Breadcrumb Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-[#0F213A] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <span className="hover:underline cursor-pointer">Registry</span>
                            <span>/</span>
                            <span className="text-slate-900 dark:text-white font-bold">Case #{caseId}</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
                            Disciplinary Case Detail
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white hover:bg-slate-50 dark:bg-[#1E3A5F] dark:hover:bg-[#1A304F] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 h-9 font-bold flex items-center gap-2"
                            onClick={() => window.print()}
                        >
                            <Printer className="h-4 w-4" />
                            <span>Export PDF</span>
                        </Button>
                        {onEdit && (
                            <Button 
                                size="sm" 
                                className="bg-[#1E3E62] hover:bg-[#152D48] text-white dark:bg-blue-600 dark:hover:bg-blue-700 h-9 font-black flex items-center gap-2"
                                onClick={handleModifyClick}
                            >
                                <FileText className="h-4 w-4" />
                                <span>Modify Record</span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* LEFT COLUMN - CASE DETAILS (Col-span 2) */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Card 1: Main Case Information */}
                            <Card className="bg-white dark:bg-[#0F213A] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden border-l-4 border-l-rose-500 dark:border-l-rose-600">
                                <CardContent className="p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                        <span className="text-xs font-bold text-slate-400 tracking-wider">CASE_ID: #{caseId}</span>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${severityColor}`}>
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            {severityText}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight leading-snug">
                                        {incidentTitle}
                                    </h3>

                                    <p className="text-slate-600 dark:text-slate-350 text-xs font-medium leading-relaxed mb-6">
                                        {incidentDescription}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Investigation Status</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                <span className={`h-2 w-2 rounded-full ${
                                                    investigationStatus === 'Resolved' ? 'bg-emerald-500' :
                                                    investigationStatus === 'Pending' ? 'bg-amber-500' :
                                                    investigationStatus === 'Ongoing' ? 'bg-blue-500' : 'bg-rose-500'
                                                }`} />
                                                <span>{investigationStatus}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Officer</span>
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                                                {assignedOfficer}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location & Date</span>
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{location} ({dateTime.split(' ')[0]})</span>
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Statutory Reference */}
                            <Card className="bg-white dark:bg-[#0F213A] border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookOpen className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Statutory Reference</h4>
                                    </div>

                                    {incident.type.toLowerCase().includes('dress') || incident.type.toLowerCase().includes('uniform') ? (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 dark:bg-[#1E3A5F]/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <span className="block text-sm font-extrabold text-slate-900 dark:text-white">Section 1: Disciplinary Warning</span>
                                                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Student Handbook, Chapter 2: Campus Decorum & Dress Code
                                                </span>
                                            </div>
                                            <ul className="space-y-2">
                                                <li className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                                    <span className="block h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                                    <span>Paragraph 1.2: Dress Code and Uniform Compliance</span>
                                                </li>
                                            </ul>
                                        </div>
                                    ) : incident.type.toLowerCase().includes('access') || incident.type.toLowerCase().includes('breach') || incident.type.toLowerCase().includes('hacking') ? (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 dark:bg-[#1E3A5F]/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <span className="block text-sm font-extrabold text-slate-900 dark:text-white">Section 2: Suspension / Expulsion</span>
                                                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Student Handbook, Chapter 4: Academic Integrity & IT Policy
                                                </span>
                                            </div>
                                            <ul className="space-y-2">
                                                <li className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                                    <span className="block h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                                    <span>Paragraph 2.1: Unauthorized Digital Interfacing</span>
                                                </li>
                                                <li className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                                    <span className="block h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                                    <span>Paragraph 2.4: Malicious Modification of Records</span>
                                                </li>
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 dark:bg-[#1E3A5F]/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <span className="block text-sm font-extrabold text-slate-900 dark:text-white">General Code of Conduct</span>
                                                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Student Handbook, Chapter 3: Student Conduct & Disciplinary Action
                                                </span>
                                            </div>
                                            <ul className="space-y-2">
                                                <li className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                                    <span className="block h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                                    <span>Applicable Code: Compliance with University Regulations</span>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                             </Card>
 
                             {/* Card 3: Imposed Effects */}
                             <Card className="bg-white dark:bg-[#0F213A] border-slate-200 dark:border-slate-800 shadow-sm">
                                 <CardContent className="p-6">
                                     <div className="flex items-center gap-2 mb-4">
                                         <Scale className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                         <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Imposed Effects</h4>
                                     </div>
 
                                     <div className="space-y-2.5">
                                         {isMajor ? (
                                             <>
                                                 <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-350 text-xs font-bold">
                                                     <ShieldAlert className="h-4 w-4 shrink-0" />
                                                     <span>Official suspension pending investigation</span>
                                                 </div>
                                                 {incident.raw?.immediateAction && (
                                                     <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-350 text-xs font-bold">
                                                         <FileText className="h-4 w-4 shrink-0" />
                                                         <span>Action: {incident.raw.immediateAction}</span>
                                                     </div>
                                                 )}
                                             </>
                                         ) : (
                                             <>
                                                 <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-350 text-xs font-bold">
                                                     <ShieldAlert className="h-4 w-4 shrink-0" />
                                                     <span>Written warning filed in student record</span>
                                                 </div>
                                                 {incident.raw?.immediateAction && (
                                                     <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-350 text-xs font-bold">
                                                         <Clock className="h-4 w-4 shrink-0" />
                                                         <span>Action: {incident.raw.immediateAction}</span>
                                                     </div>
                                                 )}
                                             </>
                                         )}
                                     </div>
                                 </CardContent>
                             </Card>
 
                             {/* Card 4: Notes & Compliance Tracking */}
                             <Card className="bg-white dark:bg-[#0F213A] border-slate-200 dark:border-slate-800 shadow-sm">
                                 <CardContent className="p-6">
                                     <div className="flex items-center justify-between gap-2 mb-6">
                                         <div className="flex items-center gap-2">
                                             <FileText className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                             <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Notes & Compliance Tracking</h4>
                                         </div>
                                     </div>
 
                                     <div className="space-y-4">
                                         {incident.raw ? (
                                             <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-[#1E3A5F]/40 text-blue-600 dark:text-blue-400 mt-0.5">
                                                     <FileText className="h-4 w-4" />
                                                 </div>
                                                 <div className="flex-1 min-w-0">
                                                     <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                                         <span className="text-xs font-black text-slate-900 dark:text-white">Initial Action Logged</span>
                                                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{incident.dateTime.split(' ')[0]}</span>
                                                     </div>
                                                     <p className="text-[11px] font-medium text-slate-600 dark:text-slate-355 leading-relaxed mt-1">
                                                         {incident.raw.immediateAction || 'No immediate action logged yet.'}
                                                     </p>
                                                     <div className="flex items-center gap-2 mt-2">
                                                         <Badge className="bg-emerald-100 hover:bg-emerald-150 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250 border-0 rounded text-[9px] font-black tracking-wide px-1.5 py-0">
                                                             LOGGED
                                                         </Badge>
                                                         <span className="text-[9px] font-bold text-slate-400 uppercase">Officer: {incident.raw.receivedBy || 'Registrar'}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                         ) : (
                                             <div className="text-xs font-medium text-slate-500 text-center py-4">
                                                 No active compliance entries recorded.
                                             </div>
                                         )}
                                     </div>
                                 </CardContent>
                             </Card>
 
                         </div>
 
                         {/* RIGHT COLUMN - STUDENT PROFILE & HISTORY (Col-span 1) */}
                         <div className="space-y-6">
                             
                             {/* Card 1: Student Profile Card */}
                             <Card className="bg-[#0B192C] text-white border-slate-800 shadow-md overflow-hidden">
                                 <CardContent className="p-6">
                                     <div className="flex items-center gap-4">
                                         <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-base font-black text-white ring-2 ring-slate-800 shadow-inner">
                                             {studentInitials}
                                         </div>
                                         <div>
                                             <h4 className="text-base font-extrabold tracking-tight leading-tight">{studentName}</h4>
                                             <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">ID: {studentId}</p>
                                         </div>
                                     </div>
 
                                     <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800">
                                         <div>
                                             <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Year Level</span>
                                             <span className="text-xs font-bold text-slate-200">{yearLevelMock} ({courseMock})</span>
                                         </div>
                                         <div>
                                             <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Academic Status</span>
                                             <span className="text-xs font-bold text-slate-250">Good Standing</span>
                                         </div>
                                     </div>
                                 </CardContent>
                             </Card>
 
                             {/* Card 2: Disciplinary History */}
                             <Card className="bg-white dark:bg-[#0F213A] border-slate-200 dark:border-slate-800 shadow-sm">
                                 <CardContent className="p-6">
                                     <div className="flex items-center justify-between gap-2 mb-6">
                                         <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Disciplinary History</h4>
                                         <Badge variant={isMajor ? 'destructive' : 'secondary'} className="rounded text-[9px] font-black px-1.5 py-0 tracking-wide uppercase">
                                             {warningCount}
                                         </Badge>
                                     </div>
 
                                     <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
                                         
                                         {/* Current Incident Timeline */}
                                         <div className="relative">
                                             <span className={`absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full ${
                                                 isMajor ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                             } ring-4 ring-white dark:ring-[#0F213A]`}>
                                                 <AlertTriangle className="h-2.5 w-2.5" />
                                             </span>
                                             <div className="flex items-center justify-between gap-2">
                                                 <span className={`text-xs font-black ${isMajor ? 'text-rose-750 dark:text-rose-450' : 'text-blue-750 dark:text-blue-450'}`}>
                                                     Current Case ({incident.status})
                                                 </span>
                                                 <span className="text-[9px] font-bold text-slate-400 uppercase">{dateTime.split(' ')[0].toUpperCase()}</span>
                                             </div>
                                             <p className="text-[10px] font-medium text-slate-500 dark:text-slate-450 leading-relaxed mt-1">
                                                 {incident.type} (this report)
                                             </p>
                                         </div>
 
                                     </div>
                                 </CardContent>
                             </Card>
 
                             {/* Card 3: Counseling Status */}
                             <Card className="bg-[#FAF3E0] dark:bg-[#2B2315] border-amber-200/50 dark:border-amber-900/30 text-slate-800 dark:text-amber-100 shadow-sm">
                                 <CardContent className="p-6">
                                     <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-400 mb-4">Counseling Status</h4>
                                     
                                     <div className="flex items-center justify-between text-xs font-extrabold mb-2">
                                         <span>Program Status</span>
                                         <span>{incident.status === 'Resolved' ? 'Completed' : incident.status === 'Pending' ? '0% (Needs Intake)' : 'Undergoing'}</span>
                                     </div>
                                     <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                                         <div className="bg-[#E6A15C] h-full rounded-full" style={{ width: incident.status === 'Resolved' ? '100%' : incident.status === 'Pending' ? '0%' : '50%' }} />
                                     </div>
 
                                     <p className="text-[10px] font-bold text-amber-800/80 dark:text-amber-400 flex items-center gap-1.5 leading-relaxed">
                                         <HeartHandshake className="h-4 w-4 text-[#E6A15C] shrink-0" />
                                         <span>{incident.status === 'Resolved' ? 'Sessions completed successfully.' : 'Counseling scheduling required.'}</span>
                                     </p>
                                 </CardContent>
                             </Card>
 
                         </div>

                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
