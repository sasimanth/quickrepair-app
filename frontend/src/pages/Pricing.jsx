import React from 'react';
import { Check } from 'lucide-react';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm uppercase tracking-widest mb-6 border border-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span> Fixvo Plus Membership
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Never pay inspection fees again.</h1>
          <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
            Get year-round protection, priority support, and VIP technician matching for your home.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
          {/* Decorative background blur */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex-1 w-full relative z-10">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Membership Benefits</h3>
            <ul className="space-y-5 text-slate-600 font-medium">
              <li className="flex items-start gap-4"><div className="p-1 rounded-full bg-emerald-100 text-emerald-600 mt-0.5"><Check size={16} /></div> <span><strong className="text-slate-900">100% Waived</strong> Inspection Fees on all bookings</span></li>
              <li className="flex items-start gap-4"><div className="p-1 rounded-full bg-emerald-100 text-emerald-600 mt-0.5"><Check size={16} /></div> <span><strong className="text-slate-900">Priority matching</strong> with top-rated technicians</span></li>
              <li className="flex items-start gap-4"><div className="p-1 rounded-full bg-emerald-100 text-emerald-600 mt-0.5"><Check size={16} /></div> <span><strong className="text-slate-900">1 Free Annual</strong> AC or Water Purifier Servicing</span></li>
              <li className="flex items-start gap-4"><div className="p-1 rounded-full bg-emerald-100 text-emerald-600 mt-0.5"><Check size={16} /></div> <span><strong className="text-slate-900">Extended 90-Day</strong> Workmanship Warranty</span></li>
            </ul>
          </div>
          
          <div className="w-full md:w-80 bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative z-10 text-center transform md:scale-105 transition-transform hover:scale-110 duration-300">
            <div className="mb-2">
              <span className="text-5xl font-black text-white">₹999</span>
            </div>
            <p className="text-slate-400 font-medium mb-8 text-sm uppercase tracking-widest">Billed Annually</p>
            
            <button 
              onClick={() => alert('Razorpay payment gateway integration will trigger here.')}
              className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all mb-4"
            >
              Get Fixvo Plus
            </button>
            <p className="text-xs text-slate-500 font-medium">Secure checkout powered by Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
