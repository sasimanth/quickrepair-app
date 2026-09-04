import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck, Loader2, Coins, Sparkles, CheckSquare, Square } from 'lucide-react';
import api from '../services/api';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('online'); // 'online' or 'cash'
  const [walletBalance, setWalletBalance] = useState(0);
  const [useFixvoCash, setUseFixvoCash] = useState(false);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data } = await api.get('/users/wallet-balance');
        if (data && data.walletBalance) {
          setWalletBalance(data.walletBalance);
        }
      } catch (e) {
        // Fallback to localStorage user if available
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          if (u.walletBalance) setWalletBalance(u.walletBalance);
        } catch (err) {}
      }
    };
    fetchWallet();
  }, []);
  
  let baseAmount = booking.finalQuote ? booking.finalQuote : (booking.serviceOption === 'inspection' 
    ? (booking.serviceId?.price || 0) + (booking.inspectionFee || 15) 
    : (booking.serviceId?.price || 0));

  if (booking.discountPercentage && booking.discountPercentage > 0) {
    baseAmount = baseAmount - (baseAmount * booking.discountPercentage / 100);
  }

  // Calculate fixvo cash discount
  const maxCashDiscount = Math.min(walletBalance, Math.floor(baseAmount * 0.5)); // Max 50% discount using fixvo cash
  const appliedCashDiscount = useFixvoCash ? maxCashDiscount : 0;
  const amount = Math.max(1, Math.round(baseAmount - appliedCashDiscount));

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setError(null);
    const targetBookingId = booking._id || booking.id;
    try {
      // 0. Ensure Razorpay SDK is loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        });
      }

      // 1. Create order on backend
      const { data: order } = await api.post('/payment/create-order', {
        amount,
        bookingId: targetBookingId
      });
      
      const rzpKey = order.key || order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SdKZzH37k0xhIv';

      // 2. Configure Razorpay options
      const options = {
        key: rzpKey,
        amount: order.amount,
        currency: "INR",
        name: "Fixvo",
        description: `Service Payment - ${booking.serviceName || 'Home Repair'}`,
        order_id: order.id || order.orderId,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const verifyRes = await api.post('/payment/verify', {
              ...response,
              bookingId: targetBookingId
            });
            if (verifyRes.data.success) {
              onSuccess();
            } else {
              setError(verifyRes.data.message || "Payment verification failed.");
            }
          } catch(err) {
             console.error(err);
             setError("Server Error verifying payment.");
          }
        },
        prefill: {
          name: booking.name || "Customer Name",
          email: booking.userEmail || booking.email || "customer@fixvo.com",
          contact: booking.phone || ""
        },
        theme: {
          color: "#0f172a", // slate-900 matches our theme
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         console.warn("Razorpay checkout failed:", response.error);
         setError(response.error?.description || "Payment failed or was cancelled. You can retry or choose 'Pay in Cash'.");
      });
      rzp.open();
    } catch (err) {
      console.error("Payment initialization error:", err);
      setError("Failed to initialize payment gateway. Please verify your connection or choose 'Pay in Cash'.");
    }
    setLoading(false);
  };

  const handleCashPayment = async () => {
    setLoading(true);
    setError(null);
    const targetBookingId = booking._id || booking.id;
    try {
      await api.put(`/bookings/${targetBookingId}/pay`, { paymentMethod: 'cash', amount });
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to request cash payment.");
    }
    setLoading(false);
  };

  const handleSubmit = () => {
    if (selectedMethod === 'online') {
      handleRazorpayPayment();
    } else {
      handleCashPayment();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in scale-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900 border-b-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
              <CreditCard size={20} />
            </div>
            <h2 className="text-xl font-black tracking-tight">Checkout</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 font-medium text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Amount Display */}
          <div className="text-center space-y-2">
            <p className="text-slate-500 font-medium text-xs">Total Amount Due</p>
            <div className="flex items-center justify-center gap-2">
              {useFixvoCash && appliedCashDiscount > 0 && (
                <span className="text-2xl font-bold text-slate-400 line-through">₹{baseAmount}</span>
              )}
              <p className="text-5xl font-extrabold text-slate-900">₹{amount}</p>
            </div>
            <p className="text-xs font-medium text-slate-400">for {booking.serviceId?.name || booking.serviceName || 'Device Repair'}</p>
            {booking.discountPercentage > 0 && (
              <p className="text-emerald-600 font-bold text-xs mt-1">✓ {booking.discountPercentage}% Discount Applied</p>
            )}

            {/* Fixvo Cash Wallet Deduction Box */}
            {walletBalance > 0 && (
              <div 
                onClick={() => setUseFixvoCash(!useFixvoCash)}
                className={`mt-3 p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left ${
                  useFixvoCash ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${useFixvoCash ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black">Use Fixvo Cash Balance</p>
                      <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-md font-bold">Avail: ₹{walletBalance}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {useFixvoCash ? `Applied ₹${appliedCashDiscount} instant discount` : `Save up to ₹${maxCashDiscount} on this bill`}
                    </p>
                  </div>
                </div>

                <div className="text-amber-600">
                  {useFixvoCash ? <CheckSquare size={20} className="fill-amber-500 text-white" /> : <Square size={20} className="text-slate-400" />}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Select Payment Method</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Online Option */}
              <div 
                onClick={() => setSelectedMethod('online')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                  selectedMethod === 'online' 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-md shadow-indigo-600/5' 
                    : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedMethod === 'online' ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>
                  <CreditCard size={18} />
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-xs sm:text-sm">Pay Online</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">UPI, Cards, Netbanking</p>
                </div>
              </div>

              {/* Cash Option */}
              <div 
                onClick={() => setSelectedMethod('cash')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                  selectedMethod === 'cash' 
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 shadow-md shadow-emerald-600/5' 
                    : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-50'}`}>
                  <Coins size={18} />
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-xs sm:text-sm">Pay in Cash</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Direct to Technician</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secure / Warning messages */}
          {selectedMethod === 'online' ? (
            <div className="flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs font-bold transition-all duration-300">
              <ShieldCheck size={18} className="text-indigo-500 shrink-0" />
              <span>Secured by Razorpay Encryption</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-xs font-bold transition-all duration-300">
              <Coins size={18} className="text-emerald-600 shrink-0" />
              <span>Tech will confirm receipt on their dashboard</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className={`w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all transform shadow-lg active:scale-98 ${
                loading 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : selectedMethod === 'online'
                    ? 'bg-gradient-to-r from-slate-900 to-indigo-900 hover:from-black hover:to-black text-white hover:-translate-y-0.5 shadow-indigo-950/20'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white hover:-translate-y-0.5 shadow-emerald-600/10'
              }`}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> Processing...</>
              ) : selectedMethod === 'online' ? (
                `Pay ₹${amount} Securely`
              ) : (
                `Confirm Cash Payment (₹${amount})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
