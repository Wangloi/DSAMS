import { HelpCircle, FileText, Mail, MessageSquare } from 'lucide-react';

export default function LandingHelp() {
  return (
    <section id="help" className="py-20 bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            How can we help you?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find answers, documentation, and get in touch with our support team.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* FAQ Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <HelpCircle className="w-6 h-6 text-[#23509A]" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">FAQs</h3>
            <p className="text-slate-600 mb-6 line-clamp-3">
              Browse our frequently asked questions to find quick answers about account setup, system features, and policies.
            </p>
            <a href="#faq" className="text-[#23509A] font-medium hover:text-[#000D6A] inline-flex items-center gap-2">
              Browse FAQs <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          {/* Documentation Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <FileText className="w-6 h-6 text-[#000D6A]" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Documentation</h3>
            <p className="text-slate-600 mb-6 line-clamp-3">
              Detailed guides and manuals on how to use OSAMS effectively for students, admins, and staff.
            </p>
            <a href="#docs" className="text-[#000D6A] font-medium hover:text-[#23509A] inline-flex items-center gap-2">
              Read Docs <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          {/* Support Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-sky-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Contact Support</h3>
            <p className="text-slate-600 mb-6 line-clamp-3">
              Can't find what you're looking for? Our dedicated support team is here to assist you.
            </p>
            <a href="mailto:support@osams.edu" className="text-sky-600 font-medium hover:text-sky-700 inline-flex items-center gap-2">
              Email Us <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Quick FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto" id="faq">
          <h3 className="text-2xl font-bold text-center text-slate-900 mb-10">Popular Questions</h3>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h4 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                How do I reset my password?
              </h4>
              <p className="text-slate-600 pl-7">
                You can reset your password by clicking on the "Forgot Password" link on the login page. An email with reset instructions will be sent to your registered email address.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h4 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                Where can I view my event attendance?
              </h4>
              <p className="text-slate-600 pl-7">
                Log into your student portal and navigate to the "Events" or "Attendance" tab on your dashboard. You will see a complete history of events you've attended.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
