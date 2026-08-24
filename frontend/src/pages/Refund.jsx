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
    <h2>1. Diagnostic Inspection Visits & Fees</h2>
    <p>Fixvo charges a standard diagnostic inspection fee of ₹99 for regular users (waived entirely for Fixvo Prime subscribers). If a booking is cancelled before the assigned technician initiates travel, no fee is charged. Once the technician arrives and completes the physical diagnostic inspection, the ₹99 inspection fee covers professional diagnostic time and transit, and is non-refundable regardless of whether you accept the proposed repair quote.</p>
    
    <h2>2. Online Payment Refunds & Timelines</h2>
    <p>For online payments completed via UPI, debit/credit cards, or net banking through our certified payment gateways (Stripe/Razorpay), approved refunds will be credited back to your original payment source. Refund transactions typically clear within 5 to 7 banking days depending on your issuing financial institution.</p>
    
    <h2>3. 30-Day Fixvo Labor Guarantee & Unresolved Issues</h2>
    <p>All completed repairs booked through Fixvo are backed by our 30-day Labor Guarantee. If an identical hardware fault recurs within 30 days of service completion, a technician will re-inspect and fix the issue at zero additional labor cost. If verified unfixable, customer support will issue a full refund of labor charges paid.</p>
    
    <h2>4. Late Cancellation & Dispatch Fees</h2>
    <p>Customers can cancel requests for free at any time prior to technician dispatch. If cancellation occurs after the technician is already 'En Route' to your address, a ₹99 dispatch fee will be deducted or billed to compensate the technician for fuel and travel allocation.</p>
    
    <h2>5. Technician No-Show & Reassignment Refund</h2>
    <p>If an assigned technician fails to arrive within the scheduled booking window or cancels unexpectedly, your job will be immediately re-assigned to another top-rated local technician. If you decline reassignment, any pre-paid amounts for that booking will be fully refunded automatically.</p>
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
                Fixvo Legal Notice
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'Refund Policy'}</h1>
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

export default Refund;
