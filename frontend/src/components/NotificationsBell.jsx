import { useState, useEffect } from 'react';
import api from '../services/api';
import { Bell, Check, X } from 'lucide-react';

const NotificationsBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed fetching notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds for MVP
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all focus:outline-none"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
            <h3 className="font-bold">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
               <X size={18} />
            </button>
          </div>
          
          <div className="max-h-80 overflow-y-auto bg-slate-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">
                No notifications right now!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div key={notif._id} className={`p-4 transition-colors ${notif.isRead ? 'bg-white opacity-60' : 'bg-indigo-50/50 hover:bg-indigo-50'}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className={`text-sm ${notif.isRead ? 'font-semibold text-slate-700' : 'font-bold text-indigo-900'}`}>
                          {notif.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="shrink-0 p-1.5 bg-white text-emerald-500 border border-emerald-100 hover:bg-emerald-50 rounded-full shadow-sm transition-colors tooltip tooltip-left"
                          title="Mark as read"
                        >
                          <Check size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
