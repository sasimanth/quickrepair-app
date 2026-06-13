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
    <h2>1. Service Quality & Professional Standards</h2>
    <p>As a verified technician on Fixvo, you represent and warrant that you possess the necessary technical skills, equipment, and experience to carry out repair services. You agree to deliver high-quality services, maintain a professional and respectful demeanor, and keep your overall rating above 4.2 stars.</p>
    
    <h2>2. Conduct Guidelines and Safety</h2>
    <p>Technicians must wear proper identification, arrive within the scheduled time windows, and provide transparent diagnosis feedback. You are strictly prohibited from soliciting customers for off-platform repairs, sharing user contact details with third parties, or performing unauthorized activities.</p>
    
    <h2>3. Commission Rules and Wallet Balances</h2>
    <p>Fixvo retains a standard 10% platform commission on the gross total of all completed bookings (including labour and materials). The remaining 90% is credited to your technician wallet balance. Cash payments collected directly from customers are logged, and the 10% platform commission due is deducted from your online wallet balance.</p>
    
    <h2>4. Payouts and Withdrawals</h2>
    <p>Technicians can request a withdrawal of their available online balance to their registered bank account or UPI ID. The minimum payout request is ₹500. Withdrawal requests are processed by Admin within 24 to 48 hours.</p>
    
    <h2>5. Account Suspension Policies</h2>
    <p>Fixvo reserves the right to suspend or terminate technician accounts immediately for: rating drops below 4.2, safety violations, fraudulent quotes, off-platform soliciting, excessive cancellations, or failing background check updates.</p>
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
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'Technician Agreement'}</h1>
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

export default TechnicianAgreement;
