import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Mic, MicOff, Send, X, Volume2, VolumeX, 
  Calendar, MapPin, Clock, Wrench, ShieldCheck, CheckCircle, 
  ArrowRight, Edit3, Loader2, AlertCircle, RefreshCw, ChevronRight, 
  UserCheck, Award, CreditCard, Phone, MessageSquare, Tag, Compass, History, Home
} from 'lucide-react';
import { sendAiMessage } from './aiService';

const FixvoAiAssistantModal = ({ 
  isOpen, 
  onClose, 
  userProfile, 
  savedAddresses = [],
  onApplyDraftToForm, 
  onConfirmBooking,
  onOpenChat,
  onOpenWallet
}) => {
  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      sender: 'ai',
      text: `Hello ${userProfile?.name?.split(' ')[0] || 'there'}! 👋 I am your Fixvo Personal Home Service Agent.\n\nI can book repairs, check your Home Service Passport, track ongoing visits, manage your wallet, or find your previous technician.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-IN'); // 'en-IN' | 'te-IN'
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [currentDraft, setCurrentDraft] = useState({});
  const [suggestedActions, setSuggestedActions] = useState([
    'Book AC Repair',
    'My Home Passport',
    'Where is My Technician?',
    'Wallet & Rewards'
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = speechLang;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputVal(transcript);
          handleSend(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [speechLang]);

  // Text to Speech
  const speakText = (text) => {
    if (!isTtsEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`•]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = speechLang === 'te-IN' ? 'te-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS playback error:', e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported by your browser. Please type your request.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
      } catch (err) {
        console.error("Mic start error:", err);
      }
    }
  };

  const handleSend = async (overrideText) => {
    const textToSend = (overrideText || inputVal).trim();
    if (!textToSend || isProcessing) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsProcessing(true);

    try {
      let enhancedDraft = { ...currentDraft };
      if (textToSend.toLowerCase().includes('saved address') && savedAddresses.length > 0) {
        const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
        if (defaultAddr) {
          enhancedDraft.detailedAddress = defaultAddr.details;
          enhancedDraft.area = defaultAddr.details.split(',').pop()?.trim() || enhancedDraft.area || 'Madanapalle';
        }
      }

      const response = await sendAiMessage(textToSend, enhancedDraft, messages);
      
      const newDraft = response.draft || currentDraft;
      setCurrentDraft(newDraft);

      if (response.suggestedActions) {
        setSuggestedActions(response.suggestedActions);
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.reply,
        draft: newDraft,
        intent: response.intent,
        isDraftComplete: response.isDraftComplete,
        availableTechnicians: response.availableTechnicians,
        preferredTechnician: response.preferredTechnician,
        bookingSummary: response.bookingSummary,
        homePassport: response.homePassport,
        walletData: response.walletData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      speakText(response.reply);

    } catch (err) {
      console.error("AI Communication Error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "Sorry, I couldn't complete that request. Please try again or switch to the manual booking form.",
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToFormAndEdit = (draft) => {
    if (onApplyDraftToForm) {
      onApplyDraftToForm(draft);
    }
    onClose();
  };

  const handleConfirmFromAi = (draft) => {
    if (onConfirmBooking) {
      onConfirmBooking(draft);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-[94vh] max-h-[740px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 font-sans">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-4 text-white flex items-center justify-between shadow-md relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight leading-tight">Fixvo AI Agent</h3>
                <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300/30">
                  Agent Active
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium">Personal Home Service Operating Layer</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Telugu / English Toggle */}
            <button
              onClick={() => setSpeechLang(prev => prev === 'en-IN' ? 'te-IN' : 'en-IN')}
              title="Toggle Telugu / English speech recognition"
              className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-white/15 hover:bg-white/25 transition-all text-white border border-white/20 cursor-pointer mr-1"
            >
              {speechLang === 'te-IN' ? '🇮🇳 తెలుగు' : '🇬🇧 EN'}
            </button>

            {/* TTS Speaker Toggle */}
            <button
              onClick={() => {
                setIsTtsEnabled(!isTtsEnabled);
                if (isTtsEnabled) window.speechSynthesis?.cancel();
              }}
              title={isTtsEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
              className={`p-2 rounded-xl transition-all cursor-pointer ${isTtsEnabled ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isTtsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[90%]">
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mb-1 shadow-sm">
                    🤖
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-bl-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>

              {/* CARD 1: HOME SERVICE PASSPORT CARD */}
              {msg.homePassport && msg.homePassport.appliances && msg.homePassport.appliances.length > 0 && (
                <div className="mt-3 w-full max-w-sm ml-9 bg-white rounded-2xl border border-indigo-200 shadow-md p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-black text-xs">
                      <Home size={15} className="text-blue-600" />
                      <span>HOME SERVICE PASSPORT</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                      {msg.homePassport.totalServices} Services
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {msg.homePassport.appliances.map((app, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900">{app.serviceName}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${app.isMaintenanceDue ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'}`}>
                            {app.isMaintenanceDue ? 'Due' : 'Healthy'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">Serviced on {app.lastServiceDate} by <strong>{app.technician}</strong></p>
                        <button
                          onClick={() => handleSend(`Book ${app.serviceName}`)}
                          className="mt-1 text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer border-none bg-transparent"
                        >
                          <span>Schedule Maintenance Visit</span> →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CARD 2: ACTIVE BOOKING & LIVE TRACKING CARD */}
              {msg.bookingSummary && (
                <div className="mt-3 w-full max-w-sm ml-9 bg-white rounded-2xl border border-blue-200 shadow-md p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-blue-700 uppercase tracking-tight flex items-center gap-1.5">
                      <Compass size={15} className="text-blue-600" />
                      Active Booking Status
                    </span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {msg.bookingSummary.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1.5">
                    <p><strong className="text-slate-900">Service:</strong> {msg.bookingSummary.service}</p>
                    <p><strong className="text-slate-900">Technician:</strong> {msg.bookingSummary.technician}</p>
                    <p><strong className="text-slate-900">Location:</strong> {msg.bookingSummary.address}</p>
                  </div>

                  {/* Actions for active booking */}
                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    {onOpenChat && (
                      <button
                        onClick={() => {
                          onOpenChat(msg.bookingSummary.id);
                          onClose();
                        }}
                        className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-blue-200"
                      >
                        <MessageSquare size={13} />
                        <span>Chat</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleSend('Reschedule booking')}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border-none"
                    >
                      <Calendar size={13} />
                      <span>Reschedule</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CARD 3: WALLET & REWARDS CARD */}
              {msg.walletData && (
                <div className="mt-3 w-full max-w-sm ml-9 bg-white rounded-2xl border border-slate-200 shadow-md p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <CreditCard size={15} className="text-blue-600" />
                      Fixvo Wallet & Points
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
                      {msg.walletData.tier}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                      <p className="text-[10px] text-blue-600 font-bold uppercase">Balance</p>
                      <p className="text-base font-black text-slate-900">₹{msg.walletData.walletBalance}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                      <p className="text-[10px] text-amber-700 font-bold uppercase">Loyalty Pts</p>
                      <p className="text-base font-black text-slate-900">{msg.walletData.loyaltyPoints} Pts</p>
                    </div>
                  </div>

                  {msg.walletData.activeCoupons && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] text-slate-500 font-extrabold uppercase">Available Coupon Code</p>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-dashed border-slate-300">
                        <span className="font-mono font-extrabold text-blue-700 text-xs">{msg.walletData.activeCoupons[0].code}</span>
                        <span className="text-[10px] font-bold text-slate-600">{msg.walletData.activeCoupons[0].discount}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CARD 4: PREFERRED / SAME TECHNICIAN CARD */}
              {msg.preferredTechnician && (
                <div className="mt-3 w-full max-w-sm ml-9 bg-white rounded-2xl border border-emerald-200 shadow-md p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                      <UserCheck size={15} className="text-emerald-600" />
                      Matched Previous Specialist
                    </span>
                    <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg">
                      👨‍🔧
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{msg.preferredTechnician.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">⭐ {msg.preferredTechnician.rating} Rating • {msg.preferredTechnician.area}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSend(`Book with ${msg.preferredTechnician.name}`)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-none"
                  >
                    Confirm Technician {msg.preferredTechnician.name}
                  </button>
                </div>
              )}

              {/* CARD 5: FIXVO BOOKING DRAFT & CONFIRMATION CARD */}
              {msg.draft && msg.draft.serviceId && (
                <div className="mt-3 w-full max-w-sm ml-9 bg-white rounded-2xl border border-blue-200 shadow-md p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-xs tracking-tight">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>FIXVO BOOKING DRAFT</span>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                      Step: Ready
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Wrench className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">Service: </span>
                        <span className="text-slate-700 font-semibold">{msg.draft.serviceName || msg.draft.serviceId}</span>
                      </div>
                    </div>

                    {msg.draft.problemDescription && (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900">Problem: </span>
                          <span className="text-slate-600">{msg.draft.problemDescription}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">Location: </span>
                        <span className="text-slate-700">{msg.draft.area || 'Madanapalle'}</span>
                        {msg.draft.detailedAddress && (
                          <p className="text-[11px] text-slate-500">{msg.draft.detailedAddress}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">Scheduled: </span>
                        <span className="text-slate-700">{msg.draft.date} • {msg.draft.timeSlot || 'Morning'}</span>
                      </div>
                    </div>

                    {msg.availableTechnicians && msg.availableTechnicians.length > 0 && (
                      <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900">Top Match: </span>
                          <span className="text-slate-700 font-semibold">{msg.availableTechnicians[0].name} (⭐{msg.availableTechnicians[0].rating})</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApplyToFormAndEdit(msg.draft)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-all cursor-pointer border-none"
                    >
                      <Edit3 size={13} />
                      <span>Edit in Form</span>
                    </button>

                    <button
                      onClick={() => handleConfirmFromAi(msg.draft)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer border-none"
                    >
                      <CheckCircle size={13} />
                      <span>Confirm Booking</span>
                    </button>
                  </div>
                </div>
              )}

              <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium pl-9">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Fixvo AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {suggestedActions.length > 0 && !isProcessing && (
          <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(action)}
                className="shrink-0 px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-full text-[11px] font-semibold text-slate-600 transition-all cursor-pointer whitespace-nowrap"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Listening... Tap to stop' : 'Tap to speak'}
              className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : (speechLang === 'te-IN' ? "తెలుగులో చెప్పండి లేదా టైప్ చేయండి..." : "Ask Fixvo AI (e.g. 'My Home Passport', 'Book AC repair')...")}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputVal.trim() || isProcessing}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20 transition-all cursor-pointer border-none"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Voice status label */}
          {isListening && (
            <p className="text-[10px] text-rose-600 font-bold text-center mt-1.5 animate-pulse">
              🎙️ Listening ({speechLang === 'te-IN' ? 'Telugu' : 'English'})... Speak your request now.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default FixvoAiAssistantModal;
