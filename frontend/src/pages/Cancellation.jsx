import React from 'react';

const Cancellation = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 mt-16 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 font-heading">Cancellation Policy</h1>
        
        <div className="space-y-6 text-gray-600">
          <p>
            At Fixvo, we strive to provide reliable and timely home services. We understand that plans can change, and we have established this Cancellation Policy to be fair to both our customers and our service professionals.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 font-heading">1. Customer Cancellations</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Free Cancellation:</strong> You may cancel your booking free of charge up to 2 hours before the scheduled service time.</li>
              <li><strong>Late Cancellation:</strong> Cancellations made within 2 hours of the scheduled time may incur a cancellation fee as compensating our professionals for their lost time.</li>
              <li><strong>Upon Arrival:</strong> If you cancel when the professional has already arrived at your location, you will be charged an inspection or visit fee.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 font-heading">2. Professional Cancellations</h2>
            <p>
              In rare circumstances, a professional may need to cancel due to unforeseen emergencies. If this happens, we will immediately attempt to reassign another qualified professional. If we cannot fulfill your service, you can easily reschedule or cancel with zero penalty.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 font-heading">3. How to Cancel</h2>
            <p>
              You can cancel your request directly through the Fixvo Dashboard or by contacting customer support. Once the cancellation is processed, any applicable refunds will be initiated.
            </p>
          </section>

          <p className="pt-4 border-t border-gray-100 text-sm">
            Last updated: April 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cancellation;
