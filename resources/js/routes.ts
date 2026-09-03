export const landing = () => '/';
export const home = () => '/';
export const features = () => '/features';
export const about = () => '/about';
export const getStarted = () => '/get-started';
export const dashboard = () => '/dashboard';
export const studentDashboard = () => '/student-dashboard';
export const studentHelp = () => '/student/help';
export const studentNotifications = () => '/student/notifications';
export const studentAttendanceScannerPortal = (eventId: number | string) =>
    `/student/attendance/scanner-portal/${eventId}`;
export const studentAttendanceScan = (eventId: number | string) =>
    `/student/attendance/${eventId}/scan`;
export const studentAttendanceDynamicQrScan = (eventId: number | string) =>
    `/student/attendance/${eventId}/dynamic-qr-scan`;
export const adminAttendanceDynamicQr = (eventId: number | string) =>
    `/admin/attendance/${eventId}/dynamic-qr`;
export const adminAttendanceDynamicQrToken = (eventId: number | string) =>
    `/admin/attendance/${eventId}/dynamic-qr/token`;
export const studentEvaluationShow = (evaluationId: number | string) =>
    `/student/evaluation/${evaluationId}`;
export const studentEvaluationSubmit = (evaluationId: number | string) =>
    `/student/evaluation/${evaluationId}`;
export const programHeadDashboard = () => '/program-head-dashboard';
export const programHeadAttendance = () => '/program-head/attendance';
export const programHeadAttendanceLogs = (
    eventId: number | string,
    limit?: number,
) => {
    const baseUrl = `/program-head/attendance/${eventId}/logs`;
    return limit ? `${baseUrl}?limit=${limit}` : baseUrl;
};
export const programHeadAttendancePrint = (eventId: number | string) =>
    `/program-head/attendance/${eventId}/print`;
export const programHeadViolations = () => '/program-head/violations';
export const programHeadReports = () => '/program-head/reports';
export const programHeadReportsAttendance = () => '/program-head/reports';
export const programHeadReportsViolations = () => '/program-head/reports';
export const programHeadCalendarEvents = () => '/program-head/calendar-events';
export const programHeadActivityLog = () => '/program-head/activity-log';
export const programHeadHelp = () => '/program-head/help';
export const adminDashboard = () => '/admin-dashboard';
export const adminNotifications = () => '/admin/notifications';
export const adminEvents = () => '/admin/events';
export const adminEventsCreate = () => '/admin/events/create';
export const adminEventsShow = (id: number | string) => `/admin/events/${id}`;
export const adminEventsEdit = (id: number | string) =>
    `/admin/events/${id}/edit`;
export const adminEventsUpdate = (id: number | string) => `/admin/events/${id}`;
export const adminEventsDestroy = (id: number | string) =>
    `/admin/events/${id}`;
export const adminEventsArchive = (id: number | string) =>
    `/admin/events/${id}/archive`;
export const adminEventsUnarchive = (id: number | string) =>
    `/admin/events/${id}/unarchive`;
export const adminManageUsers = () => '/admin/manage-users';
export const adminManageUsersStore = () => '/admin/manage-users';
export const adminManageUsersUpdate = (id: number | string) =>
    `/admin/manage-users/${id}`;
export const adminManageUsersDestroy = (id: number | string) =>
    `/admin/manage-users/${id}`;
export const adminManageUsersUnarchive = (id: number | string) =>
    `/admin/manage-users/${id}/unarchive`;
export const adminPrograms = () => '/admin/programs';
export const adminProgramsStore = () => '/admin/programs';
export const adminProgramsUpdate = (id: number | string) =>
    `/admin/programs/${id}`;
export const adminProgramsDestroy = (id: number | string) =>
    `/admin/programs/${id}`;
export const adminProgramsArchive = (id: number | string) =>
    `/admin/programs/${id}/archive`;
export const adminProgramsUnarchive = (id: number | string) =>
    `/admin/programs/${id}/unarchive`;
export const adminAdmissionSlip = () => '/admin/admission-slip';
export const adminAdmissionSlipStore = () => '/admin/admission-slip';
export const adminAdmissionSlipUpdate = (id: number | string) =>
    `/admin/admission-slip/${id}`;
export const adminAdmissionSlipDestroy = (id: number | string) =>
    `/admin/admission-slip/${id}`;
export const adminAdmissionSlipArchive = (id: number | string) =>
    `/admin/admission-slip/${id}/archive`;
export const adminAdmissionSlipUnarchive = (id: number | string) =>
    `/admin/admission-slip/${id}/unarchive`;
export const adminIncidentsViolations = () => '/admin/incidents-violations';
export const adminIncidentsViolationsStore = () =>
    '/admin/incidents-violations';
export const adminIncidentsViolationsShow = (id: number | string) =>
    `/admin/incidents-violations/${id}`;
export const adminIncidentsViolationsUpdate = (id: number | string) =>
    `/admin/incidents-violations/${id}`;
export const adminIncidentsViolationsUpdateStatus = (id: number | string) =>
    `/admin/incidents-violations/${id}/status`;
export const adminIncidentsViolationsUpdatePost = (id: number | string) =>
    `/admin/incidents-violations/${id}`;
export const adminIncidentsViolationsDestroy = (id: number | string) =>
    `/admin/incidents-violations/${id}`;
export const adminIncidentsViolationsArchive = (id: number | string) =>
    `/admin/incidents-violations/${id}/archive`;
export const adminIncidentsViolationsArchivePost = (id: number | string) =>
    `/admin/incidents-violations/${id}/archive`;
export const adminIncidentsViolationsUnarchive = (id: number | string) =>
    `/admin/incidents-violations/${id}/unarchive`;
export const adminIncidentsViolationsUpdatePhase = (id: number | string) =>
    `/admin/incidents-violations/${id}/phase`;
