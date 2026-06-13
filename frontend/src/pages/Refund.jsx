import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Refund = () => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get('/legal/document/refund_policy');
        setDoc(data);
      } catch (err) {
        console.error("Failed to load refund dynamic template", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  const defaultContent = `
    <h2>1. Inspection Visits and Fees</h2>
    <p>Fixvo charges a standard inspection/diagnostic fee of ₹99 for regular users (waived entirely for Fixvo Plus members). If you cancel a booking before the technician departs, no fee is charged. Once the technician arrives and performs the diagnostic inspection, the inspection fee is non-refundable regardless of whether you proceed with the suggested repairs.</p>
    
    <h2>2. Online Payment Refunds</h2>
    <p>For online payments processed through the app, refunds will be credited back to your original payment method. Once approved by our support team, refunds typically clear within 5 to 7 business days depending on your banking institution.</p>
    
    <h2>3. Failed or Unresolved Services</h2>
    <p>If a technician is unable to resolve the agreed-upon issue, or if the repair fails within our standard warranty window (if applicable), customer support will review the case. If verified, you will receive a full refund of the repair service charges. This does not cover secondary problems or unrelated hardware failures.</p>
    
    <h2>4. Customer Cancellation Fees</h2>
    <p>Customers can cancel requests for free any time before the technician departs. If cancellation occurs after the technician is already 'En Route' to your location, a late cancellation dispatch fee of ₹99 may be deducted or billed to your account to compensate the technician for fuel and time.</p>
    
    <h2>5. Technician Cancellation</h2>
    <p>If a technician cancels the job after acceptance or fails to arrive within the guarantee window, the job will be immediately reassigned to another technician. If you choose not to proceed with a reassignment, any pre-paid amounts for that booking will be fully refunded without fees.</p>
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
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'Refund Policy'}</h1>
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

export default Refund;
