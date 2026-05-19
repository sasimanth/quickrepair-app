import React, { useState } from 'react';
import { Share2, Check, Gift, Users, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Referrals = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = user ? ("QCKR-" + (user._id?.substring(0, 6).toUpperCase() || 'USER123')) : "QCKR-GUEST";
  const referralLink = `https://fixvo.co/invite/${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 mt-16 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          
          <Gift size={64} className="mx-auto mb-6 text-white/90" />
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Refer a Friend, Earn ₹20!</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8 font-medium">
            Share Fixvo with your friends. They get an instant discount on their first repair, and you earn ₹20 directly to your wallet once their booking is completed.
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 max-w-xl mx-auto border border-white/20">
            <p className="text-sm text-blue-100 uppercase tracking-widest font-bold mb-3">Your Unique Link</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-white/90 text-gray-800 px-4 py-3 rounded-xl flex-grow font-mono font-bold truncate">
                {referralLink}
              </div>
              <button 
                onClick={handleCopy}
                className="bg-white text-blue-600 hover:bg-gray-50 px-6 py-3 rounded-xl font-black transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <><Check size={20}/> Copied</> : <><Share2 size={20}/> Share Link</>}
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 size={28} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">1. Share Your Link</h3>
            <p className="text-gray-500 text-sm">Send your unique referral link to friends or family.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={28} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">2. They Book</h3>
            <p className="text-gray-500 text-sm">Your friend uses the link to book their first repair service.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={28} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">3. You Get Rewarded</h3>
            <p className="text-gray-500 text-sm">Once the job is done, ₹20 is instantly added to your account!</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Referrals;
