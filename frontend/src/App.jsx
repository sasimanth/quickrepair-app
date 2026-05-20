import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import AdminDashboard from './pages/AdminDashboard';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';

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

const AppContent = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {isHome && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 shadow-md relative z-[60] flex justify-center items-center gap-2">
          <span>🔥 First repair? Use code</span><span className="bg-white/20 px-2 py-0.5 rounded font-black tracking-wider">FIXVO10</span><span>for 10% off your direct repair!</span>
        </div>
      )}
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Booking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute allowedRoles={['user']}>
              <div className="container mx-auto px-4 py-8 flex-grow"><UserDashboard /></div>
            </PrivateRoute>
          } />
          
          <Route path="/technician-dashboard" element={
            <PrivateRoute allowedRoles={['technician']}>
              <div className="container mx-auto px-4 py-8 flex-grow"><TechnicianDashboard /></div>
            </PrivateRoute>
          } />
          
          <Route path="/admin-dashboard" element={
            <PrivateRoute allowedRoles={['admin']}>
              <div className="container mx-auto px-4 py-8 flex-grow"><AdminDashboard /></div>
            </PrivateRoute>
          } />
          
          {/* Legal & Static Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/cancellation" element={<Cancellation />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
