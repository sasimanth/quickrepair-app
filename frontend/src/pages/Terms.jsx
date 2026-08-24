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
    <h2>1. Marketplace Facilitator Agreement</h2>
    <p>By accessing or using Fixvo, you agree to these Terms & Conditions. Fixvo operates strictly as an on-demand technology marketplace matching customers with independent, verified service professionals ("Technicians"). Fixvo is not a direct employer of technicians nor a direct repair provider.</p>
    
    <h2>2. User Obligations</h2>
    <p>Users must provide truthful, complete service address information, contact phone numbers, and device failure descriptions. Users must ensure safe, reasonable access for matched technicians to conduct physical diagnostic inspections and repair tasks.</p>
    
    <h2>3. Diagnostic Quotes & Service Approvals</h2>
    <p>All service quotes generated on-site must be submitted, itemized, and approved inside the Fixvo application prior to commencement of repair work. Direct verbal agreements or side-payments outside the app void service warranties and platform guarantees.</p>
    
    <h2>4. Payments & Platform Commission</h2>
    <p>Payments must be settled via integrated digital channels or logged cash payments inside the application. Fixvo retains a 10% platform facilitation fee on completed service work. Off-platform payment requests or soliciting off-platform arrangements violate these Terms and lead to permanent account termination.</p>
    
    <h2>5. Disputes & Service Guarantee</h2>
    <p>Any service dispute must be filed with Fixvo Support within 48 hours of job completion. Fixvo facilitates dispute investigation and warranty claim reviews up to the original labor charge amount.</p>
    
    <h2>6. Contact Legal Counsel</h2>
    <p>For questions or inquiries regarding these Terms & Conditions, please contact <strong>legal@fixvo.in</strong> or phone <strong>+91 95159 80170</strong>.</p>
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
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'Terms & Conditions'}</h1>
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

export default Terms;
