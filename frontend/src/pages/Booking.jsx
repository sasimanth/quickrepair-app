import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import { Loader2, Wrench } from 'lucide-react';

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(useLocation().search);
  const initialService = queryParams.get('service') || '';

  useEffect(() => {
    if (user) {
      navigate(`/dashboard?action=book${initialService ? `&service=${initialService}` : ''}`, { replace: true });
    }
  }, [user, navigate, initialService]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative font-sans p-4">
      <div className="text-center bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl space-y-4">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex items-center justify-center mx-auto shadow-inner">
          <Wrench size={28} />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Redirecting to Secure Booking...</h2>
        <p className="text-xs text-slate-500 font-semibold">Please authenticate to continue with your doorstep service request.</p>
        <Loader2 size={24} className="animate-spin text-blue-600 mx-auto" />
      </div>

      <AuthModal 
        onClose={() => navigate('/', { replace: true })}
        onSuccess={() => {
          navigate(`/dashboard?action=book${initialService ? `&service=${initialService}` : ''}`, { replace: true });
        }}
      />
    </div>
  );
};

export default Booking;
