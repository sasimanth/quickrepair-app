import React, { useState, useEffect } from 'react';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';
import { ShieldCheck, Sparkles } from 'lucide-react';

const SplashScreen = ({ onFinish, duration = 1800 }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(current);

      if (elapsed >= duration) {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(() => {
          if (onFinish) onFinish();
        }, 350); // Match transition duration
      }
    }, 25);

    return () => clearInterval(interval);
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 bg-[#090D16] text-white select-none transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Spacer */}
      <div className="w-full flex justify-end items-center pt-2">
        <span className="text-[10px] tracking-widest uppercase font-extrabold text-blue-400/80 bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles size={11} className="text-blue-400 animate-pulse" />
          <span>DOORSTEP REPAIR NETWORK</span>
        </span>
      </div>

      {/* Center Brand Identity */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm z-10 animate-in zoom-in-95 duration-500">
        {/* Animated Brand Logo Icon */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-lg opacity-60 animate-pulse"></div>
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-900 border border-white/20 p-3 shadow-2xl flex items-center justify-center overflow-hidden">
            <img
              src={fixvoLogo}
              alt="FIXVO"
              className="w-full h-full object-contain drop-shadow-md transform hover:scale-105 transition-transform"
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-1">
            FIX<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">VO</span>
            <span className="text-blue-500 text-5xl leading-none">.</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-300 tracking-wide">
            Whatever's Broken, We Fix It.
          </p>
          <p className="text-[11px] text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
            Verified local experts for plumbing, electrical, bike repair & appliances at your doorstep.
          </p>
        </div>
      </div>

      {/* Bottom Progress Bar & Trust Badge */}
      <div className="w-full max-w-xs space-y-4 z-10 pb-6">
        {/* Sleek Animated Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[11px] font-black tracking-wider text-slate-400 uppercase">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Loading Platform</span>
            </span>
            <span className="text-blue-400 font-mono font-extrabold">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10 backdrop-blur-sm shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-75 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-[shimmer_1.5s_infinite] -skew-x-12"></div>
            </div>
          </div>
        </div>

        {/* Security & Verification Note */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>100% Police Verified Technicians • 30-Day Free Warranty</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
