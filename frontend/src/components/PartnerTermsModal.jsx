import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, AlertTriangle, IndianRupee } from 'lucide-react';

const PartnerTermsModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative font-sans text-slate-900">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">Fixvo Partner Terms & Policy</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Technician earnings, guidelines & service standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-all cursor-pointer shadow-xs shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-left">
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900">
            <IndianRupee size={24} className="text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider">90% Net Share Guarantee</h4>
              <p className="text-xs font-semibold text-emerald-800 mt-0.5">You keep 90% of all labor charges and quotes. Platform fee is only 10%.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Partner Operating Rules</h4>
            <div className="space-y-2.5 text-xs font-semibold text-slate-700">
              {[
                { title: 'Itemized Digital Quotes Only', desc: 'All spare parts and labor estimates must be submitted through the app. Verbal side-negotiations are strictly forbidden.' },
                { title: 'Zero Off-Platform Solicitations', desc: 'Soliciting direct cash jobs outside the platform leads to immediate account suspension and forfeiture of payout balance.' },
                { title: 'Punctuality & SLA Standard', desc: 'Arrive at the customer doorstep within the committed 30-minute window after accepting an order.' },
                { title: '30-Day Workmanship Quality', desc: 'If a customer reports an unresolved defect within 30 days, partner agrees to provide a free diagnostic visit.' }
              ].map((rule, idx) => (
                <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-900 font-extrabold">
                    <CheckCircle2 size={15} className="text-indigo-600 shrink-0" />
                    <span>{rule.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium pl-5">{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 font-semibold flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>Maintain your partner rating score above 4.2 stars to remain eligible for VIP auto-assignment and instant daily bank payouts.</p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-600" /> Verified Partner Policy</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs cursor-pointer border-none shadow-xs"
          >
            I Agree & Accept
          </button>
        </div>

      </div>
    </div>
  );
};

export default PartnerTermsModal;