export const adminIncidentsViolationsBatch = () =>
    '/admin/incidents-violations-batch';
export const adminAttendance = () => '/admin/attendance';
export const adminAttendanceActivateScannerPortal = (
    eventId: number | string,
) => `/admin/attendance/${eventId}/activate-scanner-portal`;
export const adminAttendanceLogs = (
    eventId: number | string,
    limit?: number,
) => {
    const baseUrl = `/admin/attendance/${eventId}/logs`;
    return limit ? `${baseUrl}?limit=${limit}` : baseUrl;
};
export const adminAttendanceStudentsByCourse = (
    eventId: number | string,
    course?: string,
) => {
    const baseUrl = `/admin/attendance/${eventId}/students-by-course`;
    return course ? `${baseUrl}?course=${encodeURIComponent(course)}` : baseUrl;
};
export const adminAttendanceStore = () => '/admin/attendance';
export const adminAttendanceUpdate = (id: number | string) =>
    `/admin/attendance/${id}`;
export const adminAttendanceDestroy = (id: number | string) => {
    if (
        !id ||
        id === 'undefined' ||
        id === 'null' ||
        String(id).trim() === ''
    ) {
        console.error('adminAttendanceDestroy called with invalid ID:', id);
        throw new Error('Invalid event ID provided for deletion');
    }
    const url = `/admin/attendance/${id}`;
    console.log(
        'adminAttendanceDestroy called with id:',
        id,
        'returning URL:',
        url,
    );
    return url;
};
export const adminAttendanceArchive = (id: number | string) =>
    `/admin/attendance/${id}/archive`;
export const adminAttendanceUnarchive = (id: number | string) =>
    `/admin/attendance/${id}/unarchive`;
export const adminAnnouncement = () => '/admin/announcement';
export const adminAnnouncementStore = () => '/admin/announcement';
export const adminAnnouncementShow = (id: number | string) =>
    `/admin/announcement/${id}`;
export const adminAnnouncementUpdate = (id: number | string) =>
    `/admin/announcement/${id}`;
export const adminAnnouncementArchive = (id: number | string) =>
    `/admin/announcement/${id}/archive`;
export const adminAnnouncementUnarchive = (id: number | string) =>
    `/admin/announcement/${id}/unarchive`;
export const adminAnalytics = () => '/admin/analytics';
export const adminReports = () => '/admin/reports';
export const adminHelp = () => '/admin/help';
export const adminLostFound = () => '/admin/lost-found';
export const adminLostFoundStore = () => '/admin/lost-found';
export const adminLostFoundUpdate = (id: number | string) =>
    `/admin/lost-found/${id}`;
export const adminLostFoundDestroy = (id: number | string) =>
    `/admin/lost-found/${id}`;
export const adminLostFoundArchive = (id: number | string) =>
    `/admin/lost-found/${id}/archive`;
export const adminLostFoundUnarchive = (id: number | string) =>
    `/admin/lost-found/${id}/unarchive`;
export const adminEvaluation = () => '/admin/evaluation';
export const adminEvaluationStore = () => '/admin/evaluation';
export const adminEvaluationAutoGenerate = () =>
    '/admin/evaluation/auto-generate';
export const adminEvaluationShow = (id: number | string) =>
    `/admin/evaluation/${id}`;
export const adminEvaluationUpdate = (id: number | string) => {
    if (
        !id ||
        id === 'undefined' ||
        id === 'null' ||
        String(id).trim() === ''
    ) {
        console.error('adminEvaluationUpdate called with invalid ID:', id);
        throw new Error('Invalid evaluation ID provided for update');
    }
    return `/admin/evaluation/${id}`;
};
export const adminEvaluationDestroy = (id: number | string) =>
    `/admin/evaluation/${id}/delete`;
export const adminEvaluationArchive = (id: number | string) =>
    `/admin/evaluation/${id}/archive`;
export const adminEvaluationUnarchive = (id: number | string) =>
    `/admin/evaluation/${id}/unarchive`;
export const adminEvaluationPublish = (id: number | string) =>
    `/admin/evaluation/${id}/publish`;
export const adminEvaluationUnpublish = (id: number | string) =>
    `/admin/evaluation/${id}/unpublish`;
export const adminEvaluationApproveProgram = (id: number | string) =>
    `/admin/evaluation/${id}/approve-program`;
export const adminEvaluationMetrics = (id: number | string) =>
    `/admin/evaluation/${id}/metrics`;
export const adminArchive = () => '/admin/archive';
export const adminActivityLog = () => '/admin/activity-log';
export const adminQrScanner = (eventId?: number | string) =>
    eventId ? `/admin/qr-scanner?event=${eventId}` : '/admin/qr-scanner';
export const studentIncidentsStore = () => '/student/incidents';
export const studentAdmissionSlipStore = () => '/student/admission-slip';
export const studentAdmissionSlipIndex = () => '/student/admission-slip';

export const studentLostFoundItems = () => '/student/lost-found/items';
export const studentLostFoundClaim = (id: number | string) =>
    `/student/lost-found/${id}/claim`;
export const studentLostFoundMyReports = () => '/student/lost-found/my-reports';
export const studentLostFoundReportLost = () =>
    '/student/lost-found/report-lost';
export const studentLostFoundReportFound = () =>
    '/student/lost-found/report-found';
export const studentCertificates = () => '/student/certificates';
export const register = () => '/register';
export const logout = () => '/logout';

export const adminLogin = () => '/admin-login';
export const studentLogin = () => '/student-login';
export const programHeadLogin = () => '/program-head-login';

export const forgotPassword = () => '/forgot-password';

export const programHeadNotifications = () => '/program-head/notifications';

// Aliases
export const login = () => '/login';
