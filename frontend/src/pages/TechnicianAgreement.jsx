import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TechnicianAgreement = () => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get('/legal/document/technician_terms');
        setDoc(data);
      } catch (err) {
        console.error("Failed to load technician agreement dynamic template", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  const defaultContent = `
    <h2>1. Independent Contractor Partner Status</h2>
    <p>Technicians operate as independent contractors on the Fixvo marketplace platform. Nothing in this agreement creates an employer-employee, agency, or joint venture relationship. Technicians maintain control over their work schedules, accepted service requests, and geographic service zones.</p>
    
    <h2>2. Quality Metrics & Star Rating Maintenance</h2>
    <p>Technicians agree to provide professional workmanship, maintain clean work environments, wear proper safety gear, and maintain a minimum customer rating of 4.2 out of 5 stars. Falling below 4.2 stars may trigger retraining or temporary account suspension.</p>
    
    <h2>3. 10% Platform Commission & Wallet Settlement</h2>
    <p>Fixvo deducts a standard 10% platform commission on completed work orders. For cash payments collected directly from customers, the 10% commission is deducted from your online technician wallet balance. Cash collections must be logged in-app immediately upon completion.</p>
    
    <h2>4. Wallet Payout Minimums & Processing</h2>
    <p>Technicians can initiate payouts to their registered UPI ID or verified bank account once their available wallet balance reaches ₹500 or more. Withdrawal requests are processed within 24 to 48 business hours by Fixvo Finance Operations.</p>
    
    <h2>5. Anti-Solicitation & Zero Tolerance Grounds</h2>
    <p>Soliciting Fixvo customers for off-platform repairs, sharing user contact details, falsifying parts quotes, or failing background check re-verifications will result in immediate permanent account termination and forfeiture of pending wallet bonuses.</p>
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
                Fixvo Partner Agreement
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'Technician Service Agreement'}</h1>
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

export default TechnicianAgreement;
