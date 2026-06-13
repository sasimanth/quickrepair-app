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
    <h2>1. User Data Collection</h2>
    <p>We collect information you provide directly to us, including your name, email address, phone number, physical address, and device profiles, to coordinate on-demand repair bookings. We also collect usage data, device metadata, and feedback reports.</p>
    
    <h2>2. Technician Information</h2>
    <p>For technicians, we collect professional certifications, government identity records, contact details, background check status, vehicle information, and performance ratings to verify credentials and ensure safety.</p>
    
    <h2>3. Location Permissions and Tracking</h2>
    <p>To facilitate matching and arrival tracking, our mobile application collects precise geolocation data. Technicians share continuous location updates when en route to a job. Customers share location details to ensure accurate dispatching. You can enable or disable location tracking via your device settings, though this may limit service availability.</p>
    
    <h2>4. Payment Information Security</h2>
    <p>All online payment transactions are processed securely through certified PCI-DSS compliant third-party payment gateways (e.g., Stripe, Razorpay). Your payment card details, bank account credentials, or UPI details are encrypted and never stored on Fixvo servers.</p>
    
    <h2>5. Cookies and Tracking Technologies</h2>
    <p>We use cookies and similar tracking tokens to authenticate sessions, remember dashboard preferences, and analyze platform traffic patterns to optimize performance and user experience.</p>
    
    <h2>6. Data Security Measures</h2>
    <p>We implement industry-standard secure socket layers (SSL/TLS) encryption, access control walls, and database encryption to safeguard personal data. However, no transmission over the internet can be guaranteed as 100% secure.</p>
    
    <h2>7. Contact Information</h2>
    <p>If you have any questions or concerns regarding this Privacy Policy, your data rights, or location tracking, please contact our Data Protection Office at <strong>privacy@fixvo.in</strong> or via phone at <strong>+91 95159 80170</strong>.</p>
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
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'Privacy Policy'}</h1>
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

export default Privacy;
