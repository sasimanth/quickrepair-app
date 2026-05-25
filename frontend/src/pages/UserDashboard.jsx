import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api'; 
import { globalCategories, globalServices, getDbServices } from '../data/services';
import { Calendar, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, Plus, LayoutDashboard, Wrench, Settings, Star, User, ChevronRight, MessageSquare, Camera, UploadCloud, Loader2, Shield, ShieldCheck, HelpCircle, Truck, Home, Search, Eye, Zap, Maximize2, Hash, Layers, Paintbrush, Tv, X } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import ReviewModal from '../components/ReviewModal';
import PaymentModal from '../components/PaymentModal';
import SettingsModal from '../components/SettingsModal';
import PremiumModal from '../components/PremiumModal';
import { CreditCard, Sparkles, PhoneCall } from 'lucide-react';
import { socket } from '../services/socket';
import LoadingSkeleton from '../components/LoadingSkeleton';

const formatPhoneLink = (phone) => {
  if (!phone) return '';
  let digits = phone.toString().replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return `+${digits}`;
};

const UserDashboard = () => {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryParams = new URLSearchParams(location.search);
  const initialShowForm = queryParams.get('action') === 'book';
  const initialShowPremium = queryParams.get('action') === 'premium';
  const initialService = queryParams.get('service');
  const [showForm, setShowForm] = useState(initialShowForm);
  const [showPremiumModal, setShowPremiumModal] = useState(initialShowPremium);
  const [services, setServices] = useState(globalServices);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Step 1: Form, Step 2: Technician Selection
  const [step, setStep] = useState(1);
  const [fetchingTechs, setFetchingTechs] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [chatBookingId, setChatBookingId] = useState(null);
  const handleCloseChat = () => {
    setChatBookingId(null);
    setBookings(prev => prev.map(b => b._id === chatBookingId ? { ...b, unreadCount: 0 } : b));
  };
  const [reviewBooking, setReviewBooking] = useState(null);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [viewReasonBooking, setViewReasonBooking] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [liveLocations, setLiveLocations] = useState({}); // { techId: [lat, lng] }
  const [profile, setProfile] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [submittingCancellation, setSubmittingCancellation] = useState(false);

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    setSubmittingCancellation(true);
    try {
      await api.put(`/bookings/${cancelBookingId}/cancel`, { reason: cancellationReason });
      showToast('Booking Cancelled ❌', 'Your booking request was successfully cancelled.', 'success');
      setCancelBookingId(null);
      setCancellationReason('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setSubmittingCancellation(false);
    }
  };


  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (error) {
      console.warn('AudioContext failed to synthesize chime', error);
    }
  };

  const showToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    playChime();
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const pendingStr = localStorage.getItem('pendingBooking');
  const pendingData = pendingStr ? JSON.parse(pendingStr) : null;
  
  const [formData, setFormData] = useState(pendingData || {
    serviceId: initialService || '', date: '', deviceType: '', problemDescription: '', location: '', detailedAddress: '', landmark: '', gpsLocation: null, imageUrl: '',
    serviceOption: 'direct',
    unknownProblem: false
  });

  const selectedServiceObj = useMemo(() => {
    return services.find(s => s.id === formData.serviceId) || globalServices.find(s => s.id === formData.serviceId);
  }, [services, formData.serviceId]);
  const categoryId = selectedServiceObj ? selectedServiceObj.categoryId : '';
  const serviceNameLower = selectedServiceObj?.name?.toLowerCase() || '';

  useEffect(() => {
    getDbServices().then(setServices);
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 5000);

    const handleLocationUpdate = (data) => {
       setLiveLocations(prev => ({ ...prev, [data.techId]: [data.lat, data.lng] }));
    };

    // Subscribe to WebSocket location updates
    socket.on('location_update', handleLocationUpdate);

    return () => {
      clearInterval(interval);
      socket.off('location_update', handleLocationUpdate);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'premium') {
      setShowPremiumModal(true);
    }
    if (params.get('action') === 'book') {
      setShowForm(true);
      const serviceId = params.get('service');
      if (serviceId) {
        setFormData(prev => ({ ...prev, serviceId }));
      }
    }
  }, [location.search]);

  // Register private room for customer notification/alerts & handle status updates
  useEffect(() => {
    if (profile?.userId) {
      socket.emit('register_user', profile.userId);
    }
  }, [profile?.userId]);

  useEffect(() => {
    if (!profile?.userId) return;

    const handleJobUpdate = (updatedJob) => {
      fetchData(false);

      const isSelfGenerated = ['quote_approved'].includes(updatedJob.status);
      const isCustomerCancel = updatedJob.status === 'cancelled' && updatedJob.cancelledBy === 'customer';

      if (!isSelfGenerated && !isCustomerCancel) {
        showToast(
          '🔄 Repair Status Updated', 
          `Your ${updatedJob.serviceName} status is now: ${updatedJob.status.replace(/_/g, ' ').toUpperCase()}`, 
          'info'
        );
      }
    };

    socket.on('job_update', handleJobUpdate);

    return () => {
      socket.off('job_update', handleJobUpdate);
    };
  }, [profile?.userId]);

  // WebSocket Chat Event Handlers
  useEffect(() => {
    if (bookings.length > 0) {
      bookings.forEach(b => {
        socket.emit('join_chat', b._id);
      });
    }
  }, [bookings.length]);

  useEffect(() => {
    const handleReceiveMessage = (newMsg) => {
      setBookings(prev => prev.map(b => {
        if (b._id === newMsg.bookingId) {
          const isCurrentChatOpen = chatBookingId === newMsg.bookingId;
          return {
            ...b,
            unreadCount: isCurrentChatOpen ? b.unreadCount : (b.unreadCount || 0) + 1,
            lastMessage: {
              text: newMsg.text,
              createdAt: newMsg.createdAt,
              senderId: newMsg.senderId,
              isRead: isCurrentChatOpen
            }
          };
        }
        return b;
      }));
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [chatBookingId]);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const bookingsRes = await api.get('/bookings');
      setBookings(bookingsRes.data);
      if (globalServices.length > 0 && !formData.serviceId && document.location.pathname !== '/book') {
        const foundStr = localStorage.getItem('lastSelectedService');
        if (!foundStr) {
           // Do not default aggressively, let user select
           // setFormData(prev => ({ ...prev, serviceId: globalServices[0].id }));
        }
      }
      const profileRes = await api.get('/users/profile');
      setProfile(profileRes.data);

      // Tell WebSocket server which technicians we want to track
      bookingsRes.data.filter(b => b.status === 'accepted' && b.providerId).forEach(b => {
          socket.emit('track_tech', b.providerId);
      });

    } catch (error) { console.error('Error fetching dashboard data:', error); } 
    finally { 
      if (showLoading) setLoading(false); 
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setStep(2);
    setFetchingTechs(true);
    
    const fetchTechnicians = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (formData.location) {
          queryParams.append('area', formData.location);
        }
        if (formData.serviceId) {
          queryParams.append('serviceId', formData.serviceId);
        }
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const res = await api.get(`/technicians/nearby${queryString}`);
        const realTechs = res.data || [];
        setTechnicians(realTechs);
      } catch (err) {
        console.error('Failed to grab technicians', err);
        setTechnicians([]);
      } finally {
        setFetchingTechs(false);
      }
    };

    fetchTechnicians();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Please select an image under 5MB.");
      return;
    }
    
    setUploadingImage(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, mediaUrl: reader.result, mediaType: file.type }));
      setUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Failed to process image. Please try again.');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };


  const handleAutoDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({ 
            ...prev, 
            gpsLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } 
          }));
        },
        () => {
          alert("Please allow location access in your browser to share live GPS.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const [isBooking, setIsBooking] = useState(false);

  const handleFinalSubmit = async () => {
    if (!selectedTech) {
      alert("Please select a technician first.");
      return;
    }
    if (isBooking) return;
    
    try {
      setIsBooking(true);
      const selectedServiceName = globalServices.find(s => s.id === formData.serviceId)?.name || 'Unknown Service';
      const payload = {
        ...formData,
        service: selectedServiceName, // explicit specific service name
        providerId: selectedTech.id, // explicit specific assignment
        promoCode: promoCode,
        discountPercentage: discountAmount
      };
      
      await api.post('/bookings', payload);
      
      localStorage.removeItem('pendingBooking');
      // Reset state
      setShowForm(false);
      setStep(1);
      setSelectedTech(null);
      setFormData({ 
        serviceId: globalServices.length > 0 ? globalServices[0].id : '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        deviceType: '',
        issue: '',
        photo: null
      });
      fetchData(); 
    } catch (error) {
      alert('Failed to submit booking request. Check the console.');
      console.error(error);
    } finally {
      setIsBooking(false);
    }
  };

  const [updatingJobs, setUpdatingJobs] = useState({});

  const handleQuoteApproval = async (bookingId, approved) => {
    if (updatingJobs[bookingId]) return;
    // Optimistic update
    setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: approved ? 'in_progress' : 'cancelled' } : b));
    setUpdatingJobs(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      await api.put(`/bookings/${bookingId}/approve-quote`, { approved });
    } catch (error) {
       const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
       alert(`Failed to update quote status: ${errorMsg}`);
       console.error(error);
       fetchData(); // Revert on failure
    } finally {
       setUpdatingJobs(prev => ({ ...prev, [bookingId]: false }));
    }
  };



  const handleLightningMatch = async () => {
    if (technicians.length === 0 || isBooking) return;
    
    // Sort logic: High rating first, then by jobs completed
    const bestTech = [...technicians].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.jobsCompleted - a.jobsCompleted;
    })[0];
    
    setSelectedTech(bestTech);
    setIsBooking(true);
    
    // Auto submit after a dramatic pause
    setTimeout(async () => {
      try {
        const selectedServiceName = globalServices.find(s => s.id === formData.serviceId)?.name || 'Unknown Service';
        const payload = {
          ...formData,
          service: selectedServiceName,
          providerId: bestTech.id
        };
        await api.post('/bookings', payload);
        
        localStorage.removeItem('pendingBooking');
        setShowForm(false);
        setStep(1);
        setSelectedTech(null);
        setFormData({ 
          serviceId: globalServices.length > 0 ? globalServices[0].id : '', date: '', deviceType: '', problemDescription: '', location: '', detailedAddress: '', landmark: '', gpsLocation: null, imageUrl: '',
          serviceOption: 'direct', unknownProblem: false
        });
        fetchData(); 
      } catch (error) {
        alert('Failed to auto-dispatch. Check the console.');
      } finally {
        setIsBooking(false);
      }
    }, 1500);
  };

  const cancelRequest = () => {
    setShowForm(!showForm);
    setStep(1);
    setSelectedTech(null);
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Finding Tech' },
      assigned: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock, label: 'Assigned' },
      queued: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Tech is Busy - In Queue' },
      accepted: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CheckCircle, label: 'Accepted by Tech' },
      on_the_way: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Truck, label: 'Tech On Way' },
      arrived: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: MapPin, label: 'Tech Arrived' },
      in_progress: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Wrench, label: 'Work In Progress' },
      quote_pending: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CreditCard, label: 'Pending Quote Approval' },
      completed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Completed' },
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
      cancelled: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle, label: 'Cancelled' }
    };
    const { color, icon: Icon, label } = config[status] || { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock, label: status };
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${color}`}>
        <Icon size={14} />
        {label || status}
      </span>
    );
  };

  const getPaymentStatusConfig = (status, method) => {
    const isCash = method === 'cash';
    const config = {
      pending: {
        label: isCash ? 'Cash Payment Pending' : 'Payment Pending',
        bg: 'bg-amber-50/85 text-amber-850 border-amber-200/60',
        badge: 'bg-amber-100/80 text-amber-800 border-amber-200'
      },
      awaiting_payment: {
        label: 'Awaiting Payment',
        bg: 'bg-amber-50/85 text-amber-850 border-amber-200/60',
        badge: 'bg-amber-100/80 text-amber-800 border-amber-200'
      },
      cash_pending: {
        label: 'Cash Payment Pending',
        bg: 'bg-amber-50/85 text-amber-850 border-amber-200/60',
        badge: 'bg-amber-100/80 text-amber-800 border-amber-200'
      },
      processing: {
        label: 'Payment Processing',
        bg: 'bg-amber-50/85 text-amber-850 border-amber-200/60',
        badge: 'bg-amber-100/80 text-amber-800 border-amber-200'
      },
      completed: {
        label: 'Paid In Full',
        bg: 'bg-emerald-50/85 text-emerald-800 border-emerald-200/60',
        badge: 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
      },
      failed: {
        label: 'Payment Failed',
        bg: 'bg-rose-50/85 text-rose-800 border-rose-200/60',
        badge: 'bg-rose-100/80 text-rose-800 border-rose-200'
      },
      refunded: {
        label: 'Payment Refunded',
        bg: 'bg-slate-50/85 text-slate-800 border-slate-200/60',
        badge: 'bg-slate-100/80 text-slate-800 border-slate-200'
      }
    };
    return config[status] || {
      label: status || 'Pending',
      bg: 'bg-amber-50/85 text-amber-850 border-amber-200/60',
      badge: 'bg-amber-100/80 text-amber-800 border-amber-200'
    };
  };

  const [expandedBookings, setExpandedBookings] = useState({});
  const [filterTab, setFilterTab] = useState('all');

  const toggleExpand = (id) => {
    setExpandedBookings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredBookings = bookings.filter(b => {
    const query = searchQuery.toLowerCase();
    const matchesService = (b.serviceId?.name || b.serviceName || '').toLowerCase().includes(query);
    const matchesId = b._id.toLowerCase().includes(query);
    const matchesStatus = b.status.toLowerCase().includes(query);
    const matchesSearch = matchesService || matchesId || matchesStatus;
    
    if (filterTab === 'active') {
      return matchesSearch && !['completed', 'cancelled'].includes(b.status);
    } else if (filterTab === 'completed') {
      return matchesSearch && b.status === 'completed';
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 mt-4 sm:mt-10">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100/80">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="p-3 sm:p-4 bg-slate-900 rounded-2xl sm:rounded-[1.25rem] shadow-xl shadow-slate-900/20 text-white">
              <LayoutDashboard size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Your Dashboard</h1>
                {profile?.isPremium && (
                  <span className="flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm">
                    <Sparkles size={12} className="text-amber-500 sm:w-3.5 sm:h-3.5" /> Fixvo Plus
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-base text-slate-500 font-medium mt-0.5 sm:mt-1">Manage repairs and hardware requests</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:flex md:items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
            <button
               onClick={() => setShowSettings(true)}
               className="col-span-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-xs sm:text-sm border border-slate-200 shadow-sm"
            >
              <Settings size={18} /> Settings
            </button>
            <button
              onClick={cancelRequest}
              className={`col-span-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all duration-300 shadow-sm text-xs sm:text-sm ${
                showForm 
                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10'
              }`}
            >
              {showForm ? <XCircle size={18} /> : <Plus size={18} />}
              {showForm ? 'Cancel Request' : 'Book Repair'}
            </button>
          </div>
        </div>

        {profile?.isPremium ? (
          <div className="bg-gradient-to-r from-slate-950 to-indigo-950 border border-amber-500/30 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_4px_30px_rgba(245,158,11,0.08)] relative overflow-hidden text-white animate-in fade-in duration-300">
            <div className="absolute top-[-50%] right-[-10%] w-[30%] h-[150%] bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-[80px] pointer-events-none"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/15">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold tracking-tight text-white">Fixvo Plus Active Member</h3>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-400/30 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  Priority Dispatch • Zero Inspection Fees • 15% Member Discount
                </p>
              </div>
            </div>

            {/* Savings & Benefits Panel */}
            <div className="flex items-center gap-5 bg-white/5 border border-white/5 rounded-2xl p-3 shrink-0 relative z-10 backdrop-blur-sm">
              <div className="text-center px-2">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Inspections Used</p>
                <p className="text-lg font-black text-white mt-0.5">{profile?.premiumBenefits?.inspectionsUsed || 0}</p>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <div className="text-center px-2">
                <p className="text-[9px] text-amber-400 font-black uppercase tracking-wider">Total Saved</p>
                <p className="text-lg font-black text-amber-400 mt-0.5">₹{profile?.premiumBenefits?.totalSaved || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#161D2E]/90 to-[#0B0F19]/90 border border-amber-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-[60px] pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 text-center sm:text-left">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  Upgrade to Fixvo Plus
                </h3>
                <p className="text-xs text-slate-400 font-semibold max-w-md">
                  Get 15% discount on all quotes, zero inspection fees (save ₹99), and priority dispatch.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowPremiumModal(true)}
              className="relative z-10 w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap cursor-pointer border-none outline-none"
            >
              Upgrade to Plus
            </button>
          </div>
        )}

        {/* Workflow container */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showForm ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden">
            <div className={`absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-700 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Wrench className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-800">
                  {step === 1 ? 'Schedule a Repair' : 'Select a Technician'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>1. Details</span>
                <ChevronRight size={16} className="text-slate-300"/>
                <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>2. Select Tech</span>
              </div>
            </div>
            
            {/* --- STEP 1: FORM --- */}
            {step === 1 && (
              services.length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                  <AlertCircle />
                  <p className="font-medium">No services are currently available. Please contact support.</p>
                </div>
              ) : (
                <form onSubmit={handleInitialSubmit} className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
                  <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4 gap-3 shadow-inner">
                    <div className="flex items-center gap-3">
                      <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-[ping_2s_infinite]"></span>
                      <p className="text-amber-800 font-semibold text-sm">
                        High Demand: Only <span className="font-extrabold text-amber-600">2 technicians</span> available near you right now. 
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Settings size={16} className="text-slate-400"/> Select Service</label>
                      <select
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                        required
                      >
                        {globalCategories.map(cat => (
                          <optgroup key={cat.id} label={cat.name}>
                            {globalServices.filter(s => s.categoryId === cat.id).map(service => (
                              <option key={service.id} value={service.id}>{service.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Calendar size={16} className="text-slate-400"/> Preferred Date</label>
                      <input
                        type="date"
                        required
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
                    {/* Render Category-Specific Fields */}
                    {categoryId === 'repair' && (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Smartphone size={16} className="text-slate-400"/> Device Type</label>
                        <input type="text" placeholder="e.g. iPhone 13, HP Pavilion" required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.deviceType || ''} onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })} />
                      </div>
                    )}

                    {categoryId === 'cleaning' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Home size={16} className="text-slate-400"/> House / Premise Type</label>
                          <select required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.houseType || ''} onChange={(e) => setFormData({ ...formData, houseType: e.target.value })}>
                            <option value="">Select premise type</option>
                            <option value="1 BHK">1 BHK Apartment</option>
                            <option value="2 BHK">2 BHK Apartment</option>
                            <option value="3 BHK">3 BHK Apartment</option>
                            <option value="4 BHK">4 BHK+ Apartment</option>
                            <option value="Villa">Independent House / Villa</option>
                            <option value="Office">Commercial Office Space</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Maximize2 size={16} className="text-slate-400"/> Area Size (Sq Ft)</label>
                          <input type="text" placeholder="e.g. 1200 sq ft" required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.areaSize || ''} onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Hash size={16} className="text-slate-400"/> Number of Rooms/Bathrooms</label>
                          <input type="number" min="1" placeholder="e.g. 3" required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.numberOfRooms || ''} onChange={(e) => setFormData({ ...formData, numberOfRooms: e.target.value })} />
                        </div>
                      </>
                    )}

                    {(categoryId === 'painting' || serviceNameLower.includes('paint')) && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Home size={16} className="text-slate-400"/> Premise / Area to Paint</label>
                          <select required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.houseType || ''} onChange={(e) => setFormData({ ...formData, houseType: e.target.value })}>
                            <option value="">Select option</option>
                            <option value="1 BHK">1 BHK Interior</option>
                            <option value="2 BHK">2 BHK Interior</option>
                            <option value="3 BHK">3 BHK Interior</option>
                            <option value="Single Room">Single Room / Accent Wall</option>
                            <option value="Exterior">Exterior Painting</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Maximize2 size={16} className="text-slate-400"/> Wall Area Size (Sq Ft)</label>
                          <input type="text" placeholder="e.g. 1500 sq ft" required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.wallArea || ''} onChange={(e) => setFormData({ ...formData, wallArea: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Layers size={16} className="text-slate-400"/> Location Type</label>
                          <select required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.indoorOutdoor || ''} onChange={(e) => setFormData({ ...formData, indoorOutdoor: e.target.value })}>
                            <option value="">Select location type</option>
                            <option value="Indoor">Indoor Only</option>
                            <option value="Outdoor">Outdoor Only</option>
                            <option value="Both">Both (Indoor & Outdoor)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Paintbrush size={16} className="text-slate-400"/> Paint Preference</label>
                          <select required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.paintPreference || ''} onChange={(e) => setFormData({ ...formData, paintPreference: e.target.value })}>
                            <option value="">Select paint quality</option>
                            <option value="Premium Gloss">Premium Gloss / Emulsion</option>
                            <option value="Standard Matte">Standard Matte</option>
                            <option value="Economy">Economy Acrylic</option>
                            <option value="Weatherproof">Weatherproof Exterior Protection</option>
                          </select>
                        </div>
                      </>
                    )}

                    {categoryId === 'installation' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Tv size={16} className="text-slate-400"/> Appliance / Item to Install</label>
                          <input type="text" placeholder="e.g. Split AC 1.5 Ton, 55 inch TV" required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.applianceType || ''} onChange={(e) => setFormData({ ...formData, applianceType: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> Installation Location</label>
                          <input type="text" placeholder="e.g. Living Room Brick Wall" required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.installationLocation || ''} onChange={(e) => setFormData({ ...formData, installationLocation: e.target.value })} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Layers size={16} className="text-slate-400"/> Accessories Needed</label>
                          <select required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" value={formData.accessoriesNeeded || ''} onChange={(e) => setFormData({ ...formData, accessoriesNeeded: e.target.value })}>
                            <option value="">Select option</option>
                            <option value="None">None (I have all accessories)</option>
                            <option value="Wall Mount Bracket">Wall Mount Bracket (+₹299)</option>
                            <option value="Extension Pipe">Extension Copper Pipe (+₹599/m)</option>
                            <option value="Full Kit">Standard Installation Kit</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Standard Town/Area selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> Town / Area</label>
                      <select 
                        required 
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" 
                        value={formData.location || ''} 
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      >
                        <option value="">Select your area</option>
                        <option value="Madanapalle">Madanapalle</option>
                        <option value="Kadiri">Kadiri</option>
                        <option value="Rayachoty">Rayachoty</option>
                        <option value="Galiveedu">Galiveedu</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Camera size={16} className="text-slate-400"/> Device Photo (Optional)</label>
                    <div className="relative group border-2 border-dashed border-slate-300 rounded-xl p-4 transition-all hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center min-h-[100px] bg-slate-50 cursor-pointer overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/*,video/mp4,video/quicktime" 
                        onChange={handleImageUpload} 
                        disabled={uploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      />
                      {uploadingImage ? (
                        <div className="flex flex-col items-center text-blue-500">
                          <Loader2 className="animate-spin mb-2" size={24} />
                          <span className="text-sm font-bold">Uploading...</span>
                        </div>
                      ) : formData.mediaUrl ? (
                        <div className="flex flex-col items-center text-emerald-600">
                          <CheckCircle className="mb-2" size={28} />
                          <span className="text-sm font-bold">Media Uploaded Successfully!</span>
                          {formData.mediaType?.startsWith('video') ? (
                            <video src={formData.mediaUrl} className="mt-3 w-16 h-16 object-cover rounded-lg border border-emerald-200 shadow-sm" />
                          ) : (
                            <img src={formData.mediaUrl} alt="Preview" className="mt-3 w-16 h-16 object-cover rounded-lg border border-emerald-200 shadow-sm" />
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-500 group-hover:text-blue-600 transition-colors">
                          <UploadCloud className="mb-2" size={28} />
                          <span className="text-sm font-bold">Click or drag a photo here</span>
                          <span className="text-xs mt-1 text-slate-400">JPG, PNG, MP4 up to 20MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                  

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><HelpCircle size={16} className="text-slate-400"/> Describe the problem</label>
                      <div className="flex items-start gap-2 mb-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <input 
                          type="checkbox" 
                          id="unknownProblem" 
                          checked={formData.unknownProblem} 
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData({
                              ...formData,
                              unknownProblem: checked,
                              serviceOption: checked ? 'inspection' : 'direct'
                            });
                          }} 
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" 
                        />
                        <label htmlFor="unknownProblem" className="text-sm text-slate-700 font-bold cursor-pointer">I don't know the exact issue (Technician will diagnose)</label>
                      </div>
                      <textarea rows="3" placeholder={formData.unknownProblem ? "Tell us what happened (e.g., screen went black, strange noise)..." : "Describe the issue you're facing in detail..."} required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium resize-none" value={formData.problemDescription} onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}></textarea>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Wrench size={16} className="text-slate-400"/> Service Visit Type
                      </label>
                      
                      <div className="space-y-3">
                        {/* Inspection Visit Card */}
                        <label className={`relative block p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] ${formData.serviceOption === 'inspection' ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/50'}`}>
                           <div className="flex items-start gap-3">
                             <input type="radio" name="serviceOption" checked={formData.serviceOption === 'inspection'} onChange={() => setFormData({...formData, serviceOption: 'inspection'})} className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                             <div className="flex-grow">
                               <div className="flex items-center gap-2 flex-wrap">
                                 <span className="font-extrabold text-slate-800 flex items-center gap-1.5"><Eye size={16} className="text-indigo-600" /> Inspection Visit</span>
                                 {formData.unknownProblem && (
                                   <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white animate-pulse shadow-sm">
                                     ✨ Recommended for Unknown Issues
                                   </span>
                                 )}
                               </div>
                               <span className="block text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                                 Recommended when issue is unknown or complex. Technician visits first to diagnose and provides a quote. Free booking – pay only after approving the final quote.
                               </span>
                             </div>
                           </div>
                        </label>
                        
                        {/* Direct Repair Visit Card */}
                        <label className={`relative block p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] ${formData.serviceOption === 'direct' ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/50'}`}>
                           <div className="flex items-start gap-3">
                             <input type="radio" name="serviceOption" checked={formData.serviceOption === 'direct'} onChange={() => setFormData({...formData, serviceOption: 'direct'})} className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                             <div className="flex-grow">
                               <div className="flex items-center gap-2 flex-wrap">
                                 <span className="font-extrabold text-slate-800 flex items-center gap-1.5"><Zap size={16} className="text-amber-500" /> Direct Repair Visit</span>
                                 {!formData.unknownProblem && (
                                   <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-sm">
                                     ⚡ Faster for Known Repairs
                                   </span>
                                 )}
                               </div>
                               <span className="block text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                                 For simple, known services like cleaning, minor repairs, or installation. Technician comes fully prepared with the necessary tools to fix it immediately.
                               </span>
                             </div>
                           </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    Find Nearby Technicians 🔍
                  </button>
                </form>
              )
            )}

            {/* --- STEP 2: TECHNICIAN SELECTION --- */}
            {step === 2 && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-500">
                {fetchingTechs ? (
                  <div className="flex flex-col items-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="font-semibold text-slate-600 animate-pulse">Scanning your area for top-rated technicians...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-slate-600 font-medium pb-2 border-b border-slate-100">We found several qualified technicians nearby. Please select one for direct assignment.</p>
                    
                    {technicians.length > 0 && (
                      <button
                        onClick={handleLightningMatch}
                        disabled={isBooking}
                        className={`w-full relative overflow-hidden group text-white rounded-2xl p-6 shadow-xl transition-all duration-300 transform ${isBooking ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1'}`}
                      >
                        {!isBooking && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>}
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 shadow-inner text-left">
                          <ShieldCheck size={24} className="text-emerald-600 flex-shrink-0" />
                          <div>
                            <p className="font-extrabold text-emerald-800">100% Free Booking</p>
                            <p className="text-sm text-emerald-700 mt-1 font-medium">Final pricing will be provided after the technician inspects the issue. You only pay after approving the final quote.</p>
                          </div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white">
                              <Sparkles size={28} />
                            </div>
                            <div className="text-left">
                              <h3 className="text-xl font-black tracking-tight">{isBooking ? 'Auto-Dispatching...' : '⚡ Lightning Match'}</h3>
                              <p className="text-indigo-100 font-medium text-sm mt-0.5">{isBooking ? 'Matching you with the best available tech...' : 'Auto-assign the highest-rated technician near you instantly'}</p>
                            </div>
                          </div>
                          {(isBooking || (selectedTech && selectedTech === technicians.sort((a,b) => b.rating - a.rating)[0])) && (
                            <Loader2 size={24} className="animate-spin text-white mr-4" />
                          )}
                        </div>
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {technicians.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-slate-50 border border-slate-100 rounded-2xl">
                          <h3 className="text-xl font-bold text-slate-700 mb-2">No Technicians Available</h3>
                          <p className="text-slate-500">We couldn't find any real verified technicians covering your exact area right now. Please try again later or expand your search location.</p>
                        </div>
                      ) : (
                        technicians.map((tech) => (
                           <div 
                             key={tech.id}
                             onClick={() => setSelectedTech(tech)}
                             className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 ${selectedTech?.id === tech.id ? 'border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-100 transform scale-[1.02]' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm bg-white'}`}
                           >
                             <div className="flex items-center gap-4 mb-4">
                               <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl shadow-inner">
                                 {tech.avatar || '👨‍🔧'}
                               </div>
                               <div>
                                 <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                                    {tech.name}
                                    <ShieldCheck size={16} className="text-emerald-500" title="Identity Verified"/>
                                    <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 rounded uppercase tracking-widest font-black ml-0.5">Verified</span>
                                 </h3>
                                 <div className="flex items-center text-amber-500 text-sm font-bold">
                                   <Star size={14} className="fill-current mr-1"/>
                                   {tech.rating} <span className="text-slate-400 font-normal ml-1 border-l border-slate-300 pl-1">{tech.jobsCompleted || 0} jobs</span>
                                 </div>
                               </div>
                             </div>
                             
                             <div className="space-y-2 text-sm text-slate-600 pt-2 border-t border-slate-100/50">
                               <div className="flex justify-between">
                                 <span className="font-medium text-slate-400">Experience</span>
                                 <span className="font-bold text-slate-700">{tech.experience || 'New'}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="font-medium text-slate-400">Distance</span>
                                 <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{tech.distance || 'Nearby'}</span>
                               </div>
                             </div>
                           </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="text" 
                          placeholder="Promo Code (e.g. FIXVO10)" 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl focus:border-indigo-500 outline-none uppercase font-medium text-slate-700"
                        />
                        <button 
                          onClick={(e) => {
                             e.preventDefault();
                             if (promoCode === 'FIXVO10') {
                               if (bookings.length === 0) {
                                 setDiscountAmount(10);
                                 alert('Promo code applied! 10% discount will be applied to final quote.');
                               } else {
                                 setDiscountAmount(0);
                                 alert('FIXVO10 promo code is only valid for your first booking.');
                               }
                             } else {
                               setDiscountAmount(0);
                               alert('Invalid promo code');
                             }
                          }}
                          className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700"
                        >
                          Apply
                        </button>
                      </div>
                      {discountAmount > 0 && <p className="text-emerald-600 text-sm font-bold mt-2">✓ 10% Discount Applied to Final Bill</p>}
                    </div>

                    <div className="flex gap-4 pt-6 mt-4 border-t border-slate-100">
                      <button 
                        onClick={() => setStep(1)} 
                        disabled={isBooking}
                        className="py-3 px-6 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-colors disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button 
                        onClick={handleFinalSubmit}
                        disabled={!selectedTech || isBooking}
                        className={`flex-1 py-3 px-6 font-bold rounded-xl shadow-lg transition-all transform flex items-center justify-center gap-2 ${selectedTech && !isBooking ? 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                      >
                        {isBooking ? <Loader2 className="animate-spin" size={20} /> : null}
                        {isBooking ? 'Booking...' : `Send Request to ${selectedTech ? selectedTech.name.split(' ')[0] : 'Technician'} 🚀`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>



        {/* History Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pt-4">
          <h2 className="text-2xl font-bold text-slate-800">Your Bookings</h2>
          {/* Mobile search bar if needed, otherwise removed to avoid duplicate */}
          <div className="relative md:hidden w-full sm:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search bookings..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700"
             />
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={2} />
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <PackageSearch className="text-blue-500" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Bookings Found</h3>
            <p className="text-slate-500 max-w-sm text-center">We couldn't find any bookings matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredBookings.map((booking) => {
              const isCompleted = booking.status === 'completed';
              return (
              <div key={booking._id} className={`group bg-white rounded-[2rem] p-6 sm:p-8 border ${expandedBookings[booking._id] ? 'border-indigo-300 shadow-md' : 'border-slate-100/80 shadow-sm'} hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden relative`}>
                <div className="relative z-10">
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 cursor-pointer"
                    onClick={() => toggleExpand(booking._id)}
                  >
                    <div className="space-y-2 w-full">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200/60 text-[10px] font-black rounded uppercase tracking-widest">
                        {booking.serviceId?.name || booking.serviceName || 'Device Repair'}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        ₹{booking.finalQuote ? booking.finalQuote : (booking.serviceId?.price || 0)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-sm font-medium">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {booking.date ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pending'}</span>
                        {booking.technicianName && booking.technicianName !== 'Unassigned' && (
                          <span className="flex items-center gap-1 text-indigo-600 font-extrabold uppercase text-[10px] tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">👨‍🔧 {booking.technicianName}</span>
                        )}
                      </div>
                      {!isCompleted && booking.lastMessage && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100/80 flex items-start gap-2 w-full max-w-md">
                          <MessageSquare size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                          <div className="text-[11px] text-slate-500 truncate">
                            <span className="font-semibold">{booking.lastMessage.senderId === profile?.userId ? 'You: ' : 'Tech: '}</span>
                            {booking.lastMessage.text}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-1 sm:mt-0">
                      {getStatusBadge(booking.status)}
                      {booking.status === 'completed' && !['completed', 'cash_pending'].includes(booking.paymentStatus) && (
                        <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setPaymentBooking(booking);
                           }}
                           className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                        >
                           <CreditCard size={14} /> Pay Now
                        </button>
                      )}
                      {booking.status === 'completed' && booking.paymentStatus === 'cash_pending' && (
                        <span className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-50 text-amber-700 rounded-xl border border-amber-200 whitespace-nowrap">
                          <Clock size={12} className="text-amber-500 animate-pulse" /> Awaiting Cash Confirm
                        </span>
                      )}
                      <span className="text-indigo-500 text-xs font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 whitespace-nowrap">
                        {expandedBookings[booking._id] ? 'Less Details' : 'View Details'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedBookings[booking._id] && (
                    <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                      
                      {isCompleted && (
                        <>
                          {/* Service Completion Card */}
                          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-4 flex items-start gap-4 text-blue-900 text-xs sm:text-sm font-semibold shadow-sm">
                            <div className="p-2.5 bg-blue-100/80 rounded-xl text-blue-600 shrink-0">
                              <CheckCircle size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-blue-950">Service Completed Successfully</p>
                              <p className="text-blue-800/80 font-medium text-xs mt-1">Completed on: {new Date(booking.updatedAt).toLocaleDateString()} at {new Date(booking.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              <p className="text-slate-500 font-medium text-xs mt-1">Technician: <span className="font-semibold text-slate-700">{booking.technicianName || 'Verified Technician'}</span></p>
                            </div>
                          </div>

                          {/* Payment Card */}
                          {(() => {
                            const config = getPaymentStatusConfig(booking.paymentStatus, booking.paymentMethod);
                            const isPaid = booking.paymentStatus === 'completed';
                            const isCash = booking.paymentMethod === 'cash';
                            return (
                              <div className={`${config.bg} border rounded-2xl p-5 mb-4 flex flex-col gap-4 shadow-sm`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-slate-700">
                                      <CreditCard size={18} />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-extrabold text-slate-900">Billing & Payment</h4>
                                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Mode: {booking.paymentMethod || 'Cash'}</p>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border shadow-sm ${config.badge}`}>
                                    {config.label}
                                  </span>
                                </div>
                                
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-100 flex flex-col gap-2.5">
                                  <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                                    <span>Total Bill Amount</span>
                                    <span className="text-slate-900 font-extrabold text-sm">₹{booking.finalQuote || booking.amount || 0}</span>
                                  </div>
                                  {isPaid && (
                                    <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-1.5 text-xs">
                                      {booking.transactionId && (
                                        <div className="flex justify-between items-center text-slate-500">
                                          <span>Transaction ID</span>
                                          <span className="font-mono font-semibold text-slate-800">{booking.transactionId}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center text-slate-500">
                                        <span>Payment Time</span>
                                        <span className="font-semibold text-slate-800">{new Date(booking.updatedAt).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  )}
                                  {!isPaid && isCash && (
                                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium leading-relaxed">
                                      ℹ️ Please pay the final bill amount of <strong className="text-slate-700 font-bold">₹{booking.finalQuote || booking.amount || 0}</strong> directly to the technician in cash. Once received, the technician will mark the job as paid.
                                    </div>
                                  )}
                                </div>
                                
                                {!isPaid && !isCash && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPaymentBooking(booking);
                                    }}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <CreditCard size={16} /> Pay Online Now
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      )}

                      {booking.deviceType && (
                        <div className="space-y-3 bg-slate-50 rounded-xl p-5 border border-slate-100/60 mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 text-slate-700">
                              <Smartphone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-sm text-slate-900">Device</p>
                                <p className="text-slate-600">{booking.deviceType}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-slate-700">
                              <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-sm text-slate-900 flex items-center gap-2">Location 
                                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wide border border-emerald-100">{booking.serviceLocation === 'gate' ? 'Gate Meetup' : booking.serviceLocation || 'On-site'}</span>
                                </p>
                                <p className="text-slate-600">{booking.location}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3 text-slate-700 pt-3 border-t border-slate-200/50 mt-3">
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-sm text-slate-900">Issue</p>
                              <p className="text-slate-600 line-clamp-2">{booking.problemDescription}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(booking.imageUrl || booking.mediaUrl) && (
                        <div className="flex items-start gap-3 text-slate-700 pt-2 border-t border-slate-100/80 mt-4">
                          <Camera className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm w-full max-w-sm">
                            {booking.mediaType?.startsWith('video') ? (
                              <video src={booking.mediaUrl} controls className="w-full h-auto max-h-32 object-cover hover:scale-105 transition-transform" />
                            ) : (
                              <img src={booking.mediaUrl || booking.imageUrl} alt="Device Damage" className="w-full h-auto max-h-32 object-cover hover:scale-105 transition-transform" />
                            )}
                          </div>
                        </div>
                      )}

                      {booking.status === 'accepted' && booking.serviceLocation !== 'off-site' && (
                        <div className="pt-2 border-t border-slate-100/80 space-y-3 mt-4">
                           <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                             <p className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                               <Truck size={18} className="text-indigo-500"/> Tech Status
                             </p>
                             <span className="flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold border border-indigo-100 shadow-sm">
                               <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> {booking.status === 'in_progress' ? 'On the way' : 'Technician assigned'}
                             </span>
                           </div>
                        </div>
                      )}

                      {/* Quote Approval UI */}
                      {booking.status === 'quote_pending' && (
                        <div className="mt-4 p-6 bg-slate-900 text-white rounded-2xl border border-indigo-500/50 shadow-xl animate-in fade-in zoom-in-95">
                          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                            <h4 className="text-white font-extrabold text-lg flex items-center gap-2">
                              <CreditCard size={20} className="text-emerald-400"/> Quote Proposal
                            </h4>
                            <span className="text-rose-400 text-xs font-bold uppercase tracking-wider bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 animate-pulse">
                              Approval Needed
                            </span>
                          </div>
                          
                          {/* Cost Breakdown */}
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4 space-y-2.5">
                            <div className="flex justify-between text-sm text-slate-300">
                              <span>Service / Inspection Charge:</span>
                              <span className="font-semibold text-white">₹{booking.serviceCharge || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-300">
                              <span>Spare Parts / Material:</span>
                              <span className="font-semibold text-white">₹{booking.sparePartsCost || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-300 pb-2 border-b border-white/10">
                              <span>Transport & Travel Charge:</span>
                              <span className="font-semibold text-white">₹{booking.transportCharge || 50}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                              <span className="text-base font-bold text-slate-200">Total Guaranteed Quote:</span>
                              <span className="text-2xl font-black text-emerald-400">₹{booking.finalQuote}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white/5 p-4 rounded-xl mb-4 border border-white/10 text-sm">
                            {booking.detectedIssues && (
                              <div className="mb-2">
                                <p className="text-amber-400 font-bold">Detected Issues:</p>
                                <p className="text-amber-100/80 italic mt-0.5">"{booking.detectedIssues}"</p>
                              </div>
                            )}
                            <p className="text-indigo-300 font-bold">Technician's Explanation:</p>
                            <p className="text-slate-300 italic mt-0.5">"{booking.quoteReason || 'Replaced parts and labor for fixing the root cause.'}"</p>
                            {booking.quotePhoto && (
                              <div className="mt-3 rounded-lg overflow-hidden border border-white/10 shadow-md">
                                <img src={booking.quotePhoto} className="w-full h-32 object-cover" alt="Proof" />
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <button disabled={updatingJobs[booking._id]} onClick={() => handleQuoteApproval(booking._id, false)} className="flex-1 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2">
                              {updatingJobs[booking._id] ? <Loader2 size={16} className="animate-spin"/> : 'Decline'}
                            </button>
                            <button disabled={updatingJobs[booking._id]} onClick={() => handleQuoteApproval(booking._id, true)} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all flex justify-center items-center gap-2">
                              {updatingJobs[booking._id] ? <Loader2 size={16} className="animate-spin"/> : 'Approve & Start Work'}
                            </button>
                          </div>
                        </div>
                      )}
                      
                    </div>
                  )}
                </div>
                
                {expandedBookings[booking._id] && (
                <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">
                  <div className="flex flex-wrap items-center gap-3">
                    {booking.providerId ? (
                      <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl text-indigo-700 text-sm font-bold shadow-sm border border-indigo-100">
                        <User size={16} className="text-indigo-500"/>
                        Technician Assigned
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl text-slate-500 text-sm font-bold shadow-sm border border-slate-200">
                        <User size={16} className="text-slate-400"/>
                        Finding Technician...
                      </div>
                    )}

                    {['accepted', 'on_the_way', 'arrived'].includes(booking.status) && (booking.providerPhone || booking.providerId?.phone) && (
                      <>
                        <a href={`tel:${formatPhoneLink(booking.providerPhone || booking.providerId?.phone)}`} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all shadow-emerald-200 transform hover:-translate-y-0.5">
                          <PhoneCall size={16} /> Call Technician
                        </a>
                        <a href={`https://wa.me/${(booking.providerPhone || booking.providerId?.phone || '').replace(/\D/g, '')}?text=Hi, this is regarding my Fixvo booking. My exact location is: `} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all shadow-emerald-200 transform hover:-translate-y-0.5">
                          <MapPin size={16} /> Share Location
                        </a>
                      </>
                    )}

                    {booking.providerId && (
                      <button 
                         onClick={() => setChatBookingId(booking._id)}
                         className="relative flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all shadow-indigo-100 transform hover:-translate-y-0.5"
                      >
                         <MessageSquare size={16} /> Open Chat
                         {booking.unreadCount > 0 && (
                           <span className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full text-xs font-black w-6 h-6 flex items-center justify-center border-2 border-white animate-pulse shadow-md">
                             {booking.unreadCount}
                           </span>
                         )}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
                    {booking.status === 'completed' && !booking.isReviewed && (
                      <button 
                         onClick={() => !booking.isReviewed && setReviewBooking(booking)}
                         className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-200 transition-all rounded-xl text-sm font-bold shadow-sm"
                      >
                         <Star size={16} className="text-amber-100 fill-current" /> Leave Review
                      </button>
                    )}

                    {booking.status === 'completed' && !['completed', 'cash_pending'].includes(booking.paymentStatus) && (
                      <button 
                         onClick={() => setPaymentBooking(booking)}
                         className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg transition-all shadow-blue-500/30 font-sans cursor-pointer"
                      >
                         <CreditCard size={16} /> Pay Now
                      </button>
                    )}

                    {booking.status === 'completed' && booking.paymentStatus === 'cash_pending' && (
                      <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-50 border border-amber-100 px-4 py-3 rounded-xl text-amber-700 text-sm font-bold shadow-sm">
                        <Clock size={16} className="text-amber-500 animate-pulse" /> Cash Receipt Pending Confirmation
                      </div>
                    )}

                    {booking.status === 'completed' && booking.paymentStatus === 'completed' && (
                       <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-emerald-700 text-sm font-bold shadow-sm">
                         <CheckCircle size={16} className="text-emerald-500" /> Payment & Completed
                       </div>
                    )}
                    
                    {booking.isReviewed && booking.status !== 'completed' && (
                       <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-emerald-700 text-sm font-bold shadow-sm">
                         <Star size={16} className="text-emerald-500 fill-emerald-500"/>
                         Reviewed
                       </div>
                    )}

                    {!['completed', 'cancelled', 'rejected'].includes(booking.status) && (
                      <button 
                        onClick={() => setCancelBookingId(booking._id)}
                        className="flex items-center gap-2 bg-white border border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer outline-none"
                      >
                        <XCircle size={16} /> Cancel Booking
                      </button>
                    )}

                    {['cancelled', 'rejected'].includes(booking.status) && (
                      <button 
                        onClick={() => setViewReasonBooking(booking)}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer outline-none"
                      >
                        <Eye size={16} /> View Reason
                      </button>
                    )}
                  </div>
                </div>
                )}


              </div>
            );
            })}
          </div>
        )}
      </div>
      
      {chatBookingId && (
        <ChatModal 
          booking={bookings.find(b => b._id === chatBookingId)} 
          currentRole="user" 
          onClose={handleCloseChat} 
        />
      )}

      {reviewBooking && (
        <ReviewModal 
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            fetchData();
          }}
        />
      )}

      {paymentBooking && (
        <PaymentModal 
          booking={paymentBooking}
          onClose={() => setPaymentBooking(null)}
          onSuccess={() => {
            setPaymentBooking(null);
            fetchData();
          }}
        />
      )}

      {showPremiumModal && (
        <PremiumModal 
          onClose={() => setShowPremiumModal(false)}
          onSuccess={(data) => {
            setShowPremiumModal(false);
            setProfile(prev => ({ ...prev, isPremium: data.isPremium }));
            alert(data.message || 'Upgraded to Fixvo Plus successfully!');
          }}
        />
      )}

      {showSettings && (
        <SettingsModal 
          role="user"
          currentProfile={profile}
          onClose={() => setShowSettings(false)}
          onSuccess={() => {
            setShowSettings(false);
            fetchData();
          }}
        />
      )}

      {viewReasonBooking && (
        <div className="fixed inset-0 z-[999] bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-white">
            <h3 className="text-xl font-black text-white mb-2">Cancellation Details</h3>
            <div className="space-y-4 my-6">
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs sm:text-sm font-semibold">
                <span className="font-extrabold text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded uppercase tracking-wider block mb-2 w-max border border-rose-500/30">Reason Given</span>
                "{viewReasonBooking.cancellationReason || 'No reason provided.'}"
              </div>
              <div className="text-xs text-slate-400 font-semibold space-y-2 pl-1">
                <p>Cancelled By: <strong className="text-slate-200 capitalize">{viewReasonBooking.cancelledBy || 'system'}</strong></p>
                {viewReasonBooking.cancelledAt && (
                  <p>Cancelled On: <strong className="text-slate-200">{new Date(viewReasonBooking.cancelledAt).toLocaleString()}</strong></p>
                )}
              </div>
            </div>
            <button
              onClick={() => setViewReasonBooking(null)}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3.5 rounded-xl transition-all shadow-md cursor-pointer border-none outline-none"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {cancelBookingId && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
          <div className="bg-[#111827] border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] relative animate-in fade-in zoom-in duration-300 text-white p-6 sm:p-8 space-y-6">
            <button 
              onClick={() => setCancelBookingId(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-md">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">Cancel Booking Request</h3>
              <p className="text-slate-400 text-xs font-medium">Please let us know the reason for cancelling this booking.</p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Reason for Cancellation</label>
              <textarea
                rows="4"
                placeholder="Describe your reason here..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-slate-200 outline-none text-sm font-semibold focus:border-red-500 transition-all resize-none"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setCancelBookingId(null)} 
                disabled={submittingCancellation}
                className="flex-1 border border-white/10 hover:bg-white/5 text-slate-300 font-bold py-3 rounded-xl transition-all text-xs sm:text-sm uppercase tracking-wider outline-none disabled:opacity-50 cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={handleCancelBooking} 
                disabled={submittingCancellation}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all flex justify-center items-center gap-2 text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-[0.98] outline-none cursor-pointer"
              >
                {submittingCancellation ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Cancel Booking</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alerts Stack */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        <style>{`
          @keyframes shrinkWidth {
            from { width: 100%; }
            to { width: 0%; }
          }
          .animate-shrink-width {
            animation: shrinkWidth 6s linear forwards;
          }
        `}</style>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-950/95 backdrop-blur text-white rounded-2xl shadow-2xl border border-slate-800 p-4 flex gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full animate-shrink-width" style={{ transformOrigin: 'left' }}></div>
            <div className="p-1.5 bg-slate-800 rounded-lg text-indigo-400 self-start">
              <Sparkles size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-slate-100 leading-tight">{toast.title}</h4>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-200 self-start transition-colors font-bold text-xs p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;
