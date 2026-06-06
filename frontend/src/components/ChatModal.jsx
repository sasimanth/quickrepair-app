import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { X, Send, User, Wrench, Check, CheckCheck, MessageCircle, CheckCircle, Truck, Sparkles, XCircle, CreditCard } from 'lucide-react';
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
      setMessages(data);
      socket.emit('read_messages', { bookingId, userId: user?._id || user?.id });
      // Send delivery receipts for loaded unread/undelivered messages
      const otherUndelivered = data.filter(m => m.senderId !== (user?._id || user?.id) && !m.isDelivered);
      otherUndelivered.forEach(m => {
        socket.emit('message_delivered', { messageId: m._id, bookingId });
      });
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
      setMessages(prev => {
        if (prev.find(m => m._id === newMsg._id)) return prev;
        
        // Deduplicate: if an optimistic message with matching text and sender exists, replace it
        const optimisticIndex = prev.findIndex(m => m.isOptimistic && m.senderId === newMsg.senderId && m.text === newMsg.text);
        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = newMsg;
          return updated;
        }
        
        return [...prev, newMsg];
      });
      
      // If we are the recipient, send delivery and read signals
      if (newMsg.senderId !== (user?._id || user?.id)) {
        socket.emit('message_delivered', { messageId: newMsg._id, bookingId });
        socket.emit('read_messages', { bookingId, userId: user?._id || user?.id });
      }
    };

    const handleMessagesRead = ({ readerId }) => {
      if (readerId !== (user?._id || user?.id)) {
        setMessages(prev => prev.map(m => m.senderId === (user?._id || user?.id) ? { ...m, isRead: true, isDelivered: true } : m));
      }
    };

    const handleMessageDelivered = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDelivered: true } : m));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_delivered', handleMessageDelivered);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_delivered', handleMessageDelivered);
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

    const activeUserId = user?._id || user?.id;
    // Optimistic UI update
    const tempMsg = { 
      _id: `temp-${Date.now()}`, 
      text: messageText, 
      senderId: activeUserId, 
      senderName: user?.name || user?.email?.split('@')[0] || 'Me', 
      createdAt: new Date().toISOString(), 
      isOptimistic: true 
    };
    
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data } = await api.post(`/messages/${bookingId}`, { text: messageText });
      
      // Dispatch instantly via WebSockets instead of fetching
      socket.emit('send_message', { bookingId, messageObj: data });
      
      setMessages(prev => {
        if (prev.find(m => m._id === data._id)) {
          return prev.filter(m => m._id !== tempMsg._id);
        }
        return prev.map(m => m._id === tempMsg._id ? data : m);
      });
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
                const isSystemMsg = msg.senderId === 'system';
                const activeUserId = user?._id || user?.id;
                const isMyMsg = !isSystemMsg && msg.senderId === activeUserId;
                
                if (isSystemMsg) {
                  const cleanText = msg.text.replace(/^📢 System:\s*/, '');
                  
                  let StatusIcon = MessageCircle;
                  let iconColor = 'text-slate-400';
                  let cardBg = 'bg-slate-100/80 border-slate-200 text-slate-650';
                  
                  if (cleanText.includes('accepted') || cleanText.includes('approved')) {
                    StatusIcon = CheckCircle;
                    iconColor = 'text-emerald-500';
                    cardBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450';
                  } else if (cleanText.includes('en route') || cleanText.includes('arrived')) {
                    StatusIcon = Truck;
                    iconColor = 'text-blue-500';
                    cardBg = 'bg-blue-500/10 border-blue-500/20 text-blue-450';
                  } else if (cleanText.includes('quote') || cleanText.includes('revision') || cleanText.includes('clarification') || cleanText.includes('inspection')) {
                    StatusIcon = CreditCard;
                    iconColor = 'text-amber-500';
                    cardBg = 'bg-amber-500/10 border-amber-500/20 text-amber-450';
                  } else if (cleanText.includes('completed') || cleanText.includes('paid') || cleanText.includes('Payment')) {
                    StatusIcon = Sparkles;
                    iconColor = 'text-emerald-500';
                    cardBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450';
                  } else if (cleanText.includes('cancelled') || cleanText.includes('declined')) {
                    StatusIcon = XCircle;
                    iconColor = 'text-rose-500';
                    cardBg = 'bg-rose-500/10 border-rose-500/20 text-rose-450';
                  }

                  return (
                    <div key={msg._id || i} className="flex justify-center my-3.5 animate-in fade-in zoom-in-95 duration-300">
                      <div className={`flex items-center gap-2 border rounded-full px-4 py-1.5 shadow-sm text-[11px] font-semibold tracking-wide ${cardBg}`}>
                        <StatusIcon size={12} className={`${iconColor} shrink-0`} />
                        <span>{cleanText}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg._id || i} className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    {/* Chat Bubble */}
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[82%] shadow-sm relative transition-all ${
                      isMyMsg 
                        ? (currentRole === 'user' 
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none' 
                          : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-none')
                        : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none'
                    }`}>
                      <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                    </div>

                    {/* Timestamp & Seen status */}
                    <div className="flex items-center gap-1 mt-1 px-1.5 opacity-80 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>{formatMessageTimestamp(msg.createdAt)}</span>
                      {isMyMsg && (
                        <span className="inline-flex items-center gap-0.5 ml-1">
                          {msg.isRead ? (
                            <CheckCheck size={12} className="text-sky-400" />
                          ) : msg.isDelivered ? (
                            <CheckCheck size={12} className="text-slate-400" />
                          ) : (
                            <Check size={12} className="text-slate-400" />
                          )}
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
