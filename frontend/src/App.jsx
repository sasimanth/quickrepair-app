import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import Disclaimer from './pages/Disclaimer';
import About from './pages/About';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Cancellation from './pages/Cancellation';
import Referrals from './pages/Referrals';
import TechnicianAgreement from './pages/TechnicianAgreement';
import UserSafety from './pages/UserSafety';
import LoadingSpinner from './components/LoadingSpinner';
import VerifyAccount from './pages/VerifyAccount';
import Services from './pages/Services';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

import UserDashboard from './pages/UserDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  let role = user.role || user.user_metadata?.role || user.app_metadata?.role || 'user';
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

import Booking from './pages/Booking';

const PromoBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const offers = [
    { text: "First repair? Use code", code: "FIXVO10", suffix: "for 10% off your direct repair!", icon: "🔥" },
    { text: "Priority dispatch & zero inspection fees with", code: "PLUS2026", suffix: "Get Fixvo Plus today!", icon: "✨" },
    { text: "30-Minute Arrival Guarantee on all home services", code: "", suffix: "Call: +91 95159 80170", icon: "⚡" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const current = offers[currentIndex];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/30 text-white text-[11px] sm:text-xs font-bold text-center py-2.5 px-4 shadow-lg relative z-[60] overflow-hidden flex justify-center items-center transition-all duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="flex items-center gap-2 select-none animate-in fade-in slide-in-from-right-4 duration-500" key={currentIndex}>
        <span className="text-base leading-none">{current.icon}</span>
        <span className="text-slate-200">{current.text}</span>
        {current.code && (
          <button 
            onClick={() => handleCopy(current.code)}
            className="group relative inline-flex items-center bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/30 rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wide text-indigo-300 transition-all cursor-pointer select-all active:scale-95 duration-150"
            title="Click to copy promo code"
          >
            <span>{current.code}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-slate-950 text-white text-[9px] px-2 py-0.5 rounded shadow-xl transition-all font-semibold">
              Copy Code
            </span>
          </button>
        )}
        <span className="text-slate-300 whitespace-nowrap">{current.suffix}</span>
      </div>
      
      {copied && (
        <div className="absolute right-4 bg-emerald-500 text-white text-[9px] px-2 py-1 rounded-full font-black shadow-lg shadow-emerald-500/30 animate-bounce">
          Copied!
        </div>
      )}
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isDashboard = ['/dashboard', '/technician-dashboard', '/admin-dashboard'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {isHome && <PromoBanner />}
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Suspense fallback={<LoadingSpinner text="Initializing Fixvo Secure Platform..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Booking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-account" element={<VerifyAccount />} />
            
            <Route path="/dashboard" element={
              <PrivateRoute allowedRoles={['user']}>
                <UserDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/technician-dashboard" element={
              <PrivateRoute allowedRoles={['technician']}>
                <TechnicianDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/admin-dashboard" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            
            {/* Services & Pricing Pages */}
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/terms-and-conditions" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/privacy-policy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/refund-policy" element={<Refund />} />
            <Route path="/cancellation" element={<Cancellation />} />
            <Route path="/cancellation-policy" element={<Cancellation />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/technician-agreement" element={<TechnicianAgreement />} />
            <Route path="/safety" element={<UserSafety />} />
            <Route path="/safety-guidelines" element={<UserSafety />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
};

function App() {
  useEffect(() => {
    // 1. Explicit Service Worker Registration
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('✅ Service Worker registered successfully with scope:', registration.scope);
        } catch (err) {
          console.error('❌ Service Worker registration failed:', err);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  useEffect(() => {
    // 2. Global listener for Service Worker messages to trigger notification chime
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'push_received') {
        const payload = event.data.payload;
        const priority = payload.data?.priority || 'low';
        
        // Dynamically import sound effects to play correct notification chime
        import('./services/soundEffects').then(({ playNotificationSound }) => {
          playNotificationSound(priority);
        });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
