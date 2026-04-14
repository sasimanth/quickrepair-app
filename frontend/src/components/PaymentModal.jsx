import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe with Environment Variable (Safe Fallback for non-deployed environments)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const CheckoutForm = ({ booking, amount, onSuccess, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);
    
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: { email: booking.userEmail || undefined }
      }
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      try {
        await api.put(`/bookings/${booking._id}/pay`, {
          paymentMethod: 'stripe_card',
          amount: amount,
          transactionId: paymentIntent.id
        });
        onSuccess();
      } catch (err) {
        setError("Payment succeeded but server update failed. Contact support.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 font-medium text-sm rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="text-center space-y-2">
          <p className="text-slate-500 font-medium">Total Amount Due</p>
          <p className="text-5xl font-extrabold text-slate-900">${amount}</p>
          <p className="text-sm font-medium text-slate-400">for {booking.serviceId?.name || 'Device Repair'}</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2">Card details</label>
            <div className="p-4 border-2 border-slate-200 hover:border-indigo-400 transition-colors rounded-xl bg-slate-50 shadow-inner">
              <CardElement options={{
                style: {
                  base: { fontSize: '16px', color: '#334155', '::placeholder': { color: '#94a3b8' } },
                  invalid: { color: '#ef4444' }
                }
              }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
          <ShieldCheck size={18} />
          <span className="text-sm font-bold">Payments are digitally encrypted by Stripe</span>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button type="submit" disabled={!stripe || loading} className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all transform shadow-lg ${loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-slate-900 to-indigo-900 hover:from-black hover:to-black text-white hover:-translate-y-1 shadow-indigo-900/20'}`}>
            {loading ? <><Loader2 className="animate-spin" size={24} /> Processing Payment...</> : <>Checkout &amp; Pay ${amount}</>}
          </button>
          <button 
            type="button" 
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                await api.put(`/bookings/${booking._id}/pay`, {
                  paymentMethod: 'mock',
                  amount: amount,
                  transactionId: "dummy_txn_" + Math.floor(Math.random() * 1000000)
                });
                onSuccess();
              } catch (err) {
                console.error("Payment Error:", err);
                setError(err.response?.data?.message || err.message || "Dummy payment failed.");
              }
              setLoading(false);
            }} 
            disabled={loading} 
            className={`w-full py-3 rounded-xl font-bold bg-slate-100 text-slate-700 flex items-center justify-center gap-2 transition-all hover:bg-slate-200 border border-slate-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Dev: Simulate Dummy Payment
          </button>
        </div>
      </form>
      
    </div>
  );
};

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState(null);
  
  const amount = booking.serviceOption === 'inspection' 
    ? (booking.serviceId?.price || 0) + (booking.inspectionFee || 15) 
    : (booking.serviceId?.price || 0);

  useEffect(() => {
    // Create PaymentIntent securely on backend as soon as the modal loads
    api.post(`/bookings/${booking._id}/create-payment-intent`, { amount })
      .then(res => setClientSecret(res.data.clientSecret))
      .catch(err => {
         console.error("Error creating payment intent", err);
         setError(err.message || "Could not initialize Stripe Gateway.");
      });
  }, [booking._id, amount]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in scale-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900 border border-b-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
              <CreditCard size={20} />
            </div>
            <h2 className="text-xl font-black tracking-tight">Checkout</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6">
          {!clientSecret && !error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="animate-spin text-slate-900 w-10 h-10" />
              <p className="text-slate-500 font-bold animate-pulse">Initializing Secure Gateway...</p>
            </div>
          ) : error && !clientSecret ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
                <p className="font-bold">Stripe Gateway Offline</p>
                <p className="text-sm mt-1">We couldn't connect to the payment processor. You can use the dummy payment feature to bypass this for now.</p>
              </div>
              <button 
                type="button" 
                onClick={async () => {
                  try {
                    await api.put(`/bookings/${booking._id}/pay`, {
                      paymentMethod: 'mock',
                      amount: amount,
                      transactionId: "dummy_txn_" + Math.floor(Math.random() * 1000000)
                    });
                    onSuccess();
                  } catch (err) {
                    setError("Dummy payment failed.");
                  }
                }} 
                className="w-full py-4 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                Simulate Dummy Payment (Bypass)
              </button>
            </div>
          ) : (
             <Elements stripe={stripePromise}>
               <CheckoutForm booking={booking} amount={amount} onSuccess={onSuccess} clientSecret={clientSecret} />
             </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
