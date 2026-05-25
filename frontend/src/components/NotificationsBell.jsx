import { useState, useEffect } from 'react';
import api from '../services/api';
import { Bell, Check, X, MessageSquare, Info, Calendar, CheckSquare } from 'lucide-react';
import { socket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

const NotificationsBell = () => {
  const { user } = useAuth();
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
      setNotifications(data);
      const newUnreadCount = data.filter(n => !n.isRead).length;
      setUnreadCount(newUnreadCount);
    } catch (err) {
      console.error('Failed fetching notifications', err);
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
      if (notif.type === 'booking' && onDashboard) {
        // Skip duplicate sound; local dashboard toast handles the audio chime
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
      const unreadNotifs = notifications.filter(n => !n.isRead);
      await Promise.all(unreadNotifs.map(n => api.put(`/notifications/${n._id}/read`)));
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
    if (isRead) return 'bg-white opacity-60';
    switch (type) {
      case 'chat':
        return 'bg-emerald-50/50 hover:bg-emerald-50';
      case 'booking':
        return 'bg-amber-50/50 hover:bg-amber-50';
      default:
        return 'bg-indigo-50/50 hover:bg-indigo-50';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all focus:outline-none"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-extrabold rounded-full border-2 border-white shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for easy closing on mobile click-away */}
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-[-70px] xs:right-[-45px] sm:right-0 mt-3 w-[calc(100vw-32px)] xs:w-[350px] sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full uppercase tracking-wider animate-bounce">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="text-[10px] sm:text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckSquare size={13} /> Mark all read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs Filter Bar */}
            <div className="flex border-b border-slate-100 bg-slate-50 px-2 pt-1.5 overflow-x-auto scrollbar-none">
              {['all', 'system', 'booking', 'chat'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'booking' ? 'Bookings' : tab === 'chat' ? 'Chats' : 'System'}
                </button>
              ))}
            </div>
            
            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {filteredNotifications.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-medium text-sm">
                  No {activeTab !== 'all' ? activeTab + ' ' : ''}notifications yet.
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div key={notif._id} className={`p-4 transition-colors ${getNotifBg(notif.type, notif.isRead)}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${notif.isRead ? 'bg-slate-100' : 'bg-white shadow-sm border border-slate-100'}`}>
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs sm:text-sm leading-tight truncate ${notif.isRead ? 'font-semibold text-slate-500' : 'font-extrabold text-indigo-950'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed break-words">
                            {notif.message}
                          </p>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="shrink-0 p-1 bg-white text-emerald-500 border border-emerald-100 hover:bg-emerald-50 rounded-full shadow-sm transition-all"
                          title="Mark as read"
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
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
