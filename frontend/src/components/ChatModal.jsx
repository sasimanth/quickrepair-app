import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { X, Send, User, Wrench, CheckCheck, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { socket } from '../services/socket';

const ChatModal = ({ booking, onClose, currentRole }) => {
  const { user } = useAuth();
  const bookingId = booking._id;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const formatMessageTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/messages/${bookingId}`);
      // Filter out any system messages
      const filtered = data.filter(m => m.senderId !== 'system');
      setMessages(filtered);
      socket.emit('read_messages', { bookingId, userId: user.id });
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Link WebSocket real-time chat
    socket.emit('join_chat', bookingId);
    
    const handleReceiveMessage = (newMsg) => {
      if (newMsg.senderId === 'system') return; // Ignore system messages
      setMessages(prev => {
        if (prev.find(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.senderId !== user.id) {
        socket.emit('read_messages', { bookingId, userId: user.id });
      }
    };

    const handleMessagesRead = ({ readerId }) => {
      if (readerId !== user.id) {
        setMessages(prev => prev.map(m => m.senderId === user.id ? { ...m, isRead: true } : m));
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    const messageText = text;
    setText('');
    setSending(true);

    // Optimistic UI update
    const tempMsg = { 
      _id: `temp-${Date.now()}`, 
      text: messageText, 
      senderId: user.id, 
      senderName: user.name || 'Me', 
      createdAt: new Date().toISOString(), 
      isOptimistic: true 
    };
    
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data } = await api.post(`/messages/${bookingId}`, { text: messageText });
      
      // Dispatch instantly via WebSockets instead of fetching
      socket.emit('send_message', { bookingId, messageObj: data });
      
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? data : m));
    } catch (error) {
      console.error('Failed to send message:', error);
      alert("Failed to send message. Please try again.");
      setMessages(prev => prev.filter(msg => msg._id !== tempMsg._id));
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Modal Card - Fullscreen on mobile, rounded card on desktop */}
      <div className="bg-white w-full h-full sm:h-[650px] sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col transform transition-all animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight">
                {currentRole === 'user' ? 'Fixvo Technician' : (booking.name || 'Customer')}
              </h3>
              <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider mt-0.5">
                Booking ID: #{bookingId.slice(-6)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages Panel */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full flex-grow">
              <div className="animate-spin h-8 w-8 border-b-2 border-slate-900 rounded-full"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full flex-grow text-slate-400 space-y-3">
               <div className="w-16 h-16 bg-slate-200/60 rounded-full flex items-center justify-center opacity-60">
                 {currentRole === 'user' ? <Wrench size={24} className="text-slate-500" /> : <User size={24} className="text-slate-500" />}
               </div>
               <p className="font-semibold text-xs sm:text-sm text-center max-w-xs leading-relaxed">
                 No messages yet.<br/>Type below to chat directly and securely!
               </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => {
                // Customer is right side, Technician is left side
                const isCustomerMsg = msg.senderId === booking.userId || (booking.providerId && msg.senderId !== booking.providerId && msg.senderId !== 'system');
                
                return (
                  <div key={msg._id || i} className={`flex flex-col ${isCustomerMsg ? 'items-end' : 'items-start'} mb-3`}>
                    {/* Role Label */}
                    <div className={`flex items-center gap-1.5 mb-1 px-1`}>
                      <span className="text-[9px] font-black tracking-wider uppercase text-slate-400">
                        {isCustomerMsg ? (booking.name || 'Customer') : 'Technician'}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider scale-90 border ${
                        isCustomerMsg 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                        {isCustomerMsg ? 'Customer' : 'Tech'}
                      </span>
                    </div>

                    {/* Chat Bubble */}
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[82%] shadow-sm transition-all duration-300 transform scale-95 origin-bottom animate-in zoom-in-95 ${
                      isCustomerMsg 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none'
                    }`}>
                      <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                    </div>

                    {/* Timestamp & Seen status */}
                    <div className="flex items-center gap-1 mt-1 px-1.5 opacity-80 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>{formatMessageTimestamp(msg.createdAt)}</span>
                      {isCustomerMsg && (
                        <span className="inline-flex items-center gap-0.5 ml-1">
                          <CheckCheck size={12} className={msg.isRead ? "text-sky-500" : "text-slate-400"} />
                          {msg.isRead ? 'Seen' : 'Sent'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100/80">
          <div className="relative flex items-center">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-slate-100 border-none outline-none focus:ring-2 focus:ring-slate-900 rounded-full py-3.5 pl-5 pr-14 text-sm font-medium transition-all text-slate-800"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className={`absolute right-2 p-2 rounded-full transition-all flex items-center justify-center ${
                !text.trim() || sending 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95 transform'
              }`}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Send size={16} className={`${text.trim() ? "translate-x-[1px] translate-y-[-1px]" : ""}`} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
