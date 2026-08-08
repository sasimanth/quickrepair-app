import React from 'react';
import { Sparkles, Award, Tag, Gift, Percent } from 'lucide-react';

const RewardsView = ({ bookings }) => {
  return (
    <div className="space-y-6 font-sans">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Sparkles className="text-blue-600" /> Member Rewards & Offers
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">View active coupons, loyalty points, and promotional benefits</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Loyalty card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Fixvo Loyalty Points</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Earn points on every completed repair. Redeem for free inspection vouchers.</p>
            <p className="text-lg font-black text-amber-600 mt-2">150 Points <span className="text-xs text-slate-500 font-bold">(Value: ₹75)</span></p>
          </div>
        </div>

        {/* Tier card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Customer Tier Level</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Complete 2 more repairs to unlock Gold Tier priority dispatch.</p>
            <p className="text-xs font-black text-blue-600 mt-2 uppercase tracking-wider">SILVER MEMBER</p>
          </div>
        </div>
      </div>

      {/* Coupons stack */}
      <div className="space-y-4 pt-4">
        <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Active Promo Codes & Coupons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Coupon 1 */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 relative overflow-hidden flex gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 border border-blue-200 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
              <Percent size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-blue-700 uppercase tracking-wider font-mono select-all shadow-xs">FIXVO10</span>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">Active</span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-2">10% Discount on First Booking</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Valid for new customer accounts on first service or repair.</p>
            </div>
          </div>

          {/* Coupon 2 */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 relative overflow-hidden flex gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 border border-amber-200 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
              <Gift size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-amber-700 uppercase tracking-wider font-mono select-all shadow-xs">PLUSNEW</span>
                <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">Plus Special</span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-2">Save ₹99 on Inspection Visits</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Applied automatically for Plus members on diagnostic visits.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RewardsView;
