import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, LogOut, LayoutDashboard, UserCircle2, Search, Wallet } from 'lucide-react';
import NotificationsBell from './NotificationsBell';
import CommandPalette from './CommandPalette';
import api from '../services/api';
import { FaInstagram, FaLinkedin, FaXTwitter, FaWhatsapp } from 'react-icons/fa6';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [escrowBalance, setEscrowBalance] = useState(0);
  
  let role = user?.user_metadata?.role || user?.app_metadata?.role || 'user';
  if (user?.email?.includes('+admin') || user?.email?.startsWith('admin')) role = 'admin';
  if (user?.email?.includes('+tech') || user?.email?.startsWith('tech')) role = 'technician';
  const name = user?.user_metadata?.name || user?.email;

  useEffect(() => {
    if (role === 'technician') {
      const fetchEscrow = async () => {
        try {
          const { data } = await api.get('/bookings');
          const sum = data.filter(j => j.status === 'completed').reduce((acc, j) => acc + (j.serviceId?.price || 0), 0);
          setEscrowBalance(sum);
        } catch (error) { console.error('Failed to load escrow', error) }
      };
      fetchEscrow();
      const int = setInterval(fetchEscrow, 10000);
      return () => clearInterval(int);
    }
  }, [role]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Changed from "fixed" to "absolute" so it scrolls out of view and doesn't confuse the user by overlapping text
  return (
    <div className="absolute top-8 sm:top-10 inset-x-0 z-50 flex justify-center mt-4 px-4 pointer-events-none">
      <nav className="relative pointer-events-auto bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl w-full max-w-5xl transition-all duration-500">
        <div className="px-5 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[14px] shadow-lg shadow-indigo-500/30 group-hover:shadow-purple-500/40 transition-all duration-300 transform group-hover:scale-105 group-hover:rotate-3">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                QuickRepair
              </span>
            </Link>

            {/* Mid Section: Search (Command K) */}
            {user && (
              <div className="hidden md:flex flex-1 max-w-sm mx-4">
                <button
                  onClick={() => setIsPaletteOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50/50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-600 transition-colors">
                    <Search size={16} />
                    <span className="font-medium">Quick search...</span>
                  </div>
                  <kbd className="hidden lg:flex items-center gap-1 font-sans text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex items-center gap-2 sm:gap-4 transition-all">
              {/* Social Media Icons */}
              <div className="hidden lg:flex items-center gap-3 mr-2 border-r border-slate-200/50 pr-4">
                <a href="https://www.instagram.com/sasimanth_9515?igsh=NXZ5amZxaDlkeGxy" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-600 transition-colors transform hover:scale-110">
                  <FaInstagram size={18} />
                </a>
                <a href="https://www.linkedin.com/in/gsasimanthreddy" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors transform hover:scale-110">
                  <FaLinkedin size={18} />
                </a>
                <a href="https://x.com/sasimanth_9515" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors transform hover:scale-110">
                  <FaXTwitter size={18} />
                </a>
                <a href="https://wa.me/9515980170" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-500 transition-colors transform hover:scale-110">
                  <FaWhatsapp size={18} />
                </a>
              </div>
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
                  
                  {role === 'technician' && (
                    <div className="hidden lg:flex items-center gap-2 pl-3 pr-4 py-1.5 bg-emerald-50/80 border border-emerald-200/60 rounded-full shadow-inner">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Wallet size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-emerald-600 leading-none">Escrow Balance</span>
                        <span className="text-sm font-bold text-emerald-800 leading-tight">${escrowBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="hidden md:flex items-center gap-2 pl-3 pr-4 py-1.5 bg-slate-50/80 border border-slate-200/60 rounded-full shadow-inner cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <UserCircle2 size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate">{name?.split('@')[0]}</span>
                    <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black rounded uppercase tracking-wider ml-1">
                      {role}
                    </span>
                  </div>

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
      {user && <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} role={role} />}
    </div>
  );
};

export default Navbar;
