import { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, User, Settings, LayoutDashboard, LogOut, ArrowRight, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommandPalette = ({ isOpen, onClose, role }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'dashboard', section: 'Navigation', icon: LayoutDashboard, title: 'Go to Dashboard', onAction: () => { navigate(role === 'technician' ? '/technician-dashboard' : role === 'admin' ? '/admin-dashboard' : '/dashboard'); onClose(); } },
    { id: 'settings', section: 'User', icon: Settings, title: 'Profile Settings', shortcut: 'S', onAction: () => { alert('Use the Settings button in your Dashboard.'); onClose(); } },
    ...(role === 'technician' ? [
      { id: 'find-jobs', section: 'Technician', icon: Briefcase, title: 'Find Open Jobs Nearby', onAction: () => { navigate('/technician-dashboard'); onClose(); } },
      { id: 'go-online', section: 'Technician', icon: MapPin, title: 'Toggle Online Status', onAction: () => { navigate('/technician-dashboard'); onClose(); } },
    ] : [
      { id: 'book-repair', section: 'Customer', icon: Smartphone, title: 'Book a New Repair', onAction: () => { navigate('/dashboard'); onClose(); } },
    ]),
    { id: 'logout', section: 'User', icon: LogOut, title: 'Sign Out Temporarily', onAction: () => { alert('Sign out via Navbar'); onClose(); } }
  ];

  const filteredActions = actions.filter(action => action.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-200">
      <div className="absolute inset-0 z-0" onClick={onClose}></div>
      
      <div className="relative z-10 w-full max-w-2xl bg-white/90 backdrop-blur-3xl border border-white/60 shadow-[0_20px_60px_rgb(0,0,0,0.15)] rounded-2xl overflow-hidden animate-in slide-in-from-top-10 duration-300">
        
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-200/60 bg-white/50">
          <Search className="text-slate-400 shrink-0" size={22} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, jobs, or settings..."
            className="w-full px-4 py-5 bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-medium text-slate-800 placeholder-slate-400"
          />
          <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-400">
            <span>ESC</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="py-14 text-center text-slate-500 font-medium">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {['Navigation', 'Customer', 'Technician', 'User'].map(section => {
                const sectionActions = filteredActions.filter(a => a.section === section);
                if (sectionActions.length === 0) return null;
                
                return (
                  <div key={section} className="mb-4">
                    <h3 className="px-3 md:px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">{section}</h3>
                    <div className="space-y-1">
                      {sectionActions.map(action => (
                        <button
                          key={action.id}
                          onClick={action.onAction}
                          className="w-full flex justify-between items-center px-3 md:px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 text-left text-slate-700 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 font-medium">
                            <action.icon size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            {action.title}
                          </div>
                          <div className="flex items-center gap-3">
                            {action.shortcut && (
                               <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-indigo-400 bg-indigo-100/50 px-2 py-0.5 rounded">
                                 {action.shortcut}
                               </span>
                            )}
                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity transform group-hover:translate-x-1" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600">↑↓</kbd> to navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600">↵</kbd> to select</span>
          </div>
          <span className="font-bold tracking-wide">QuickRepair OS™</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
