import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { X, Send, User, Wrench, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ChatModal = ({ bookingId, onClose, currentRole }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/messages/${bookingId}`);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Simple HTTP polling every 3 seconds for new messages
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
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
      senderName: 'Me', 
      createdAt: new Date().toISOString(), 
      isOptimistic: true 
    };
    
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post(`/messages/${bookingId}`, { text: messageText });
      await fetchMessages(); // Fetch all messages to make sure we're perfectly synced
    } catch (error) {
      console.error('Failed to send message:', error);
      alert("Failed to send message. Please try again.");
      // Revert optimistic update
      setMessages(prev => prev.filter(msg => msg._id !== tempMsg._id));
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px] max-h-[85vh] transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-600 text-white">
          <div>
            <h3 className="font-bold text-lg">Job Conversation</h3>
            <p className="text-indigo-200 text-xs font-medium">Coordinate securely without exposing phone numbers</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-indigo-500 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
               <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center opacity-50">
                 {currentRole === 'user' ? <Wrench size={24}/> : <User size={24}/>}
               </div>
               <p className="font-medium text-sm text-center">No messages yet.<br/>Send a message to coordinate your repair!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.senderId === user.id || msg.isOptimistic;
              
              return (
                <div key={msg._id || i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-2`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 mx-1.5">
                    {isMine ? 'Me' : msg.senderName}
                  </span>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] ${isMine ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'}`}>
                    <p className="text-sm font-medium whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 mx-1.5 opacity-80">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {isMine && (
                      <CheckCheck size={14} className={msg.isOptimistic ? "text-slate-400" : "text-indigo-500"} />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-slate-100 border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded-full py-3.5 pl-5 pr-14 text-sm font-medium transition-all"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className={`absolute right-2 p-2 rounded-full transition-colors flex items-center justify-center ${
                !text.trim() || sending 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow active:scale-95 transform'
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
