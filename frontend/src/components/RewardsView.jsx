import React, { useState } from 'react';
import { Sparkles, Award, Tag, Gift, Percent, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const RewardsView = ({ profile, onPointsConverted }) => {
  const [converting, setConverting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const points = profile?.rewardPoints || 0;
  const cashValue = Math.floor(points / 10);

  const handleConvertPoints = async () => {
    if (points < 10) {
      setErrorMsg('Minimum 10 points required to convert to Fixvo Cash.');
      return;
    }

    setConverting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data } = await api.post('/users/convert-points', { points });
      setSuccessMsg(data.message || `Converted ${points} points to ₹${cashValue} Fixvo Cash!`);
      onPointsConverted?.(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to convert points.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-left">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Sparkles className="text-blue-600" /> Member Rewards & Points
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Earn 10% points on every completed repair. Convert directly to Fixvo Cash (10 Pts = ₹1).</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Loyalty card with real conversion action */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50/50 p-6 rounded-3xl border border-amber-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-2xl h-12 w-12 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Award size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Fixvo Loyalty Points</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Earn 10% points on service value (₹1000 = 100 Pts = ₹10 Fixvo Cash)</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-black text-amber-700">{points} Points</p>
                <span className="text-xs font-bold text-slate-500">(Worth ₹{cashValue} Cash)</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConvertPoints}
            disabled={converting || points < 10}
            className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${
              points >= 10 
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {converting ? (
              <><Loader2 size={16} className="animate-spin" /> Converting...</>
            ) : (
              <><span>Convert to ₹{cashValue} Fixvo Cash</span> <ArrowRight size={14} /></>
            )}
          </button>
        </div>

        {/* Tier card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl h-12 w-12 flex items-center justify-center shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Fixvo Club Tier</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Enjoy priority doorstep dispatches and exclusive member pricing.</p>
              <p className="text-xs font-black text-blue-600 mt-2 uppercase tracking-wider">
                {profile?.isPremium ? '👑 FIXVO PLUS VIP MEMBER' : '🥈 SILVER MEMBER'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-600 font-medium">
            💡 Tip: Fixvo Cash is automatically applicable to discount your next repair bill at checkout!
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
