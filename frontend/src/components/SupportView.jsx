import React, { useState } from 'react';
import { HelpCircle, ChevronRight, ChevronDown, Plus, Mail, MessageCircle, Phone, X, AlertCircle } from 'lucide-react';

const SupportView = ({
  supportTickets,
  ticketForm,
  setTicketForm,
  showTicketForm,
  setShowTicketForm,
  handleRaiseTicket
}) => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: "How do I book a service?", a: "Go to your dashboard, click 'Book Repair' (or 'Book Now' quick action card), fill in the device details, select your town/area, upload a photo of the issue if you wish, and choose a nearby technician to send a direct request." },
    { q: "What is Fixvo Plus?", a: "Fixvo Plus is a premium membership program. Members receive priority technician dispatch, zero inspection visit fees (saving ₹99 per visit), and a flat 5% discount on all final repair quotes." },
    { q: "How do quotes and payments work?", a: "When you select an Inspection Visit, the technician visits your location to diagnose the issue. They submit a detailed invoice proposal (service, parts, travel). Once you approve the quote, the work starts. You can pay online securely using Stripe/Razorpay or choose Cash after the service completes." },
    { q: "Can I cancel a booking request?", a: "Yes. You can cancel a booking request at any time before the technician starts inspection. Simply open the details of your active booking card and click 'Cancel Booking', providing a cancellation reason." }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <HelpCircle className="text-indigo-400" /> Help & Support
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Browse FAQs or raise a support query ticket</p>
        </div>
        <button
          onClick={() => setShowTicketForm(!showTicketForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/15 cursor-pointer border-none outline-none"
        >
          {showTicketForm ? <X size={14} /> : <Plus size={14} />}
          {showTicketForm ? 'Cancel' : 'Raise Ticket'}
        </button>
      </div>

      {showTicketForm && (
        <form onSubmit={handleRaiseTicket} className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <h3 className="font-extrabold text-sm text-slate-200">Submit Support Ticket</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Category</label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none font-semibold text-white text-xs focus:border-indigo-500"
              >
                <option value="Booking">📅 Booking Query</option>
                <option value="Payment">💳 Billing & Payment</option>
                <option value="Account">👤 Account & Profile</option>
                <option value="Other">📍 General Enquiry</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Subject</label>
              <input
                required
                type="text"
                placeholder="e.g. Booking not accepted"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none font-semibold text-white text-xs focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Message Description</label>
            <textarea
              required
              rows={3}
              placeholder="Tell us what you need help with..."
              value={ticketForm.message}
              onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
              className="w-full p-4 bg-slate-950 border border-white/10 rounded-xl outline-none font-semibold text-white text-xs focus:border-indigo-500 resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-none outline-none"
          >
            Submit Ticket
          </button>
        </form>
      )}

      {/* Ticket History */}
      {supportTickets.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-extrabold text-sm text-slate-350 uppercase tracking-wider">Your Support Tickets</h3>
          <div className="space-y-2 bg-slate-900/20 border border-white/5 rounded-2xl p-4 divide-y divide-white/5">
            {supportTickets.map((tkt) => (
              <div key={tkt.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                    {tkt.category}
                  </span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                    {tkt.status}
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs sm:text-sm mt-1">{tkt.subject}</h4>
                <p className="text-xs text-slate-550 italic mt-1">"{tkt.message}"</p>
                <span className="text-[8px] text-slate-500 font-bold block mt-1.5">{new Date(tkt.date).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <a
          href="https://wa.me/918919733305"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col items-center text-center justify-between min-h-[140px] text-slate-300 no-underline cursor-pointer group"
        >
          <MessageCircle size={28} className="text-[#25D366] group-hover:scale-110 transition-transform" />
          <div>
            <h4 className="font-extrabold text-white text-xs tracking-tight">WhatsApp Chat</h4>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Instant message support</p>
          </div>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Chat Now</span>
        </a>

        <a
          href="tel:+918919733305"
          className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col items-center text-center justify-between min-h-[140px] text-slate-300 no-underline cursor-pointer group"
        >
          <Phone size={28} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <div>
            <h4 className="font-extrabold text-white text-xs tracking-tight">Call Support</h4>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Direct callback support</p>
          </div>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Call Now</span>
        </a>

        <a
          href="mailto:support@fixvo.com"
          className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col items-center text-center justify-between min-h-[140px] text-slate-300 no-underline cursor-pointer group"
        >
          <Mail size={28} className="text-indigo-400 group-hover:scale-110 transition-transform" />
          <div>
            <h4 className="font-extrabold text-white text-xs tracking-tight">Email Help</h4>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Response in 24 hours</p>
          </div>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Send Email</span>
        </a>
      </div>

      {/* FAQ Drawer */}
      <div className="space-y-3 pt-4">
        <h3 className="font-extrabold text-sm text-slate-300 tracking-tight uppercase tracking-wider">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-5 py-4 flex justify-between items-center text-left text-xs sm:text-sm font-extrabold text-slate-200 outline-none hover:bg-slate-900/20 cursor-pointer border-none bg-transparent"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-400 font-medium leading-relaxed border-t border-white/5/10 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportView;
