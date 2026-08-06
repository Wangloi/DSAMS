import { HelpCircle, FileText, Mail, MessageSquare, ChevronDown, Users, CheckCircle2, ShieldAlert, QrCode, ClipboardList, PackageSearch, UserCheck } from 'lucide-react';
import { useState } from 'react';

export default function LandingHelp() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      icon: ClipboardList,
      question: "How do I request an Admission Slip (Class Re-entry Clearance)?",
      answer: "If you were absent or tardy, go to your Student Dashboard and click on 'Admission Slips'. Fill out the reason for absence, upload supporting documents (e.g., medical certificate), and submit. Once approved by the Office of Student Affairs (DSA), your digital slip will be generated for presentation to your instructors."
    },
    {
      icon: QrCode,
      question: "How does Dynamic QR Event Attendance scanning work?",
      answer: "During school events or activities, open your Student Portal on your mobile device and navigate to 'Scan Attendance' or present your Student Dynamic QR. The event coordinator or scanner portal will scan your QR code for instant check-in and check-out tracking."
    },
    {
      icon: ShieldAlert,
      question: "How are Disciplinary Cases and Incident Reports handled?",
      answer: "Incident reports regarding handbook violations can be submitted or logged by school personnel. Students involved can view active case statuses, sanction details (such as community service hours), and resolution notes directly under the 'Violations & Discipline' tab."
    },
    {
      icon: UserCheck,
      question: "How do I evaluate an event and download my Certificate?",
      answer: "After attending a recognized campus event, navigate to 'Event Evaluations' in your portal. Complete the required feedback survey for the event. Once submitted, your Certificate of Participation will automatically become available for download."
    },
    {
      icon: HelpCircle,
      question: "How do I log in or reset a forgotten password?",
      answer: "Students can log in using their Student ID Number or registered Email. If you forgot your password, click the 'Forgot Password?' link on the Sign In page to receive a password reset link in your email inbox."
    },
    {
      icon: Users,
      question: "Who should I contact if I encounter technical issues?",
      answer:
        "If you experience technical problems, contact the Office of Student Affairs or the system administrator through the 'Contact Support' section of the portal."
    }
  ];

  return (
    <section id="help" className="py-20 bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#23509A] bg-blue-100/80 px-3.5 py-1.5 rounded-full inline-block mb-3">
            System Knowledge & FAQs
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Frequently Asked Questions & Guidelines
          </h2>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            Official guidelines and solutions for Student Affairs features, admission clearances, QR attendance, and discipline tracking.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {/* FAQ Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <HelpCircle className="w-6 h-6 text-[#23509A]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">System Guides</h3>
            <p className="text-slate-600 text-sm mb-6">
              Learn how to navigate your Student Dashboard, request clearances, and check attendance.
            </p>
            <a href="#faq" className="text-[#23509A] font-semibold text-sm hover:underline inline-flex items-center gap-1.5">
              Read FAQs <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          {/* Documentation Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <FileText className="w-6 h-6 text-[#000D6A]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Student Handbook</h3>
            <p className="text-slate-600 text-sm mb-6">
              Review campus policies, attendance guidelines, and code of conduct rules.
            </p>
            <a href="/login" className="text-[#000D6A] font-semibold text-sm hover:underline inline-flex items-center gap-1.5">
              Student Portal <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          {/* Support Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">DSA Office Help</h3>
            <p className="text-slate-600 text-sm mb-6">
              Need personalized assistance? Contact the Office of Student Affairs support team.
            </p>
            <a href="mailto:dsa@srcb.edu.ph" className="text-sky-600 font-semibold text-sm hover:underline inline-flex items-center gap-1.5">
              Contact Support <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Accordion FAQ Section */}
        <div className="max-w-3xl mx-auto" id="faq">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900">Popular Questions & Real Guidelines</h3>
            <p className="text-sm text-slate-500 mt-1">Click a question to expand step-by-step instructions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const IconComponent = faq.icon;
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <IconComponent className="w-5 h-5 text-[#1b2f8a]" />
                      </div>
                      <span className="font-semibold text-slate-900 text-sm md:text-base">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#1b2f8a]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-slate-600 text-sm border-t border-slate-100 bg-slate-50/50 leading-relaxed pl-16">
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
