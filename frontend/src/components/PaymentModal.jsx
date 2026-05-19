import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../services/api';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in scale-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900 border-b-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
              <CreditCard size={20} />
            </div>
            <h2 className="text-xl font-black tracking-tight">Checkout</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 font-medium text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-slate-500 font-medium">Total Amount Due</p>
            <p className="text-5xl font-extrabold text-slate-900">₹{amount}</p>
            <p className="text-sm font-medium text-slate-400">for {booking.serviceId?.name || 'Device Repair'}</p>
            {booking.discountPercentage > 0 && (
              <p className="text-emerald-600 font-bold text-sm mt-1">✓ {booking.discountPercentage}% Discount Applied (FIXVO10)</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <ShieldCheck size={18} />
            <span className="text-sm font-bold">Secured by Razorpay Encryption</span>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button 
              onClick={handleRazorpayPayment} 
              disabled={loading} 
              className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all transform shadow-lg ${loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-slate-900 to-indigo-900 hover:from-black hover:to-black text-white hover:-translate-y-1 shadow-indigo-900/20'}`}
            >
              {loading ? <><Loader2 className="animate-spin" size={24} /> Processing...</> : <>Pay ₹{amount} Securely</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
