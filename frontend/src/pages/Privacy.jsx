import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Privacy = () => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get('/legal/document/privacy_policy');
        setDoc(data);
      } catch (err) {
        console.error("Failed to load privacy policy dynamic template", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  const defaultContent = `
    <h2>1. Information We Collect</h2>
    <p>Fixvo collects information directly provided by users to facilitate on-demand repair services. This includes personal identifiers (name, email address, phone number), physical service location, equipment/appliance details, diagnostic images, and transaction histories. We also collect automated technical data such as IP address, browser type, and operating system.</p>
    
    <h2>2. Location & Geolocation Tracking</h2>
    <p>To enable real-time technician matching, accurate distance metrics, and live ETA tracking (Uber-style dispatch), Fixvo requests access to your device's precise location services (GPS). Technicians share continuous background location updates while en route to active service jobs. Geolocation data is used strictly for operational fulfillment and safety verification.</p>
    
    <h2>3. Technician Background Credentials</h2>
    <p>For independent technician partners, we collect government-issued photo identification, trade licenses, certifications, police verification records, vehicle details, and bank payout credentials to verify identity, complete background checks, and process wallet payouts.</p>
    
    <h2>4. Payment Security & Third-Party Processing</h2>
    <p>Financial transactions conducted through Fixvo are processed using certified PCI-DSS Level 1 compliant payment partners (e.g., Stripe, Razorpay). Fixvo servers never record, process, or store raw credit/debit card numbers or sensitive banking credentials.</p>
    
    <h2>5. Data Retention & Privacy Rights</h2>
    <p>We retain your personal data only as long as necessary to provide service, resolve disputes, and maintain regulatory compliance. Users have the right to request access to, correction of, or deletion of their personal information by contacting our Data Protection Officer.</p>
    
    <h2>6. Contact Data Protection Officer</h2>
    <p>For privacy inquiries, data deletion requests, or location permission concerns, please email <strong>privacy@fixvo.in</strong> or call our dedicated line at <strong>+91 95159 80170</strong>.</p>
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
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'Privacy Policy'}</h1>
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

export default Privacy;
