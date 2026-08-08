import React, { useState } from 'react';
import { HelpCircle, Search, MessageCircle, Phone, ChevronDown, Wrench, CreditCard, Shield, RefreshCw, AlertTriangle, FileText, User } from 'lucide-react';

const HelpSupportView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const topics = [
    { icon: Wrench, title: 'Booking & Repair', desc: 'Scheduling visits, technician status' },
    { icon: CreditCard, title: 'Payments & Billing', desc: 'Payment options, wallet, invoices' },
    { icon: User, title: 'Technician Matching', desc: 'Verification, ratings, background checks' },
    { icon: RefreshCw, title: 'Cancellation & Reschedule', desc: 'Free cancellations, timing rules' },
    { icon: FileText, title: 'Refunds & Quotes', desc: 'Diagnostic visit fees, quote approvals' },
    { icon: Shield, title: 'Safety & Trust', desc: 'Police verification, safety standards' }
  ];

  const faqs = [
    {
      q: 'How does the ₹99 diagnostic inspection fee work?',
      a: 'The ₹99 fee covers the technician arriving at your location and thoroughly diagnosing the problem. If you proceed with the repair quote, the diagnostic fee is credited or waived. Fixvo Plus members get 100% free inspections.'
    },
    {
      q: 'Can I cancel or reschedule my service request?',
      a: 'Yes! You can cancel or reschedule your booking free of charge anytime before the technician is dispatched to your address.'
    },
    {
      q: 'How are technicians verified on Fixvo?',
      a: 'All technicians on Fixvo undergo police background checks, government ID verification, and skill certification tests before being activated on our platform.'
    },
    {
      q: 'What payment methods are supported?',
      a: 'We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, Net Banking, Fixvo Wallet balance, and Cash on Service.'
    },
    {
      q: 'What if I am unhappy with the service provided?',
      a: 'All Fixvo repairs come with a 30-day service warranty. If an issue recurs within 30 days, we will send a senior specialist to inspect and rectify it free of charge.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <HelpCircle className="text-blue-600" /> Help & Support
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Get instant answers or get in touch with customer care</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search help topics, FAQs, troubleshooting..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
        />
      </div>

      {/* Common Help Topics Grid */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Common Help Topics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {topics.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <div 
                key={i} 
                className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 p-4 rounded-2xl transition-all cursor-pointer shadow-xs flex items-start gap-3"
              >
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">{topic.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{topic.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3 pt-2">
        <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {filteredFaqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-4 font-bold text-xs text-slate-900 flex justify-between items-center gap-3 cursor-pointer border-none bg-transparent"
              >
                <span>{faq.q}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-blue-600' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Emergency Support Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-xs text-slate-900">Need Urgent Assistance?</h4>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">24/7 Priority Emergency Support</p>
          </div>
          <a
            href="tel:+919515980170"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider no-underline shadow-xs cursor-pointer"
          >
            <Phone size={14} /> Call Now
          </a>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-xs text-slate-900">WhatsApp Support</h4>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">Chat live with our support team</p>
          </div>
          <a
            href="https://wa.me/9515980170"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-black uppercase tracking-wider no-underline shadow-xs cursor-pointer"
          >
            <MessageCircle size={14} /> Chat Live
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportView;
