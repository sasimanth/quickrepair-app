import React, { useState, useEffect } from 'react';
import api from '../services/api';

const UserSafety = () => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get('/legal/document/user_safety');
        setDoc(data);
      } catch (err) {
        console.error("Failed to load user safety guidelines dynamic template", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  const defaultContent = `
    <h2>1. Zero Tolerance & Professional Conduct</h2>
    <p>Fixvo is dedicated to fostering a safe, trustworthy ecosystem for both homeowners and technicians. Discrimination, abusive language, physical threats, harassment, or unsafe work site conditions are strictly prohibited. Any violation results in immediate permanent ban and referral to local authorities where applicable.</p>
    
    <h2>2. Background Verification & ID Badges</h2>
    <p>Every technician operating on Fixvo undergoes mandatory background verification, identity check, and skill qualification testing. Matched technicians wear official Fixvo digital/physical badges. Users must verify the technician's name and photo in-app before granting home access.</p>
    
    <h2>3. Quote Transparency & Fraud Prevention</h2>
    <p>To eliminate pricing fraud, all job diagnostics, parts estimates, and labor charges must be submitted as an itemized quote within the Fixvo application. Verbal side-negotiations or off-platform payment solicitations are prohibited and void safety protections and warranty coverage.</p>
    
    <h2>4. Prohibition of Off-Platform Direct Solicitation</h2>
    <p>Soliciting off-platform work or bypassing the platform for direct cash jobs is strictly forbidden. Off-platform work voids all platform insurance, 30-day labor guarantees, and identity verification protections.</p>
    
    <h2>5. Incident Reporting & Safety Assistance</h2>
    <p>If you experience any safety concern, suspicious behavior, or billing dispute during a service call, contact our 24/7 Safety Desk immediately at <strong>support@fixvo.in</strong> or helpline <strong>+91 95159 80170</strong>.</p>
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
                Fixvo Safety Standard
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'User Safety Guidelines'}</h1>
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

export default UserSafety;
