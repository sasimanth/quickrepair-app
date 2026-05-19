import React from 'react';

const Refund = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold font-heading mb-8">Refund &amp; Warranty Policy</h1>
      <p className="text-gray-500 mb-8 italic">Last Updated: April 2026</p>
      
      <div className="prose max-w-none text-gray-700">
        <h2 className="text-2xl font-semibold mt-8 mb-4">Cancellations</h2>
        <p className="mb-4">You may cancel a booking free of charge up to 2 hours before the technician arrives. Late cancellations or cancellations when the technician is already en-route will incur a $15 cancellation fee to compensate the technician for their time.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">The Fixvo Guarantee</h2>
        <p className="mb-4">We stand by our professionals. If the original issue persists within 7 days of the repair, we will send a technician back to fix it for free. This guarantee applies to the specific workmanship performed and not to separate or new issues.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Refunds</h2>
        <p className="mb-4">Refunds are issued to the original payment method within 5-7 business days. A refund is granted if a repair cannot be completed for reasons outside of your control or if parts are unavailable.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Non-Refundable Items</h2>
        <p className="mb-4">Any spare parts or components purchased specifically for your repair and installed in your appliance are non-refundable. The initial inspection fee is also non-refundable if you decide not to proceed with the repair after diagnosis.</p>
      </div>
    </div>
  );
};

export default Refund;
