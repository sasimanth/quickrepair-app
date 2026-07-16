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
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <CreditCard className="text-indigo-400" /> Wallet Balance
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Manage and check your digital payments & cashback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-950 via-[#1E293B] to-slate-950 p-6 rounded-3xl border border-indigo-500/20 relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-lg shadow-indigo-900/10">
          <div className="absolute top-[-50%] right-[-10%] w-[40%] h-[160%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.12),_transparent_60%)] rounded-full pointer-events-none"></div>
          <div>
            <span className="text-[9px] bg-indigo-500/20 text-indigo-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/10 select-none">
              Available Balance
            </span>
            <p className="text-4xl font-black text-slate-900 mt-4 tracking-tight">₹{(profile?.walletBalance || 0).toFixed(2)}</p>
          </div>
          <div className="flex gap-4 text-[10px] text-slate-500 font-bold border-t border-slate-200 pt-3.5 mt-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Cashback: ₹50.00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>Rewards: ₹100.00</span>
            </div>
          </div>
        </div>

        {/* Add Money Form */}
        <form onSubmit={handleAddWalletMoney} className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Add Money</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-sm">₹</span>
              <input
                required
                type="number"
                min="100"
                max="10000"
                placeholder="Enter amount"
                value={walletAddAmount}
                onChange={(e) => setWalletAddAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 text-sm focus:border-indigo-500 transition-all"
              />
            </div>
            <p className="text-[9px] text-slate-500 font-semibold mt-1">Min ₹100 • Max ₹10,000</p>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none"
          >
            <Plus size={14} /> Add Money
          </button>
        </form>
      </div>

      {/* Transaction History */}
      <div className="space-y-4 pt-4">
        <h3 className="font-extrabold text-sm text-slate-700 tracking-tight uppercase tracking-wider">Transaction History</h3>
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-white/5">
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-bold text-xs">No transactions recorded.</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    tx.type === 'credit' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    {tx.type === 'credit' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{tx.desc}</h4>
                    <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">
                      {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <span className={`font-black text-sm ${tx.type === 'credit' ? 'text-emerald-450' : 'text-slate-500'}`}>
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
