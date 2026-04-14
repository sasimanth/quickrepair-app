import React from 'react';
import { Check } from 'lucide-react';

const Pricing = () => {
  return (
    <div className="container mx-auto px-4 py-20 max-w-6xl flex-grow">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Transparent Pricing, Zero Surprises</h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
          We believe in upfront costs. Choose the service model that fits your urgent needs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        {/* Standard Inspection */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-lg relative flex flex-col transition-transform hover:-translate-y-1">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Standard Inspection</h3>
            <p className="text-slate-500 font-medium">Perfect when you don't know what's broken.</p>
          </div>
          <div className="mb-8">
            <span className="text-5xl font-extrabold text-slate-900">$15</span>
            <span className="text-slate-500 font-medium ml-2">base fee</span>
          </div>
          <ul className="space-y-4 mb-8 flex-grow text-slate-600 font-medium">
            <li className="flex items-start gap-3"><Check className="text-emerald-500 mt-1 shrink-0" size={20} /> <span>Professional Diagnosis and fault detection</span></li>
            <li className="flex items-start gap-3"><Check className="text-emerald-500 mt-1 shrink-0" size={20} /> <span>Guaranteed Arrival under 2 hours</span></li>
            <li className="flex items-start gap-3"><Check className="text-emerald-500 mt-1 shrink-0" size={20} /> <span>Detailed Repair Estimate provided on-site</span></li>
            <li className="flex items-start gap-3 text-slate-400 italic"><span>Parts &amp; Labor for the actual fix are billed separately after quote approval</span></li>
          </ul>
          <button className="w-full py-4 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">
            Start with Inspection
          </button>
        </div>

        {/* Direct Repair */}
        <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative flex flex-col transform md:-translate-y-4 hover:-translate-y-5 transition-transform">
          <div className="absolute top-0 right-8 transform -translate-y-1/2">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">Most Popular</span>
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Direct Repair</h3>
            <p className="text-slate-400 font-medium">You know the issue, we just fix it instantly.</p>
          </div>
          <div className="mb-8 block">
            <span className="text-5xl font-extrabold text-white">Starts at $49</span>
          </div>
          <ul className="space-y-4 mb-8 flex-grow text-slate-300 font-medium">
            <li className="flex items-start gap-3"><Check className="text-indigo-400 mt-1 shrink-0" size={20} /> <span>Inspection fee is waived entirely</span></li>
            <li className="flex items-start gap-3"><Check className="text-indigo-400 mt-1 shrink-0" size={20} /> <span>Technician arrives equipped with common parts</span></li>
            <li className="flex items-start gap-3"><Check className="text-indigo-400 mt-1 shrink-0" size={20} /> <span>Protected by 30-Day Workmanship Warranty</span></li>
            <li className="flex items-start gap-3"><Check className="text-indigo-400 mt-1 shrink-0" size={20} /> <span>Secure 256-bit Checkout via Stripe/Razorpay</span></li>
          </ul>
          <button className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
            Book Direct Repair
          </button>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-[2rem] p-10 border border-slate-800 shadow-xl max-w-4xl mx-auto mt-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        
        <div className="flex-1 relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-widest mb-4 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> Subscription Tier
          </div>
          <h3 className="text-3xl font-extrabold text-white mb-2">QuickRepair <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Prime</span></h3>
          <p className="text-slate-400 font-medium">Protect your home year-round. Get VIP matching and completely waived inspection fees.</p>
        </div>
        
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 w-full md:w-auto">
          <div className="text-center md:text-left mb-6">
            <span className="text-4xl font-black text-white">$99</span>
            <span className="text-slate-400 font-medium ml-1">/year</span>
          </div>
          <ul className="space-y-3 mb-6 flex-grow text-slate-300 text-sm font-medium">
            <li className="flex items-center gap-2"><Check className="text-indigo-400" size={16} /> <span className="text-white font-bold">100% Waived</span> Inspection Fees</li>
            <li className="flex items-center gap-2"><Check className="text-indigo-400" size={16} /> Priority technician matching</li>
            <li className="flex items-center gap-2"><Check className="text-indigo-400" size={16} /> 1 Free Annual AC Servicing</li>
          </ul>
          <button className="w-full py-3 rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-lg">
            Join Prime Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
