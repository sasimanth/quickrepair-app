import React, { useState } from 'react';
import { User, Copy, Share2, Award, Users, Gift, Clock, CheckCircle2, Link2 } from 'lucide-react';

const ReferralView = ({ profile, showToast }) => {
  const refCode = profile?.referralCode || 'FIXVO100';
  const referralLink = `https://fixvo-frontend.vercel.app/signup?ref=${refCode}`;
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    if (showToast) {
      showToast('Referral Code Copied! 📋', `Code ${refCode} has been copied to your clipboard.`, 'success', true);
    }
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    if (showToast) {
      showToast('Referral Link Copied! 🔗', `Link ${referralLink} copied to your clipboard.`, 'success', true);
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const inviteText = encodeURIComponent(`Hey! Sign up on Fixvo using my code *${refCode}* and get ₹50 welcome cashback instantly on your first service visit. Register here: ${referralLink}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${inviteText}`;

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <User className="text-blue-600" /> Refer & Earn Rewards
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Invite friends to Fixvo and earn reward cash</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 sm:p-8 rounded-3xl border border-blue-100 text-center space-y-6 shadow-sm">
        
        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Gift size={32} />
        </div>
        
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-xl font-black text-slate-900">Earn ₹100 for every referral!</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            You earn ₹100 in wallet cash after your friend completes their first service booking, and they get ₹50 welcome cashback!
          </p>
        </div>

        {/* Display Official Vercel Referral Link */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto space-y-3">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Your Personal Referral Link</label>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <Link2 size={16} className="text-blue-600 shrink-0" />
              <input 
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent border-none outline-none font-mono text-xs font-bold text-slate-800 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer border-none ${
                  copiedLink ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500">Referral Code: <strong className="text-slate-900 tracking-wider uppercase font-black">{refCode}</strong></span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 underline cursor-pointer border-none bg-transparent"
            >
              {copiedCode ? '✓ Code Copied' : 'Copy Code Only'}
            </button>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md cursor-pointer no-underline active:scale-95 transition-all"
        >
          <Share2 size={14} /> Invite via WhatsApp
        </a>
      </div>

      {/* How it works */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
        <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">How It Works</h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-left pt-2">
          {[
            { step: '1', title: 'Share Link', desc: 'Send your fixvo-frontend.vercel.app link to friends.' },
            { step: '2', title: 'Friend Registers', desc: 'Your friend registers using your unique link.' },
            { step: '3', title: 'First Service', desc: 'Friend completes their first repair or service visit.' },
            { step: '4', title: 'Get Rewarded', desc: '₹100 credited directly to your Fixvo wallet!' }
          ].map((item) => (
            <div key={item.step} className="space-y-1">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center mb-2">
                {item.step}
              </div>
              <h5 className="font-bold text-xs text-slate-900">{item.title}</h5>
              <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <Users size={20} className="text-blue-600 mx-auto mb-2" />
          <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Invites</h4>
          <p className="text-2xl font-black text-slate-900 mt-1">3</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <Award size={20} className="text-emerald-600 mx-auto mb-2" />
          <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Rewards Earned</h4>
          <p className="text-2xl font-black text-emerald-600 mt-1">₹300</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <Clock size={20} className="text-amber-600 mx-auto mb-2" />
          <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Pending Invites</h4>
          <p className="text-2xl font-black text-amber-600 mt-1">1</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralView;
