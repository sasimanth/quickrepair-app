import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import { Check, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGetPlus = () => {
    if (user) {
      navigate('/dashboard?action=premium');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs uppercase tracking-widest mb-6 border border-amber-200">
            <Sparkles size={14} className="text-amber-600 animate-pulse" /> Fixvo Plus Membership
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Never pay inspection fees again.</h1>
          <p className="text-base sm:text-lg text-slate-500 font-semibold max-w-xl mx-auto">
            Get year-round protection, priority technician dispatch, zero visit fees, and VIP service guarantees for your home.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-200 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex-1 w-full relative z-10 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">Exclusive Membership Benefits</h3>
            <ul className="space-y-4 text-slate-700 font-semibold text-sm">
              <li className="flex items-start gap-4">
                <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0"><Check size={16} /></div> 
                <span><strong className="text-slate-900">100% Waived Inspection Fees</strong> on all repair & installation bookings</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0"><Check size={16} /></div> 
                <span><strong className="text-slate-900">Priority Dispatch</strong> matching top-rated 4.9★ verified technicians</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0"><Check size={16} /></div> 
                <span><strong className="text-slate-900">Exclusive 5% Discount</strong> auto-applied to all labor & spare part quotes</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0"><Check size={16} /></div> 
                <span><strong className="text-slate-900">Extended 90-Day</strong> Fixvo Workmanship Warranty & Replacement Protection</span>
              </li>
            </ul>
          </div>
          
          <div className="w-full md:w-80 bg-slate-900 text-white rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative z-10 text-center transform md:scale-105 transition-transform hover:scale-110 duration-300">
            <div className="mb-2">
              <span className="text-5xl font-black text-white">₹999</span>
              <span className="text-xs text-slate-400 font-bold block mt-1 uppercase tracking-widest">Billed Annually</span>
            </div>
            
            <button 
              onClick={handleGetPlus}
              className="w-full mt-6 py-4 rounded-xl font-extrabold text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 shadow-lg shadow-amber-500/20 transition-all cursor-pointer border-none"
            >
              Get Fixvo Plus
            </button>
            <p className="text-[11px] text-slate-400 font-semibold mt-4">Instant activation on your account</p>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            navigate('/dashboard?action=premium');
          }}
        />
      )}
    </div>
  );
};

export default Pricing;
