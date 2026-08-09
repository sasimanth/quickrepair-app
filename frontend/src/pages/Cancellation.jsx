import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Cancellation = () => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get('/legal/document/cancellation_policy');
        setDoc(data);
      } catch (err) {
        console.error("Failed to load cancellation policy", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  const defaultContent = `
    <h2>1. Free Cancellation Window</h2>
    <p>Customers may cancel any home service or repair booking free of charge up until the moment a technician accepts the job and initiates transit ("En Route"). You can cancel directly from your User Dashboard with a single tap.</p>
    
    <h2>2. Late Cancellation Dispatch Charges</h2>
    <p>If a booking is cancelled after the technician is already en route or has arrived at your registered service address, a standard dispatch and travel fee of ₹99 will apply. This fee directly compensates the independent service professional for fuel costs, time, and travel allocation.</p>
    
    <h2>3. Rescheduling Bookings</h2>
    <p>You can reschedule your booking time slot free of charge up to 2 hours prior to the scheduled start window. Rescheduling within 2 hours of technician dispatch may be treated as a late cancellation if the technician is already in transit.</p>
    
    <h2>4. Technician-Initiated Cancellations</h2>
    <p>In rare instances where an assigned technician encounters an emergency, severe traffic delay, or safety concern and must cancel the job, Fixvo will immediately reassign your booking to another top-rated technician nearby. If no suitable technician is available or if you decline the reassignment, any pre-paid amounts will be refunded in full automatically.</p>
    
    <h2>5. Abusive Cancellation Patterns</h2>
    <p>To prevent platform fraud and protect technician livelihoods, accounts exhibiting repetitive suspicious cancellations (e.g. 5+ consecutive en-route cancellations) may be subjected to temporary booking restrictions or upfront deposit requirements.</p>

    <h2>6. Contact & Support</h2>
    <p>For questions or assistance regarding cancellations, contact our customer operations team at <strong>support@fixvo.in</strong> or via phone at <strong>+91 95159 80170</strong>.</p>
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
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full uppercase tracking-wider">
                Fixvo Policy Document
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'Cancellation Policy'}</h1>
            <p className="text-slate-500 mb-10 font-medium text-sm">
              Last Updated: {doc?.updatedAt ? new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'August 2026'} | Version V{doc?.version || 1}
            </p>
            
            <div 
              className="prose max-w-none text-slate-700 space-y-6 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: doc?.content || defaultContent }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Cancellation;
