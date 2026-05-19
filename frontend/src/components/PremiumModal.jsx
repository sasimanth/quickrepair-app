import { useState } from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const PremiumModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    // Mock Razorpay Integration
    setTimeout(async () => {
      try {
        const res = await api.post('/users/premium', { plan: 'yearly' });
        onSuccess(res.data);
      } catch (err) {
        alert('Payment failed. Please try again.');
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1 transition-colors z-10">
          <X size={20} />
        </button>

        <div className="bg-[#0B0F19] p-8 text-center relative overflow-hidden">
           <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-[40px] pointer-events-none"></div>
           <Sparkles size={48} className="text-amber-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
           <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Fixvo Plus</h2>
           <p className="text-slate-300 text-sm">Elevate your home service experience.</p>
        </div>

        <div className="p-8">
           <div className="space-y-4 mb-8">
             <div className="flex items-start gap-3">
               <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
               <p className="text-slate-700 text-sm font-medium"><strong>Priority Dispatch:</strong> Skip the queue every time.</p>
             </div>
             <div className="flex items-start gap-3">
               <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
               <p className="text-slate-700 text-sm font-medium"><strong>Zero Inspection Fees:</strong> Never pay ₹99 just to get a quote.</p>
             </div>
             <div className="flex items-start gap-3">
               <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
               <p className="text-slate-700 text-sm font-medium"><strong>15% Exclusive Discount:</strong> Automatic savings on all repair quotes and parts.</p>
             </div>
           </div>

           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Yearly Plan</p>
                <p className="text-xs text-slate-500 mt-1">Billed annually. Cancel anytime.</p>
              </div>
              <p className="text-2xl font-black text-slate-900">₹499</p>
           </div>

           <button 
             onClick={handleSubscribe} 
             disabled={loading}
             className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0B0F19] font-black py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-300 transform hover:-translate-y-1 flex justify-center items-center gap-2"
           >
             {loading ? <span className="animate-pulse">Processing Payment...</span> : 'Subscribe Now with Razorpay'}
           </button>
           <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Secure 256-bit encryption
           </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
