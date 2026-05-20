import React from 'react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full"></div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 mb-10 font-medium">Last Updated: May 2026</p>
        
        <div className="prose max-w-none text-slate-700 space-y-6">
          <p className="text-lg">Your privacy is our priority at Fixvo. We handle your data carefully and securely.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">Data Collection</h2>
          <p>We collect your contact info, location for service delivery, and payment details securely via our payment partner. We also collect the details of the service requests you make to match you with the right technician.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">Data Usage</h2>
          <p>Your data is strictly used to fulfill repair requests, provide customer support, and improve our platform functionality. We may send you service updates and occasional relevant promotional offers if you opt-in.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">Sharing</h2>
          <p>We only share your exact location and phone number with your assigned technician when they are en route. <strong className="text-slate-900">We never sell your data</strong> to third-party marketers or advertisers.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">Security</h2>
          <p>We use industry-standard encryption to protect your data during transit and at rest. Your payment information is securely processed by our trusted payment gateways and never stored directly on our servers.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
