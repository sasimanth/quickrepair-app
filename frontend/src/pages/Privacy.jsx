import React from 'react';

const Privacy = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold font-heading mb-8">Privacy Policy</h1>
      <p className="text-gray-500 mb-8 italic">Last Updated: April 2026</p>
      
      <div className="prose max-w-none text-gray-700">
        <p className="mb-4">Your privacy is our priority at QuickRepair. We handle your data carefully and securely.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Data Collection</h2>
        <p className="mb-4">We collect your contact info, location for service delivery, and payment details securely via our payment partner. We also collect the details of the service requests you make to match you with the right technician.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Data Usage</h2>
        <p className="mb-4">Your data is strictly used to fulfill repair requests, provide customer support, and improve our platform functionality. We may send you service updates and occasional relevant promotional offers if you opt-in.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Sharing</h2>
        <p className="mb-4">We only share your exact location and phone number with your assigned technician when they are en route. <strong>We never sell your data</strong> to third-party marketers or advertisers.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Security</h2>
        <p className="mb-4">We use industry-standard encryption to protect your data during transit and at rest. Your payment information is securely processed by our trusted payment gateways and never stored directly on our servers.</p>
      </div>
    </div>
  );
};

export default Privacy;
