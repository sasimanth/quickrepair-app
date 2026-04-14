import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, CheckCircle2, ScanFace, FileSignature, X, Loader2 } from 'lucide-react';
import api from '../services/api';

const VerificationModal = ({ currentStatus, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    // Simulate API delay for facial scan and DB check
    setTimeout(async () => {
      try {
        await api.post('/technicians/verify');
        setStep(3); // Success step
      } catch (err) {
        alert("Verification failed.");
      } finally {
        setLoading(false);
      }
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden relative transform transition-all animate-in zoom-in-95 duration-300">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full z-10 transition-colors">
          <X size={20} />
        </button>

        {step === 1 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <ShieldAlert className="text-indigo-600" size={40} />
              <div className="absolute top-0 right-0 w-5 h-5 bg-amber-400 rounded-full border-4 border-white animate-pulse"></div>
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 mb-2">Identity Verification</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              To build trust and perform jobs on QuickRepair, you must verify your identity. This requires a quick scan of your Government ID and Face.
            </p>

            <div className="space-y-3 mt-4">
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform transform active:scale-95"
              >
                Begin Verification
              </button>
              <button onClick={onClose} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl transition-colors">
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 text-center">
            <div className="relative w-40 h-40 mx-auto mb-6">
              {/* Scan box animation */}
              <div className="absolute inset-0 rounded-3xl border-4 border-indigo-100 overflow-hidden">
                 <div className="w-full h-1 bg-indigo-500 animate-[bounce_2s_infinite]"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                 <ScanFace size={60} strokeWidth={1} />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-2">{loading ? "Scanning Identity..." : "Align face in frame"}</h2>
            <p className="text-slate-500 text-sm font-medium mb-8">
              Powered securely by Stripe Identity Mock
            </p>

            <button 
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <><ScanFace size={20} className="mr-2" /> Start Scan</>}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 text-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <ShieldCheck className="text-emerald-500" size={48} />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                 <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={14} /></div>
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 mb-3">You're Verified!</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              Your background check is approved. A blue verified badge is now displayed on your public profile!
            </p>

            <button 
               onClick={() => { onSuccess(); onClose(); }}
               className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerificationModal;
