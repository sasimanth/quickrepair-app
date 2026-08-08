import { useState, useEffect } from 'react';
import api from '../services/api';
import { Bell, Check, X, MessageSquare, Info, Calendar, CheckSquare } from 'lucide-react';
import { socket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationsBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch (error) {
      console.warn('AudioContext failed to play sound', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      const newUnreadCount = list.filter(n => !n.isRead).length;
      setUnreadCount(newUnreadCount);
    } catch (err) {
      console.error('Failed fetching notifications', err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll as fallback, but rely on socket primarily
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Socket.io integration for instant notifications
  useEffect(() => {
    if (user?.id) {
      socket.emit('register_user', user.id);
    }

    const handleNewNotification = (notif) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount(prev => prev + 1);

      const onDashboard = window.location.pathname === '/dashboard' || window.location.pathname === '/technician-dashboard';
      if (onDashboard) {
        // Skip duplicate sound; local dashboard handles the audio chime
      } else {
        playNotificationSound();
      }
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [user?.id]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed marking all as read', err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'chat':
        return <MessageSquare size={16} className="text-emerald-500" />;
      case 'booking':
        return <Calendar size={16} className="text-amber-500" />;
      default:
        return <Info size={16} className="text-indigo-500" />;
    }
  };

  const getNotifBg = (type, isRead) => {
    if (isRead) return 'bg-transparent hover:bg-slate-50/50 opacity-75';
    switch (type) {
      case 'chat':
        return 'bg-gradient-to-r from-emerald-500/[0.04] to-transparent hover:from-emerald-500/[0.08] border-l-[4px] border-emerald-500';
      case 'booking':
        return 'bg-gradient-to-r from-amber-500/[0.04] to-transparent hover:from-amber-500/[0.08] border-l-[4px] border-amber-500';
      default:
        return 'bg-gradient-to-r from-indigo-500/[0.04] to-transparent hover:from-indigo-500/[0.08] border-l-[4px] border-indigo-500';
    }
  };

  const formatNotificationMessage = (message) => {
    if (!message) return '';
    
    let processedMessage = message;
    const currentOrigin = window.location.origin;
    if (!currentOrigin.includes('localhost') && !currentOrigin.includes('127.0.0.1')) {
      processedMessage = processedMessage.replace(/https?:\/\/localhost:\d+/g, currentOrigin);
    }
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = processedMessage.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline break-all font-bold"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const filteredNotifications = (Array.isArray(notifications) ? notifications : []).filter(n => {
    if (activeTab === 'all') return true;
    return n?.type === activeTab;
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all focus:outline-none cursor-pointer"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-white shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for easy closing on mobile click-away */}
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-[-70px] xs:right-[-45px] sm:right-0 mt-4 w-[calc(100vw-32px)] xs:w-[360px] sm:w-[440px] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100/80 overflow-hidden z-50 animate-in slide-in-from-top-3 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-slate-900 text-white border-b border-white/5 relative">
              <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[150%] bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="flex items-center gap-2 relative z-10">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-md uppercase tracking-wider shadow-sm animate-pulse">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3.5 relative z-10">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="text-[10px] sm:text-xs font-black text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent outline-none uppercase tracking-wider"
                    title="Mark all as read"
                  >
                    <CheckSquare size={13} /> Clear All
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent outline-none">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs Filter Bar */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-3 pt-2 overflow-x-auto scrollbar-none">
              {['all', 'system', 'booking', 'chat'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap outline-none cursor-pointer ${
                    activeTab === tab 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'all' ? 'All Alerts' : tab === 'booking' ? 'Bookings' : tab === 'chat' ? 'Chats' : 'System'}
                </button>
              ))}
            </div>
            
            {/* Notifications List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100/50">
              {filteredNotifications.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-medium text-sm flex flex-col items-center justify-center gap-3">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                    <Bell size={24} />
                  </div>
                  <span>No {activeTab !== 'all' ? activeTab + ' ' : ''}notifications yet</span>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div 
                    key={notif._id} 
                    className={`p-5 transition-all duration-350 cursor-pointer ${getNotifBg(notif.type, notif.isRead)}`}
                    onClick={async () => {
                      if (!notif.isRead) {
                        await markAsRead(notif._id);
                      }
                      if (notif.bookingId) {
                        setIsOpen(false);
                        const role = user?.role || 'user';
                        if (role === 'technician') {
                          navigate(`/technician-dashboard?jobId=${notif.bookingId}`);
                        } else if (role === 'admin') {
                          navigate(`/admin-dashboard?jobId=${notif.bookingId}`);
                        } else {
                          navigate(`/dashboard?jobId=${notif.bookingId}`);
                        }
                      }
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={`p-2.5 rounded-2xl mt-0.5 shrink-0 transition-transform ${notif.isRead ? 'bg-slate-100 text-slate-500' : 'bg-white shadow-sm border border-slate-100 text-indigo-600'}`}>
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="min-w-0 text-left">
                          <h4 className={`text-xs sm:text-sm leading-tight truncate tracking-tight ${notif.isRead ? 'font-semibold text-slate-500' : 'font-extrabold text-slate-900'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed break-words font-medium">
                            {formatNotificationMessage(notif.message)}
                          </p>
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-2 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      {!notif.isRead ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif._id);
                          }}
                          className="shrink-0 p-1.5 bg-white text-emerald-500 border border-emerald-100 hover:bg-emerald-50 rounded-full shadow-sm transition-all cursor-pointer"
                          title="Mark as read"
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5 mr-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsBell;
