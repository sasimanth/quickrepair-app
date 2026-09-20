import React from 'react';
import { X, ShieldCheck, MapPin, PhoneCall, Mail, Award, CheckCircle2, Heart } from 'lucide-react';

const AboutFixvoModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative font-sans text-slate-900">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-600/20 shrink-0">
              F
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">About Fixvo</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">India's Trusted On-Demand Doorstep Repair Network</p>
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
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-left">
          
          {/* Mission Hero */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-5 space-y-2 shadow-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-400/20 px-2.5 py-0.5 rounded-full">
              Our Mission
            </span>
            <h4 className="text-base font-black leading-snug">Empowering households with instant, verified & affordable home repair services.</h4>
            <p className="text-xs text-slate-300 font-medium leading-relaxed pt-1">
              Fixvo connects customers with top-rated local technicians within 15 minutes. We eliminate price gouging with transparent digital quotes and guaranteed 30-day labor protection.
            </p>
          </div>

          {/* Core Guarantees */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">The Fixvo Protection Promise</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: '30-Day Free Warranty', desc: 'Complimentary rework guarantee on all completed repair jobs.' },
                { title: 'Verified Pro Technicians', desc: 'Comprehensive KYC & police background-checked specialists.' },
                { title: 'Upfront Quote Approval', desc: 'Never pay extra. Review itemized quotes before work begins.' },
                { title: '90% Tech Partner Share', desc: 'Supporting local technicians with fair earnings & insurance.' }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-normal">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Hub Coverage */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
              <MapPin size={16} className="text-blue-600" />
              <span>Active Regional Hubs</span>
            </div>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Serving Madanapalle, Angallu, Kadiri, Rayachoty, Galiveedu, Kurabalakota and surrounding Annamayya & Sri Sathya Sai regions.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Customer Support & Headquarters</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <a href="tel:+919515980170" className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 no-underline hover:bg-slate-100">
                <PhoneCall size={16} className="text-emerald-600" /> +91 95159 80170
              </a>
              <a href="mailto:support@fixvo.in" className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 no-underline hover:bg-slate-100">
                <Mail size={16} className="text-blue-600" /> support@fixvo.in
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1">Made with <Heart size={13} className="text-rose-500 fill-rose-500" /> for India</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs cursor-pointer border-none shadow-xs"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};

export default AboutFixvoModal;
