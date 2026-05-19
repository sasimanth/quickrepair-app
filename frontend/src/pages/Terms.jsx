import React from 'react';

const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold font-heading mb-8">Terms &amp; Conditions</h1>
      <p className="text-gray-500 mb-8 italic">Last Updated: April 2026</p>
      
      <div className="prose max-w-none text-gray-700">
        <p className="mb-4">Welcome to Fixvo. By using our platform, you agree to these terms:</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Service Provision</h2>
        <p className="mb-4">Fixvo connects you with verified professional technicians. We are a marketplace, not a direct employer of the technicians.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Booking &amp; Accuracy</h2>
        <p className="mb-4">You must provide accurate item details and locations to ensure correct estimates. If the issue differs from the description, the technician reserves the right to adjust the estimate before commencing work.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Safety</h2>
        <p className="mb-4">An adult (18+) must be present during the repair. We prioritize the safety of both our customers and our technicians.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Liability</h2>
        <p className="mb-4">We guarantee the workmanship of the repair for 30 days. We are not liable for pre-existing damage to your appliances or property.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Payments</h2>
        <p className="mb-4">All payments must be processed securely through the platform. Off-platform cash payments void all warranties and violate our terms of service.</p>
      </div>
    </div>
  );
};

export default Terms;
