import {
    ChevronDown,
    ClipboardList,
    FileText,
    HelpCircle,
    Mail,
    QrCode,
    ShieldAlert,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';

export default function LandingHelp() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqs = [
        {
            icon: ClipboardList,
            question:
                'How do I request an Admission Slip (Class Re-entry Clearance)?',
            answer: "If you were absent or tardy, go to your Student Dashboard and click on 'Admission Slips'. Fill out the reason for absence, upload supporting documents (e.g., medical certificate), and submit. Once approved by the Office of Student Affairs (DSA), your digital slip will be generated for presentation to your instructors.",
        },
        {
            icon: QrCode,
            question: 'How does Dynamic QR Event Attendance scanning work?',
            answer: "During school events or activities, open your Student Portal on your mobile device and navigate to 'Scan Attendance' or present your Student Dynamic QR. The event coordinator or scanner portal will scan your QR code for instant check-in and check-out tracking.",
        },
        {
            icon: ShieldAlert,
            question:
                'How are Disciplinary Cases and Incident Reports handled?',
            answer: "Incident reports regarding handbook violations can be submitted or logged by school personnel. Students involved can view active case statuses, sanction details (such as community service hours), and resolution notes directly under the 'Violations & Discipline' tab.",
        },
        {
            icon: UserCheck,
            question: 'How do I evaluate an event and download my Certificate?',
            answer: "After attending a recognized campus event, navigate to 'Event Evaluations' in your portal. Complete the required feedback survey for the event. Once submitted, your Certificate of Participation will automatically become available for download.",
        },
        {
            icon: HelpCircle,
            question: 'How do I log in or reset a forgotten password?',
            answer: "Students can log in using their Student ID Number or registered Email. If you forgot your password, click the 'Forgot Password?' link on the Sign In page to receive a password reset link in your email inbox.",
        },
        {
            icon: Users,
            question: 'Who should I contact if I encounter technical issues?',
            answer: "If you experience technical problems, contact the Office of Student Affairs or the system administrator through the 'Contact Support' section of the portal.",
        },
    ];

    return (
        <section
            id="help"
            className="relative overflow-hidden bg-slate-50 py-20"
        >
            {/* Background decorations */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-blue-100 opacity-50 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-indigo-100 opacity-50 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <span className="mb-3 inline-block rounded-full bg-blue-100/80 px-3.5 py-1.5 text-xs font-bold tracking-widest text-[#23509A] uppercase">
                        System Knowledge & FAQs
                    </span>
                    <h2 className="mb-4 text-3xl font-extrabold text-slate-900 md:text-4xl">
                        Frequently Asked Questions & Guidelines
                    </h2>
                    <p className="mx-auto max-w-2xl text-base text-slate-600 md:text-lg">
                        Official guidelines and solutions for Student Affairs
                        features, admission clearances, QR attendance, and
                        discipline tracking.
                    </p>
                </div>

                <div className="mx-auto mb-16 grid max-w-5xl gap-8 md:grid-cols-3">
                    {/* FAQ Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                            <HelpCircle className="h-6 w-6 text-[#23509A]" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-900">
                            System Guides
                        </h3>
                        <p className="mb-6 text-sm text-slate-600">
                            Learn how to navigate your Student Dashboard,
                            request clearances, and check attendance.
                        </p>
                        <a
                            href="#faq"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#23509A] hover:underline"
                        >
                            Read FAQs <span aria-hidden="true">&rarr;</span>
                        </a>
                    </div>

                    {/* Documentation Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                            <FileText className="h-6 w-6 text-[#000D6A]" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-900">
                            Student Handbook
                        </h3>
                        <p className="mb-6 text-sm text-slate-600">
                            Review campus policies, attendance guidelines, and
                            code of conduct rules.
                        </p>
                        <a
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#000D6A] hover:underline"
                        >
                            Student Portal{' '}
                            <span aria-hidden="true">&rarr;</span>
                        </a>
                    </div>

                    {/* Support Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                            <Mail className="h-6 w-6 text-sky-600" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-900">
                            DSA Office Help
                        </h3>
                        <p className="mb-6 text-sm text-slate-600">
                            Need personalized assistance? Contact the Office of
                            Student Affairs support team.
                        </p>
                        <a
                            href="mailto:dsa@srcb.edu.ph"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:underline"
                        >
                            Contact Support{' '}
                            <span aria-hidden="true">&rarr;</span>
                        </a>
                    </div>
                </div>

                {/* Accordion FAQ Section */}
                <div className="mx-auto max-w-3xl" id="faq">
                    <div className="mb-8 text-center">
                        <h3 className="text-2xl font-bold text-slate-900">
                            Popular Questions & Real Guidelines
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Click a question to expand step-by-step instructions
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => {
                            const IconComponent = faq.icon;
                            const isOpen = openIndex === index;
                            return (
                                <div
                                    key={index}
                                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all"
                                >
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50/80"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                                                <IconComponent className="h-5 w-5 text-[#1b2f8a]" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900 md:text-base">
                                                {faq.question}
                                            </span>
                                        </div>
                                        <ChevronDown
                                            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#1b2f8a]' : ''}`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 px-5 pt-1 pb-5 pl-16 text-sm leading-relaxed text-slate-600">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
