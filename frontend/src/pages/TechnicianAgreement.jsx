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
    <h2>1. Professional Standard</h2>
    <p>As a verified technician on Fixvo, you agree to maintain high professional standards, complete jobs successfully, and maintain a rating above 4.2.</p>
    
    <h2>2. Commission and Fees</h2>
    <p>Fixvo retains a 10% platform commission on all booking earnings. The remaining 90% is cleared to your wallet balance upon successful payment confirmation.</p>
    
    <h2>3. Revisions & Timeouts</h2>
    <p>ASAP job requests must be accepted within 60 seconds. All quotes and revisions must be approved by the customer before starting work.</p>
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
