import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Loader2, ArrowRight, Check } from 'lucide-react';
import api from '../services/api';

const PremiumModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(true);
  const [step, setStep] = useState('info'); // 'info' | 'payment_gateway' | 'success'
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'net'

  const handleOpenGateway = () => {
    setStep('payment_gateway');
  };

  const handleSubscribe = async () => {
    setLoading(true);
    // Simulated Razorpay integration latency
    setTimeout(async () => {
      try {
        const planName = isYearly ? 'yearly' : 'monthly';
        const res = await api.post('/users/premium', { plan: planName });
        setLoading(false);
        setStep('success');
        setTimeout(() => {
          onSuccess(res.data);
        }, 2500);
      } catch (err) {
        alert('Payment processing failed. Please try again.');
        setLoading(false);
        setStep('info');
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
      <div className="bg-[#111827] border border-amber-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] relative animate-in fade-in zoom-in duration-300 text-white">
        
        {step !== 'payment_gateway' && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all z-10"
          >
            <X size={16} />
          </button>
        )}

        {step === 'info' && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-b from-amber-500/20 to-transparent p-8 text-center relative overflow-hidden border-b border-white/5">
              <div className="absolute top-[-25%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[50px] pointer-events-none"></div>
              <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <Sparkles size={32} className="text-[#0B0F19] animate-pulse" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-1.5 tracking-tight">Fixvo Plus</h2>
              <p className="text-amber-400/90 text-xs font-bold uppercase tracking-widest">Premium Service Membership</p>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Plan Toggle */}
              <div className="flex justify-center">
                <div className="bg-slate-900 border border-white/5 p-1 rounded-full flex items-center gap-1">
                  <button 
                    onClick={() => setIsYearly(false)}
                    className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${!isYearly ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    Monthly (₹49)
                  </button>
                  <button 
                    onClick={() => setIsYearly(true)}
                    className={`px-4 py-2 text-xs font-bold rounded-full flex items-center gap-1 transition-all ${isYearly ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    Yearly (₹499)
                    <span className="bg-[#111827] text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full border border-amber-400/30">Save 15%</span>
                  </button>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                {[
                  { title: "Priority Dispatch", desc: "Skip the booking queue; instant technician routing." },
                  { title: "Zero Inspection Fees", desc: "Never pay the ₹99 diagnostic charge on bookings." },
                  { title: "15% Extra Member Discount", desc: "Save flat 15% on all quotes, repairs, and spare parts." },
                  { title: "Dedicated Support Panel", desc: "Access 24/7 VIP chat support for complex household faults." }
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <CheckCircle2 size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{b.title}</h4>
                      <p className="text-slate-400 text-xs mt-0.5 font-medium">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Callout */}
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-extrabold text-sm text-slate-200">{isYearly ? 'Yearly Membership' : 'Monthly Membership'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Billed automatically. Cancel anytime.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">₹{isYearly ? '499' : '49'}</p>
                  <p className="text-[10px] text-slate-400 font-bold">GST Inclusive</p>
                </div>
              </div>

              <button 
                onClick={handleOpenGateway}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-[#0B0F19] font-black py-4 rounded-2xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.01] transition-all duration-300 flex justify-center items-center gap-2 text-sm sm:text-base outline-none cursor-pointer"
              >
                <span>Activate Fixvo Plus</span>
                <ArrowRight size={18} />
              </button>

              <p className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider">
                <ShieldCheck size={14} className="text-emerald-400" /> Secure 256-Bit SSL Encrypted Transactions
              </p>
            </div>
          </>
        )}

        {step === 'payment_gateway' && (
          <div className="p-8 space-y-6">
            {/* Mock Razorpay Interface */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase text-white tracking-widest shadow-inner">Razorpay</div>
                <span className="text-slate-400 text-xs font-bold">Secure Checkout</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Amount to pay</p>
                <p className="text-base font-black text-white">₹{isYearly ? '499' : '49'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Select Payment Method</p>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'upi', label: '📱 UPI / QR', desc: 'GPay, PhonePe' },
                  { id: 'card', label: '💳 Card', desc: 'Visa, Master' },
                  { id: 'net', label: '🏦 Netbank', desc: 'SBI, HDFC' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${selectedMethod === m.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-slate-900/60 hover:bg-slate-900'}`}
                  >
                    <p className="text-xs font-bold text-white">{m.label}</p>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>

              {selectedMethod === 'upi' && (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Enter UPI ID</label>
                  <input 
                    type="text" 
                    defaultValue="success@razorpay" 
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-slate-300 outline-none text-sm font-semibold cursor-not-allowed opacity-80" 
                  />
                  <p className="text-[10px] text-slate-500 font-medium">Proceeding will simulate verification of this UPI handle.</p>
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Credit / Debit Card</p>
                  <div className="space-y-2">
                    <input type="text" placeholder="Card Number" defaultValue="4111 2222 3333 4444" disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/5 text-slate-500 outline-none text-xs font-medium" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Expiry" defaultValue="12/29" disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/5 text-slate-500 outline-none text-xs font-medium" />
                      <input type="password" placeholder="CVV" defaultValue="123" disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/5 text-slate-500 outline-none text-xs font-medium" />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'net' && (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Popular Banks</p>
                  <select disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/5 text-slate-500 outline-none text-xs font-medium appearance-none">
                    <option>State Bank of India</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setStep('info')} 
                disabled={loading}
                className="flex-1 border border-white/10 hover:bg-white/5 text-slate-300 font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs sm:text-sm uppercase tracking-wider outline-none disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={handleSubscribe} 
                disabled={loading}
                className="flex-2 bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98] outline-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>Pay Now (Razorpay Secure)</span>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-10 text-center space-y-6 flex flex-col items-center justify-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-bounce">
              <Check size={40} className="stroke-[3]" />
            </div>
            
            <div>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">Welcome to Plus!</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Your premium Fixvo Plus subscription is now fully active.<br />Enjoy priority dispatch and standard free inspections!
              </p>
            </div>

            <div className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">
              🚀 Redirecting to dashboard...
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PremiumModal;
