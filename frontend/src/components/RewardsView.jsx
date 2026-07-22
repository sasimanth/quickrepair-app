import React from 'react';
import { Sparkles, Award, Tag, Gift, Percent } from 'lucide-react';

const RewardsView = ({ bookings }) => {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-white/5">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <Sparkles className="text-indigo-400" /> Member Rewards & Offers
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">View active coupons, loyalties, and promotional benefits</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Loyalty card */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 flex gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Fixvo Loyalty Points</h3>
            <p className="text-[11px] text-slate-450 mt-1">Earn points on every service completed. Redeem for free inspection coupons.</p>
            <p className="text-lg font-black text-amber-400 mt-2">150 pts <span className="text-[10px] text-slate-500 font-semibold">(Value: ₹75)</span></p>
          </div>
        </div>

        {/* Level card */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 flex gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Customer Tier Level</h3>
            <p className="text-[11px] text-slate-450 mt-1">Complete 2 more repairs to upgrade to Gold Tier benefits.</p>
            <p className="text-xs font-black text-indigo-400 mt-2 uppercase tracking-wider">Silver Member (Tier 1)</p>
          </div>
        </div>
      </div>

      {/* Coupons stack */}
      <div className="space-y-4 pt-4">
        <h3 className="font-extrabold text-sm text-slate-300 tracking-tight uppercase tracking-wider">Active Promo Codes & Coupons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Coupon 1 */}
          <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-5 relative overflow-hidden flex gap-4">
            <div className="absolute right-[-10px] top-[-10px] w-12 h-12 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="p-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
              <Percent size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs bg-slate-950 border border-white/10 px-2 py-0.5 rounded text-indigo-300 uppercase tracking-widest font-mono select-all">FIXVO10</span>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">Active</span>
              </div>
              <h4 className="font-bold text-white text-xs sm:text-sm mt-2">10% Discount on First Booking</h4>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Valid only for new accounts on first device inspection or service.</p>
            </div>
          </div>

          {/* Coupon 2 */}
          <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-5 relative overflow-hidden flex gap-4">
            <div className="absolute right-[-10px] top-[-10px] w-12 h-12 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="p-3 bg-amber-650/20 text-amber-400 border border-amber-500/20 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
              <Gift size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs bg-slate-950 border border-white/10 px-2 py-0.5 rounded text-amber-400 uppercase tracking-widest font-mono select-all">PLUSNEW</span>
                <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">Plus Special</span>
              </div>
              <h4 className="font-bold text-white text-xs sm:text-sm mt-2">Save ₹99 on Inspection Visits</h4>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">For Fixvo Plus members. Auto-applied to eliminate inspection visitation charges.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RewardsView;
