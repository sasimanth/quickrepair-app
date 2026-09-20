import React, { useState } from 'react';
import { X, Gift, Share2, Copy, Users, CheckCircle2, Link2, Award } from 'lucide-react';

const TechReferralModal = ({ onClose, profile, showToast }) => {
  const refCode = profile?.referralCode || 'TECHPRO100';
  const referralLink = `https://fixvo-frontend.vercel.app/technician-agreement?ref=${refCode}`;
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    if (showToast) showToast('Link Copied! 🔗', 'Technician referral link copied to clipboard.', 'success', true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    if (showToast) showToast('Code Copied! 📋', 'Referral code copied.', 'success', true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const inviteText = encodeURIComponent(`Hey! Join the Fixvo Technician Partner Network using my code *${refCode}* and get 90% payout guarantee + ₹500 joining bonus! Register here: ${referralLink}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${inviteText}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative font-sans text-slate-900">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
              <Gift size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">Refer a Technician & Earn ₹500</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Invite skilled repair partners & get rewarded</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-all cursor-pointer shadow-xs shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-center">
          
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-2xl p-6 space-y-3 shadow-md">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/20">
              <Award size={30} className="text-amber-300" />
            </div>
            <h4 className="text-xl font-black">Earn ₹500 Cash per Verified Tech!</h4>
            <p className="text-xs text-purple-100 font-medium leading-relaxed max-w-sm mx-auto">
              When your invited technician registers, completes KYC, and finishes their first 5 customer repair jobs, ₹500 is credited directly to your payout wallet.
            </p>
          </div>

          {/* Share Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-left">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Your Partner Invite Link</label>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                <Link2 size={16} className="text-purple-600 shrink-0" />
                <input
                  readOnly
                  type="text"
                  value={referralLink}
                  className="w-full bg-transparent border-none outline-none font-mono text-xs font-bold text-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer border-none ${
                    copiedLink ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="text-xs font-bold text-slate-600">Referral Code: <strong className="text-purple-700 font-mono uppercase">{refCode}</strong></span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs font-bold text-purple-700 hover:underline cursor-pointer border-none bg-transparent"
              >
                {copiedCode ? '✓ Code Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-md cursor-pointer no-underline transition-all"
          >
            <Share2 size={15} /> Invite via WhatsApp
          </a>

          {/* Referral Rules */}
          <div className="space-y-2 text-left pt-2 border-t border-slate-100">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">How Tech Referral Works</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-semibold text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-purple-600 font-black text-sm">1. Share</span>
                <p className="text-[11px] text-slate-500 font-medium">Send invite link to electrician, AC tech, or plumber.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-purple-600 font-black text-sm">2. Signup & KYC</span>
                <p className="text-[11px] text-slate-500 font-medium">Friend uploads bank & ID docs for verification.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-purple-600 font-black text-sm">3. Earn ₹500</span>
                <p className="text-[11px] text-slate-500 font-medium">₹500 added to your withdrawable wallet balance!</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-semibold text-slate-500">
          <span>Unlimited Referral Payouts</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs cursor-pointer border-none shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default TechReferralModal;
