import React from 'react';
import { CreditCard, Plus, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

const WalletView = ({
  profile,
  transactions,
  walletAddAmount,
  setWalletAddAmount,
  handleAddWalletMoney
}) => {
  return (
    <div className="space-y-6 font-sans">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <CreditCard className="text-blue-600" /> Wallet Balance
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Manage and check your digital wallet payments & cashback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-md">
          <div>
            <span className="text-[10px] bg-white/20 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider select-none backdrop-blur-xs">
              Available Balance
            </span>
            <p className="text-4xl font-black text-white mt-4 tracking-tight">₹{(profile?.walletBalance || 0).toFixed(2)}</p>
          </div>
          <div className="flex gap-4 text-[10px] text-blue-100 font-bold border-t border-white/20 pt-3.5 mt-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Cashback: ₹50.00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              <span>Rewards: ₹100.00</span>
            </div>
          </div>
        </div>

        {/* Add Money Form */}
        <form onSubmit={handleAddWalletMoney} className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1">Add Money to Wallet</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">₹</span>
              <input
                required
                type="number"
                min="100"
                max="10000"
                placeholder="Enter amount"
                value={walletAddAmount}
                onChange={(e) => setWalletAddAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 text-sm focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Min ₹100 • Max ₹10,000</p>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none shadow-md shadow-blue-600/10"
          >
            <Plus size={14} /> Add Money
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
              <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    tx.type === 'credit' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    {tx.type === 'credit' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{tx.desc}</h4>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <span className={`font-extrabold text-sm ${tx.type === 'credit' ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletView;
