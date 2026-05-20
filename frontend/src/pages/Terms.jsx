import React from 'react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full"></div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Terms & Conditions</h1>
        <p className="text-slate-500 mb-10 font-medium">Last Updated: May 2026</p>
        
        <div className="prose max-w-none text-slate-700 space-y-6">
          <p className="text-lg">Welcome to Fixvo. By using our platform, you agree to these terms:</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">1. Service Provision</h2>
          <p>Fixvo connects you with verified professional technicians. We are a marketplace, not a direct employer of the technicians.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">2. Booking & Accuracy</h2>
          <p>You must provide accurate item details and locations to ensure correct estimates. If the issue differs from the description, the technician reserves the right to adjust the estimate before commencing work.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">3. Safety</h2>
          <p>An adult (18+) must be present during the repair. We prioritize the safety of both our customers and our technicians.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">4. Liability</h2>
          <p>We guarantee the workmanship of the repair for 30 days. We are not liable for pre-existing damage to your appliances or property.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">5. Payments</h2>
          <p>All payments must be processed securely through the platform. Off-platform cash payments void all warranties and violate our terms of service.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
