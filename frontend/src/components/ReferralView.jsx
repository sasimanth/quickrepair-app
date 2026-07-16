import React, { useState } from 'react';
import { User, Copy, Share2, Award, Users, Gift } from 'lucide-react';

const ReferralView = ({ profile, showToast }) => {
  const refCode = profile?.referralCode || 'FIXVO100';
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    if (showToast) {
      showToast('Referral Code Copied! 📋', `Code ${refCode} has been copied to your clipboard.`, 'success', true);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteText = encodeURIComponent(`Hey! Sign up on Fixvo using my code *${refCode}* and get ₹50 welcome cashback instantly on your first device repair or home service visit. Book here: https://fixvo-frontend.vercel.app`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${inviteText}`;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-white/5">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <User className="text-indigo-400" /> Refer & Earn Rewards
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Invite friends to Fixvo and earn reward cash</p>
      </div>

      <div className="bg-gradient-to-br from-[#1E293B] to-slate-950 p-6 rounded-3xl border border-white/5 relative overflow-hidden text-center space-y-6">
        <div className="absolute top-[-50%] left-[-20%] w-[50%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08),_transparent_60%)] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-50%] right-[-20%] w-[50%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.06),_transparent_60%)] rounded-full pointer-events-none"></div>
        
        <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto shadow-md">
          <Gift size={32} className="animate-bounce" />
        </div>
        
        <div className="space-y-1.5 max-w-sm mx-auto">
          <h3 className="text-lg font-black text-white">Earn ₹100 for every referral!</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            You earn ₹100 in wallet cash after your friend completes their first service booking, and they get ₹50 welcome cashback!
          </p>
        </div>

        {/* Copy code input */}
        <div className="flex max-w-xs mx-auto border border-white/10 bg-slate-950 rounded-2xl overflow-hidden p-1.5 items-center justify-between">
          <span className="font-black text-sm uppercase tracking-widest pl-3.5 text-slate-200">{refCode}</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border-none ${
              copied ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-indigo-400'
            }`}
          >
            <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer no-underline active:scale-95 transition-all"
        >
          <Share2 size={14} /> Invite via WhatsApp
        </a>
      </div>

      {/* Referral Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 text-center">
          <Users size={20} className="text-indigo-400 mx-auto mb-2" />
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Invites</h4>
          <p className="text-2xl font-black text-white mt-1.5">3</p>
        </div>
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 text-center">
          <Award size={20} className="text-emerald-400 mx-auto mb-2" />
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rewards Earned</h4>
          <p className="text-2xl font-black text-emerald-450 mt-1.5">₹300</p>
        </div>
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 text-center">
          <Clock size={20} className="text-amber-400 mx-auto mb-2" />
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Invites</h4>
          <p className="text-2xl font-black text-amber-400 mt-1.5">1</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralView;
