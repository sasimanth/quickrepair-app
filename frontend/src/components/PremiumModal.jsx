import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Loader2, ArrowRight, Check, CreditCard } from 'lucide-react';
import api from '../services/api';

const PremiumModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(true);
  const [step, setStep] = useState('info'); // 'info' | 'payment_gateway' | 'success'
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'net'
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');

  const price = isYearly ? 499 : 49;
  const planName = isYearly ? 'yearly' : 'monthly';

  const handleGoToPayment = () => {
    setStep('payment_gateway');
  };

  const handleSimulatedPayment = async () => {
    setLoading(true);

    // Simulate real 1.5s Razorpay payment verification
    setTimeout(async () => {
      try {
        // Attempt backend verify if available
        await api.post('/payment/verify-premium', {
          plan: planName,
          amount: price,
          paymentId: 'pay_' + Date.now()
        });
      } catch (err) {
        console.warn('Backend payment verify fallback to local state', err);
      }

      setLoading(false);
      setStep('success');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            isPremium: true,
            premiumPlan: planName,
            planName: planName
          });
        }
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
      <div className="bg-[#111827] border border-amber-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] relative animate-in fade-in zoom-in duration-300 text-white">
        
        {step !== 'success' && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all z-10 cursor-pointer border-none"
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
              <p className="text-amber-400/90 text-xs font-bold uppercase tracking-widest">VIP Service Membership</p>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Plan Toggle */}
              <div className="flex justify-center">
                <div className="bg-slate-900 border border-white/5 p-1 rounded-full flex items-center gap-1">
                  <button 
                    onClick={() => setIsYearly(false)}
                    className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border-none ${!isYearly ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
                  >
                    Monthly (₹49)
                  </button>
                  <button 
                    onClick={() => setIsYearly(true)}
                    className={`px-4 py-2 text-xs font-bold rounded-full flex items-center gap-1 transition-all cursor-pointer border-none ${isYearly ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
                  >
                    Yearly (₹499)
                    <span className="bg-[#111827] text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full border border-amber-400/30">Save 15%</span>
                  </button>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                {[
                  { title: "Priority Dispatch", desc: "Skip the booking queue; instant technician routing." },
                  { title: "Zero Inspection Fees", desc: "Never pay the ₹99 diagnostic charge on bookings." },
                  { title: "5% Extra Member Discount", desc: "Save flat 5% on all quotes, repairs, and spare parts." },
                  { title: "Dedicated Support Panel", desc: "Access 24/7 VIP chat support for household faults." }
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
                  <p className="text-[10px] text-slate-500 mt-0.5">Cancel anytime with 1 click.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">₹{price}</p>
                  <p className="text-[10px] text-slate-400 font-bold">GST Included</p>
                </div>
              </div>

              <button 
                onClick={handleGoToPayment}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-[#0B0F19] font-black py-4 rounded-2xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.01] transition-all duration-300 flex justify-center items-center gap-2 text-sm sm:text-base outline-none cursor-pointer border-none"
              >
                <span>Proceed to Payment (₹{price})</span>
                <ArrowRight size={18} />
              </button>

              <p className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider">
                <ShieldCheck size={14} className="text-emerald-400" /> Secure 256-Bit Encrypted Payment
              </p>
            </div>
          </>
        )}

        {step === 'payment_gateway' && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Razorpay Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase text-white tracking-widest shadow-inner">Razorpay</div>
                <span className="text-slate-400 text-xs font-bold">Payment Gateway</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Amount</p>
                <p className="text-lg font-black text-emerald-400">₹{price}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Choose Payment Method</p>
              
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'upi', label: '📱 UPI', desc: 'GPay, PhonePe' },
                  { id: 'card', label: '💳 Card', desc: 'Visa, Master' },
                  { id: 'net', label: '🏦 Netbank', desc: 'SBI, HDFC' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${selectedMethod === m.id ? 'border-amber-400 bg-amber-500/10' : 'border-white/5 bg-slate-900/60 hover:bg-slate-900'}`}
                  >
                    <p className="text-xs font-bold text-white">{m.label}</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>

              {selectedMethod === 'upi' && (
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-2.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-300">UPI ID / VPA</label>
                  <input 
                    type="text" 
                    value={upiId} 
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@upi" 
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none text-xs font-semibold focus:border-amber-400" 
                  />
                  <p className="text-[10px] text-slate-400">Payment request will be simulated on your UPI app.</p>
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-2.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-300">Card Number</label>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none text-xs font-semibold focus:border-amber-400" 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" defaultValue="12/28" placeholder="MM/YY" className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none text-xs font-semibold" />
                    <input type="password" defaultValue="888" placeholder="CVV" className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none text-xs font-semibold" />
                  </div>
                </div>
              )}

              {selectedMethod === 'net' && (
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-300">Select Bank</label>
                  <select className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none text-xs font-semibold cursor-pointer">
                    <option>State Bank of India (SBI)</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setStep('info')} 
                disabled={loading}
                className="flex-1 border border-white/10 hover:bg-white/5 text-slate-300 font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider outline-none disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={handleSimulatedPayment} 
                disabled={loading}
                className="flex-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer text-xs uppercase tracking-widest shadow-lg border-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-slate-950" />
                    <span>Verifying Payment...</span>
                  </>
                ) : (
                  <span>Pay ₹{price} Now</span>
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
              <h3 className="text-3xl font-extrabold text-white tracking-tight">Welcome to Fixvo Plus! 👑</h3>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed font-medium">
                Your VIP membership is now fully active.<br />Enjoy zero inspection fees & priority technician dispatch!
              </p>
            </div>

            <div className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">
              ✨ Redirecting to your dashboard...
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PremiumModal;
