import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Terms = () => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get('/legal/document/terms_conditions');
        setDoc(data);
      } catch (err) {
        console.error("Failed to load terms dynamic template", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  const defaultContent = `
    <h2>1. Welcome and Role of the Platform</h2>
    <p>Welcome to Fixvo. By registering, downloading, or using our platform, you agree to comply with and be bound by these Terms & Conditions. Fixvo acts strictly as an on-demand marketplace connecting customers with independent, qualified repair and maintenance technicians. We do not provide physical repair services directly and are not employers of the technicians.</p>
    
    <h2>2. User Responsibilities</h2>
    <p>Users must provide accurate, complete, and current information when creating a booking, including exact address details, contact numbers, and description of the device or issue. Users must ensure a safe, respectful, and cooperative working environment for the technician upon arrival.</p>
    
    <h2>3. Technician Responsibilities</h2>
    <p>Technicians agree to perform services with professional skill and diligence, represent their qualifications honestly, maintain necessary background checks, and respect user privacy. Technicians must coordinate all quote proposals and work approvals strictly through the Fixvo application.</p>
    
    <h2>4. Service Booking and Quote Terms</h2>
    <p>All service bookings are processed through the platform. Any diagnostic inspections result in a cost estimate or quote. Work may only begin after the customer has explicitly approved the quote in-app. Technicians are prohibited from modifying quotes or charging additional fees outside the approved quote structure.</p>
    
    <h2>5. Payment Policies</h2>
    <p>Payments for services completed must be processed through the platform using integrated online payment options or confirmed cash-on-service payments. Any off-platform payments or direct solicitation violate these terms, void service warranties, and will result in immediate account termination.</p>
    
    <h2>6. Cancellation and Dispute Handling</h2>
    <p>Cancellations are governed by our Cancellation Policy. Disputes between users and technicians should be reported to Fixvo Support within 48 hours. While Fixvo facilitates resolution, final liability for service quality and performance remains between the customer and the independent technician.</p>
    
    <h2>7. Limitations of Liability</h2>
    <p>To the maximum extent permitted by law, Fixvo shall not be liable for any indirect, incidental, special, exemplary, or consequential damages, including personal injury or property damage, arising out of or in connection with any service matches facilitated by the platform.</p>
  `;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full"></div>
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'Terms & Conditions'}</h1>
            <p className="text-slate-500 mb-10 font-medium">
              Last Updated: {doc?.updatedAt ? new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'May 2026'} | Version V{doc?.version || 1}
            </p>
            
            <div 
              className="prose max-w-none text-slate-700 space-y-6"
              dangerouslySetInnerHTML={{ __html: doc?.content || defaultContent }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Terms;
