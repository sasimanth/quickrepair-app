import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, LogOut, LayoutDashboard, UserCircle2 } from 'lucide-react';
import NotificationsBell from './NotificationsBell';

const Navbar = () => {
  const navigate = useNavigate();
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

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-200 group-hover:shadow-indigo-300 transition-all duration-300 transform group-hover:scale-105">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              QuickRepair
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            {user ? (
              <>
                <NotificationsBell />

                <Link 
                  to={getDashboardLink()} 
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition-colors"
                >
                  <LayoutDashboard size={18} />
                  <span className="hidden sm:block">Dashboard</span>
                </Link>
                
                <div className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                  <UserCircle2 className="text-slate-400" size={20} />
                  <span className="text-sm font-bold text-slate-700">{name}</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md uppercase tracking-wide">
                    {role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 hover:border-rose-200 px-4 py-2.5 rounded-xl font-bold transition-all duration-300"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-slate-600 hover:text-blue-600 font-bold transition-colors px-4 py-2"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
