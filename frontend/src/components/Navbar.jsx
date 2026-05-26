import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, UserCircle2 } from 'lucide-react';
import NotificationsBell from './NotificationsBell';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  let role = user?.user_metadata?.role || user?.app_metadata?.role || 'user';
  if (user?.email?.includes('+admin') || user?.email?.startsWith('admin')) role = 'admin';
  if (user?.email?.includes('+tech') || user?.email?.startsWith('tech')) role = 'technician';
  const name = user?.user_metadata?.name || user?.email;



  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (role === 'admin') return '/admin-dashboard';
    if (role === 'technician') return '/technician-dashboard';
    return '/dashboard';
  };

  // Hide Navbar completely on authentication pages for a cleaner Auth experience
  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  // Changed to sticky top-4 as requested by user to fix alignment and scrolling
  return (
    <div className="sticky top-2 sm:top-4 inset-x-0 z-50 flex justify-center px-2 sm:px-4 pointer-events-none mb-4">
      <nav className="relative pointer-events-auto bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] w-full max-w-5xl transition-all duration-500">
        <div className="px-3 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/30 rounded-full overflow-hidden">
                <img src={fixvoLogo} alt="Fixvo Logo" className="w-full h-full object-cover scale-110" />
              </div>
              <span className="font-extrabold text-lg sm:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-slate-900">
                Fixvo
              </span>
            </Link>



            {/* Navigation Links */}
            <div className="flex items-center gap-1 sm:gap-3 transition-all">
              <Link 
                to="/#pricing" 
                className="text-slate-500 hover:text-indigo-600 font-bold transition-all px-2.5 py-2 text-sm select-none"
              >
                Pricing
              </Link>
              {user ? (
                <>
                  <NotificationsBell />

                  <Link 
                    to={getDashboardLink()} 
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors px-2 py-2"
                  >
                    <LayoutDashboard size={18} />
                    <span className="hidden sm:block">Dashboard</span>
                  </Link>
                  
                  
                  <Link to={getDashboardLink()} className="hidden md:flex items-center gap-2 pl-3 pr-4 py-1.5 bg-slate-50/80 border border-slate-200/60 rounded-full shadow-inner hover:bg-slate-100 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <UserCircle2 size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate">{name?.split('@')[0]}</span>
                    {user?.isPremium && (
                      <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 border border-amber-500 text-slate-900 text-[9px] font-extrabold rounded uppercase tracking-wider ml-1 shadow-sm">
                        Plus
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black rounded uppercase tracking-wider ml-1">
                      {role}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-all duration-300 ml-1"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-slate-500 hover:text-indigo-600 font-bold transition-colors px-3 py-2 text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-[14px] text-sm font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Start Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
