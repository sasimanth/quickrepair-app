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
    <h2>1. Respectful Communication</h2>
    <p>Fixvo is committed to providing a safe and friendly community. Customers and technicians must treat each other with respect, courtesy, and professional dignity. Abusive language, harassment, discrimination, or physical confrontation of any kind will result in immediate and permanent ban from the platform.</p>
    
    <h2>2. Fraud Prevention and Quote Integrity</h2>
    <p>All quotes must be documented, itemized, and approved inside the Fixvo app. Technicians are prohibited from inflating pricing artificially or using low-quality materials. Customers must not attempt to alter agreed prices or request work beyond the scope of approved quotes without updating the invoice.</p>
    
    <h2>3. Prohibited Activities</h2>
    <p>To protect the safety of all users, the following are strictly prohibited:</p>
    <ul>
      <li>Bypassing the platform to arrange off-platform services or cash agreements.</li>
      <li>Sharing private phone numbers or personal credentials for off-platform work.</li>
      <li>Impersonation, sharing accounts, or allowing unverified individuals to complete assigned jobs.</li>
      <li>Submitting fake reviews, false reports, or promotional spam.</li>
    </ul>
    
    <h2>4. Reporting Violations</h2>
    <p>If you encounter safety issues, fraud attempts, or violations of these guidelines, please report them immediately to <strong>support@fixvo.in</strong> or use the in-app help center. We take all reports seriously and investigate promptly.</p>
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
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{doc?.title || 'User Safety Guidelines'}</h1>
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

export default UserSafety;
