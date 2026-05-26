import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

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
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center relative overflow-hidden">
      {/* Background Gradients to match premium Home theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="text-center relative z-10 p-6">
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Redirecting to Secure Booking...</h2>
        <p className="text-slate-400 text-sm font-semibold">Please authenticate to continue with your service request.</p>
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
