import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Loader2, Coins } from 'lucide-react';
import api from '../services/api';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('online'); // 'online' or 'cash'
  
  let amount = booking.finalQuote ? booking.finalQuote : (booking.serviceOption === 'inspection' 
    ? (booking.serviceId?.price || 0) + (booking.inspectionFee || 15) 
    : (booking.serviceId?.price || 0));

  if (booking.discountPercentage && booking.discountPercentage > 0) {
    amount = amount - (amount * booking.discountPercentage / 100);
  }

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create order on backend
      const { data: order } = await api.post('/payment/create-order', {
        amount,
        bookingId: booking._id
      });
      
      // 2. Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'YOUR_KEY_ID', // Razorpay Test Key
        amount: order.amount,
        currency: "INR",
        name: "Fixvo",
        description: "Service Payment",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const verifyRes = await api.post('/payment/verify', {
              ...response,
              bookingId: booking._id
            });
            if (verifyRes.data.success) {
              onSuccess();
            } else {
              setError("Payment verification failed.");
            }
          } catch(err) {
             console.error(err);
             setError("Server Error verifying payment.");
          }
        },
        prefill: {
          name: booking.name || "Customer Name",
          email: booking.userEmail || "customer@fixvo.com",
          contact: booking.phone || ""
        },
        theme: {
          color: "#0f172a", // slate-900 matches our theme
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         setError(response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setError("Failed to initialize payment gateway.");
    }
    setLoading(false);
  };

  const handleCashPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/bookings/${booking._id}/pay`, { paymentMethod: 'cash', amount });
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
            <p className="text-slate-500 font-medium">Total Amount Due</p>
            <p className="text-5xl font-extrabold text-slate-900">₹{amount}</p>
            <p className="text-sm font-medium text-slate-400">for {booking.serviceId?.name || booking.serviceName || 'Device Repair'}</p>
            {booking.discountPercentage > 0 && (
              <p className="text-emerald-600 font-bold text-sm mt-1">✓ {booking.discountPercentage}% Discount Applied</p>
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
