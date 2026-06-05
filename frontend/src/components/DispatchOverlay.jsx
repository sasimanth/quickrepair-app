import { useState, useEffect } from 'react';
import { Play, X, MapPin, Navigation, Info, AlertTriangle, Check } from 'lucide-react';

export default function DispatchOverlay({ job, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(20);
  const totalDuration = 20;

  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline('Timeout (no response)');
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onDecline]);

  const progressFraction = timeLeft / totalDuration;
  const strokeWidth = 8;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressFraction * circumference;

  // Calculate earnings (90% tech share)
  const serviceCharge = job.serviceCharge || job.amount || 0;
  const sparePartsCost = job.sparePartsCost || 0;
  const transportCharge = job.transportCharge || 50;
  const totalQuote = job.finalQuote || (serviceCharge + sparePartsCost + transportCharge);
  const earnings = Math.round(totalQuote * 0.9);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 font-sans select-none text-white overflow-y-auto">
      {/* Glow background effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center text-center backdrop-blur-lg">
        
        {/* Animated Countdown Timer Ring */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-slate-800 fill-none"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-indigo-500 fill-none transition-all duration-1000 ease-linear"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black text-slate-50 tracking-tighter">{timeLeft}s</span>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Remaining</span>
          </div>
        </div>

        {/* Earning Card */}
        <div className="w-full bg-gradient-to-br from-indigo-500/20 to-violet-500/10 rounded-3xl p-5 border border-indigo-500/30 mb-6 flex flex-col items-center">
          <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Your Estimated Payout (90%)</span>
          <h2 className="text-4xl font-black text-white tracking-tight">₹{earnings}</h2>
          <span className="text-[10px] text-indigo-200/60 font-semibold mt-1">Total customer invoice value: ₹{totalQuote}</span>
        </div>

        {/* Job Details Card */}
        <div className="w-full space-y-4 text-left bg-slate-950/40 rounded-3xl p-5 border border-slate-800/60 mb-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
              <Play size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Service Category</span>
              <span className="text-sm font-extrabold text-slate-100">{job.serviceName || 'Appliance Repair'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Service Address</span>
              <span className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed">{job.location}</span>
            </div>
          </div>

          {job.problemDescription && (
            <div className="flex items-start gap-3 border-t border-slate-850 pt-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Customer Notes</span>
                <span className="text-xs font-medium text-slate-300 italic">"{job.problemDescription}"</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-4">
          <button
            onClick={() => onDecline('Declined by technician')}
            className="flex-1 bg-slate-850 hover:bg-slate-800 active:scale-95 border border-slate-700/60 text-slate-300 font-black py-4 px-6 rounded-2xl transition-all text-xs tracking-wider uppercase cursor-pointer"
          >
            Decline
          </button>
          
          <button
            onClick={onAccept}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-400 hover:to-indigo-600 active:scale-95 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check size={16} /> Accept Job
          </button>
        </div>

      </div>
    </div>
  );
}
