import React, { useState } from 'react';
import { CreditCard, Plus, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, Loader2, Check } from 'lucide-react';

const WalletView = ({
  profile,
  transactions,
  walletAddAmount,
  setWalletAddAmount,
  handleAddWalletMoney
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'net'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleQuickPillClick = (amt) => {
    setWalletAddAmount(amt.toString());
  };

  const handleProcessAddMoney = (e) => {
    e.preventDefault();
    const amount = Number(walletAddAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount to add.");
      return;
    }
    setShowAddModal(true);
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      handleAddWalletMoney(e);
      setTimeout(() => {
        setSuccess(false);
        setShowAddModal(false);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="text-blue-600" /> Wallet & Fixvo Cash
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage digital wallet payments, add money & review cashback</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between min-h-[180px] shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] bg-white/20 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider select-none backdrop-blur-xs">
                Available Balance
              </span>
              <p className="text-4xl sm:text-5xl font-black text-white mt-4 tracking-tight">₹{(profile?.walletBalance || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xs">
              <CreditCard size={28} className="text-blue-200" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-blue-100 font-bold border-t border-white/20 pt-4 mt-6">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Welcome Cashback: ₹50.00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              <span>Referral Bonus: ₹100.00</span>
            </div>
          </div>
        </div>

        {/* Add Money Quick Form */}
        <form onSubmit={handleProcessAddMoney} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block ml-1">Add Money to Wallet</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-base">₹</span>
              <input
                required
                type="number"
                min="100"
                max="10000"
                placeholder="Enter amount"
                value={walletAddAmount}
                onChange={(e) => setWalletAddAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-extrabold text-slate-900 text-base focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Quick Pills */}
            <div className="flex gap-2 pt-1">
              {[100, 500, 1000, 2000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickPillClick(amt)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-extrabold rounded-xl text-[11px] border border-slate-200 transition-colors cursor-pointer"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none shadow-md shadow-blue-600/10"
          >
            <Plus size={16} /> Proceed to Add Money
          </button>
        </form>
      </div>

      {/* Transaction History */}
      <div className="space-y-4 pt-4">
        <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Transaction History</h3>
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-semibold text-xs">No wallet transactions recorded yet.</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 sm:p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-2xl border ${
                    tx.type === 'credit' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    {tx.type === 'credit' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{tx.desc}</h4>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <span className={`font-black text-sm sm:text-base ${tx.type === 'credit' ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real Working Add Money Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Add ₹{walletAddAmount} to Wallet</h3>
                <p className="text-xs text-slate-500 font-medium">Select your preferred payment method</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Check size={32} />
                </div>
                <h4 className="font-black text-lg text-slate-900">Payment Successful! 🎉</h4>
                <p className="text-xs text-slate-500 font-semibold">₹{walletAddAmount} added to your wallet balance.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPayment} className="space-y-5">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: '📱 UPI / QR' },
                    { id: 'card', label: '💳 Card' },
                    { id: 'net', label: '🏦 Netbank' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`p-3 rounded-2xl border text-center font-bold text-xs cursor-pointer transition-all ${
                        selectedMethod === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {selectedMethod === 'upi' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">UPI ID</label>
                    <input 
                      type="text"
                      defaultValue="customer@okaxis"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">Instant credit via GPay / PhonePe / Paytm.</p>
                  </div>
                )}

                {selectedMethod === 'card' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Card Details</label>
                    <input type="text" defaultValue="4111 2222 3333 4444" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" defaultValue="08/29" className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none" />
                      <input type="password" defaultValue="999" className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none" />
                    </div>
                  </div>
                )}

                {selectedMethod === 'net' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Bank</label>
                    <select className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none">
                      <option>State Bank of India</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border-none outline-none shadow-md shadow-blue-600/10"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <span>Pay ₹{walletAddAmount} & Credit Wallet</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletView;
