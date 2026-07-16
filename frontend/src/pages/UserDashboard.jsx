import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api'; 
import { globalCategories, globalServices, getDbServices } from '../data/services';
import SearchableServiceSelector from '../components/SearchableServiceSelector';
import SearchableAreaSelector from '../components/SearchableAreaSelector';
import { subscribeToPushNotifications } from '../services/pushNotification';
import { requestFcmPermission } from '../services/firebase';
import { Calendar, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, Plus, LayoutDashboard, Wrench, Settings, Star, User, ChevronRight, MessageSquare, Camera, UploadCloud, Loader2, Shield, ShieldCheck, HelpCircle, Truck, Home, Search, Eye, Zap, Maximize2, Hash, Layers, Paintbrush, Tv, X, CreditCard, Sparkles, PhoneCall, Bell, Copy, Share2, Trash2, Edit, CheckSquare } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import ReviewModal from '../components/ReviewModal';
import PaymentModal from '../components/PaymentModal';
import SettingsModal from '../components/SettingsModal';
import PremiumModal from '../components/PremiumModal';
import { socket } from '../services/socket';
import { playNotificationSound } from '../services/soundEffects';
import LoadingSkeleton from '../components/LoadingSkeleton';
import TrackingMap from '../components/TrackingMap';
import WorkProofGallery from '../components/WorkProofGallery';
import SavedAddresses from '../components/SavedAddresses';
import WalletView from '../components/WalletView';
import ReferralView from '../components/ReferralView';
import RewardsView from '../components/RewardsView';
import SupportView from '../components/SupportView';

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
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Address CRUD states
  const [addresses, setAddresses] = useState([
    { id: '1', type: 'Home', name: 'Home Sweet Home', details: '123 Main St, Madanapalle', isDefault: true },
    { id: '2', type: 'Office', name: 'Fixvo HQ', details: '456 Tech Park, Madanapalle', isDefault: false }
  ]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressEditId, setAddressEditId] = useState(null);
  const [addressForm, setAddressForm] = useState({ type: 'Home', name: '', details: '', isDefault: false });

  // Wallet states
  const [walletAddAmount, setWalletAddAmount] = useState('');
  const [transactions, setTransactions] = useState([
    { id: 'tx_1', type: 'cashback', desc: 'Welcome Cashback', amount: 50, date: new Date().toISOString() },
    { id: 'tx_2', type: 'referral', desc: 'Friend Referral Reward', amount: 100, date: new Date(Date.now() - 86400000).toISOString() }
  ]);

  // Support states
  const [supportTickets, setSupportTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({ category: 'Booking', subject: '', message: '' });
  const [showTicketForm, setShowTicketForm] = useState(false);

  // Settings states
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  const [dispatchStatus, setDispatchStatus] = useState({}); // bookingId -> { status, radius, technicianName, timeout }
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
  const [isPlusDismissed, setIsPlusDismissed] = useState(localStorage.getItem('fixvo_plus_dismissed') === 'true');
  const [toasts, setToasts] = useState([]);
  const techSectionRef = useRef(null);
  
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

  const showToast = (title, message, type = 'info', silent = false) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    if (!silent) {
      playChime();
    }
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const handleShareLocation = (booking) => {
    let rawPhone = booking.providerPhone || booking.providerId?.phone || '';
    if (!rawPhone) {
      showToast('Share Location Failed ❌', 'Technician contact unavailable.', 'error');
      return;
    }
    
    // Automatically remove spaces, + symbols, or invalid characters
    let cleanPhone = rawPhone.toString().replace(/\D/g, '');
    
    // If it starts with 910, convert it to 91 (e.g. +91 09876543210 -> 9109876543210 -> 919876543210)
    if (cleanPhone.startsWith('910')) {
      cleanPhone = '91' + cleanPhone.substring(3);
    }
    
    // Strip leading zero if any
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    // If it's a 10-digit number, prefix with Indian country code '91'
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    
    // Validate Indian phone number: starts with 91 followed by a digit 6-9 and then 9 more digits (12 digits total)
    const isValidIndianPhone = /^91[6-9]\d{9}$/.test(cleanPhone);
    
    if (!isValidIndianPhone) {
      showToast('Share Location Failed ❌', 'Technician contact unavailable.', 'error');
      return;
    }
    
    const message = encodeURIComponent('Hi, this is regarding my Fixvo booking. My exact location is: ');
    const url = `https://wa.me/${cleanPhone}?text=${message}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const pendingStr = localStorage.getItem('pendingBooking');
  const pendingData = pendingStr ? JSON.parse(pendingStr) : null;
  
  const [formData, setFormData] = useState(pendingData || {
    serviceId: initialService || '', date: '', deviceType: '', problemDescription: '', location: '', detailedAddress: '', landmark: '', gpsLocation: null, imageUrl: '',
    serviceOption: 'direct',
    unknownProblem: false
  });

  const [techSearchQuery, setTechSearchQuery] = useState('');

  const filteredTechnicians = useMemo(() => {
    if (!techSearchQuery.trim()) return technicians;
    const q = techSearchQuery.toLowerCase().trim();
    return technicians.filter(tech => {
      const nameMatches = tech.name?.toLowerCase().includes(q);
      const areaMatches = (tech.area || tech.distance || '').toLowerCase().includes(q);
      const skillMatches = tech.skills?.some(s => s.toLowerCase().includes(q));
      const serviceMatches = tech.services?.some(s => s.toLowerCase().includes(q));
      return nameMatches || areaMatches || skillMatches || serviceMatches;
    });
  }, [technicians, techSearchQuery]);

  useEffect(() => {
    if (!techSearchQuery.trim()) return;

    const delayDebounceId = setTimeout(async () => {
      try {
        setFetchingTechs(true);
        const queryParams = new URLSearchParams();
        queryParams.append('search', techSearchQuery);
        if (formData.serviceId) {
          queryParams.append('serviceId', formData.serviceId);
        }
        const res = await api.get(`/technicians/nearby?${queryParams.toString()}`);
        setTechnicians(res.data || []);
      } catch (err) {
        console.error('Debounced technician search failed:', err);
      } finally {
        setFetchingTechs(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceId);
  }, [techSearchQuery, formData.serviceId]);

  const selectedServiceObj = useMemo(() => {
    return services.find(s => s.id === formData.serviceId) || globalServices.find(s => s.id === formData.serviceId);
  }, [services, formData.serviceId]);
  const categoryId = selectedServiceObj ? selectedServiceObj.categoryId : '';
  const serviceNameLower = selectedServiceObj?.name?.toLowerCase() || '';

  useEffect(() => {
    getDbServices().then(setServices);
    fetchData(true);
    subscribeToPushNotifications(); // PWA background push notifications
    requestFcmPermission(); // FCM background push notifications
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
    if (profile?.userId) {
      const savedAdd = localStorage.getItem('saved_addresses_' + profile.userId);
      if (savedAdd) setAddresses(JSON.parse(savedAdd));
      else {
        const defaultAdd = [
          { id: '1', type: 'Home', name: 'Home Sweet Home', details: '123 Main St, Madanapalle', isDefault: true },
          { id: '2', type: 'Office', name: 'Fixvo HQ', details: '456 Tech Park, Madanapalle', isDefault: false }
        ];
        localStorage.setItem('saved_addresses_' + profile.userId, JSON.stringify(defaultAdd));
        setAddresses(defaultAdd);
      }

      const savedTx = localStorage.getItem('wallet_transactions_' + profile.userId);
      if (savedTx) setTransactions(JSON.parse(savedTx));
      else {
        const defaultTx = [
          { id: 'tx_1', type: 'cashback', desc: 'Welcome Cashback', amount: 50, date: new Date().toISOString() },
          { id: 'tx_2', type: 'referral', desc: 'Friend Referral Reward', amount: 100, date: new Date(Date.now() - 86400000).toISOString() }
        ];
        localStorage.setItem('wallet_transactions_' + profile.userId, JSON.stringify(defaultTx));
        setTransactions(defaultTx);
      }

      const savedTickets = localStorage.getItem('support_tickets_' + profile.userId);
      if (savedTickets) setSupportTickets(JSON.parse(savedTickets));
    }
  }, [profile?.userId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const serviceId = params.get('service');
    const techId = params.get('techId');
    const jobId = params.get('jobId');

    if (action === 'premium') {
      setShowPremiumModal(true);
    }
    
    if (action === 'book') {
      setShowForm(true);
      if (serviceId) {
        setFormData(prev => ({ ...prev, serviceId }));
      }
      
      if (techId && serviceId) {
        const selectTechDirectly = async () => {
          try {
            const res = await api.get(`/technicians/nearby?serviceId=${serviceId}`);
            const matchingTechs = res.data || [];
            const foundTech = matchingTechs.find(t => t.id === techId);
            if (foundTech) {
              setSelectedTech(foundTech);
              setStep(2); // Skip directly to technician confirmation step
              setFormData(prev => ({
                ...prev,
                serviceId: serviceId,
                location: foundTech.area || prev.location
              }));
              showToast('Technician Pre-selected 👨‍🔧', `Ready to book ${foundTech.name} directly.`, 'success');
              // Clean search params from URL to avoid re-triggering on navigate/re-render
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (err) {
            console.error('Failed to pre-select technician', err);
          }
        };
        selectTechDirectly();
      }
    }

    if (jobId && bookings.length > 0) {
      const foundBooking = bookings.find(b => b._id === jobId);
      if (foundBooking) {
        setExpandedBookings(prev => ({ ...prev, [jobId]: true }));
        if (['completed', 'cancelled'].includes(foundBooking.status)) {
          setFilterTab('completed');
        } else {
          setFilterTab('active');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          const cardElement = document.getElementById(`booking-card-${jobId}`);
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [location.search, bookings]);

  // Register private room for customer notification/alerts & sync on reconnects
  useEffect(() => {
    if (!profile?.userId) return;

    const registerSocket = () => {
      socket.emit('register_user', profile.userId);
      fetchData(false); // Refetch bookings on reconnect
    };

    registerSocket();
    socket.on('connect', registerSocket);

    // Sync when tab gets focused/foregrounded on mobile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off('connect', registerSocket);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile?.userId]);

  useEffect(() => {
    if (!profile?.userId) return;

    const handleJobUpdate = (updatedJob) => {
      setBookings(prev => prev.map(b => b._id === updatedJob._id ? { ...b, ...updatedJob } : b));
      fetchData(false);

      // Strict sender-role/ID validation to prevent self-notifications
      const isSelfGenerated = updatedJob.initiatorId === profile?.userId || updatedJob.initiatorRole === 'user';

      if (!isSelfGenerated) {
        const criticalStatuses = ['assigned', 'accepted', 'on_the_way', 'arrived', 'quote_pending', 'quote_clarification', 'completed'];
        const isCritical = criticalStatuses.includes(updatedJob.status) || updatedJob.paymentStatus === 'completed';

        showToast(
          '🔄 Repair Status Updated', 
          `Your ${updatedJob.serviceName} status is now: ${updatedJob.status.replace(/_/g, ' ').toUpperCase()}`, 
          'info',
          !isCritical
        );
        if (isCritical) {
          playNotificationSound('low');
        }
        if (Notification.permission === 'granted') {
          new Notification('🔄 Repair Status Updated', {
            body: `Your ${updatedJob.serviceName} status is now: ${updatedJob.status.replace(/_/g, ' ').toUpperCase()}`,
            icon: '/fixvo-icon.png'
          });
        }
      }
    };

    const handleJobRejected = (data) => {
      setBookings(prev => prev.map(b => {
        if (b._id === data.bookingId) {
          return {
            ...b,
            rejectedByTechName: data.rejectedByTechName,
            rejectionReason: data.rejectionReason,
            status: 'pending', // Reverts to finding tech
            providerId: null,
            providerPhone: null,
            providerEmail: null,
            technicianName: 'Unassigned'
          };
        }
        return b;
      }));
      fetchData(false);

      showToast(
        '⚠️ Technician Declined Request',
        `Technician ${data.rejectedByTechName || 'Saniya'} declined your request (Reason: ${data.rejectionReason}). Reassigning to another expert...`,
        'error'
      );

      playNotificationSound('high');
    };

    const handleJobReassigned = (updatedJob) => {
      setBookings(prev => prev.map(b => b._id === updatedJob._id ? { ...b, ...updatedJob } : b));
      fetchData(false);

      showToast(
        '🔄 Technician Reassigned',
        `Your booking has been reassigned to technician ${updatedJob.technicianName || 'another nearby expert'}.`,
        'success'
      );

      playNotificationSound('high');
    };

    const handleDispatchStatus = (data) => {
      setDispatchStatus(prev => ({
        ...prev,
        [data.bookingId]: data
      }));
    };

    socket.on('job_update', handleJobUpdate);
    socket.on('job_rejected', handleJobRejected);
    socket.on('job_reassigned', handleJobReassigned);
    socket.on('dispatch_status', handleDispatchStatus);

    return () => {
      socket.off('job_update', handleJobUpdate);
      socket.off('job_rejected', handleJobRejected);
      socket.off('job_reassigned', handleJobReassigned);
      socket.off('dispatch_status', handleDispatchStatus);
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
    const handleScroll = () => {
      if (window.scrollY > 250) {
        localStorage.setItem('fixvo_plus_dismissed', 'true');
        setIsPlusDismissed(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleReceiveMessage = (newMsg) => {
      if (newMsg.senderId !== 'system' && newMsg.senderId !== profile?.userId) {
        const isCurrentChatOpen = chatBookingId === newMsg.bookingId;
        if (!isCurrentChatOpen) {
          playNotificationSound('low');
        }
      }
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
  }, [chatBookingId, profile?.userId]);

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
    
    setTimeout(() => {
      techSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
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
      
      showToast('Booking Request Submitted 🎉', 'Booking request submitted successfully.', 'success');
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
      console.error("Booking submission error:", error);
      const errMsg = error.response?.data?.message || 'Unable to process request. Please try again.';
      showToast('Booking Failed ❌', errMsg, 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const [updatingJobs, setUpdatingJobs] = useState({});
  const [clarificationText, setClarificationText] = useState('');
  const [showClarifyInput, setShowClarifyInput] = useState({});

  const handleQuoteClarification = async (bookingId) => {
    if (!clarificationText.trim()) return;
    setUpdatingJobs(prev => ({ ...prev, [bookingId]: true }));
    try {
      await api.put(`/bookings/${bookingId}/clarify-quote`, { clarificationText });
      setClarificationText('');
      setShowClarifyInput(prev => ({ ...prev, [bookingId]: false }));
      showToast('Clarification Sent 📢', 'Clarification request sent to technician.', 'success');
      fetchData();
    } catch (error) {
       const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
       alert(`Failed to request clarification: ${errorMsg}`);
       console.error(error);
    } finally {
       setUpdatingJobs(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleQuoteApproval = async (bookingId, approved) => {
    if (updatingJobs[bookingId]) return;
    // Optimistic update
    setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: approved ? 'in_progress' : 'quote_rejected' } : b));
    setUpdatingJobs(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      await api.put(`/bookings/${bookingId}/approve-quote`, { approved });
      showToast(
        approved ? 'Quote Approved! ✅' : 'Quote Declined ❌',
        approved ? 'Technician has been notified to resume work.' : 'Work suspended until technician submits a revised quote.',
        approved ? 'success' : 'warning'
      );
      fetchData();
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
        
        showToast('Technician Assigned Successfully! 👨‍🔧', 'Technician assigned successfully.', 'success');
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
        console.error("Auto-dispatch submission failed:", error);
        const errMsg = error.response?.data?.message || 'Unable to process request. Please try again.';
        showToast('Auto-Dispatch Failed ❌', errMsg, 'error');
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
        bg: 'bg-amber-500/10 text-amber-450 border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      },
      awaiting_payment: {
        label: 'Awaiting Payment',
        bg: 'bg-amber-500/10 text-amber-450 border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      },
      cash_pending: {
        label: 'Cash Payment Pending',
        bg: 'bg-amber-500/10 text-amber-450 border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      },
      processing: {
        label: 'Payment Processing',
        bg: 'bg-amber-500/10 text-amber-450 border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      },
      completed: {
        label: 'Paid In Full',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      },
      failed: {
        label: 'Payment Failed',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      },
      refunded: {
        label: 'Payment Refunded',
        bg: 'bg-slate-800 text-slate-400 border-slate-200/80',
        badge: 'bg-slate-700 text-slate-400 border-white/10'
      }
    };
    return config[status] || {
      label: status || 'Pending',
      bg: 'bg-amber-500/10 text-amber-450 border-amber-500/20',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    };
  };

  const [expandedBookings, setExpandedBookings] = useState({});
  const [filterTab, setFilterTab] = useState('all');

  const toggleExpand = (id) => {
    setExpandedBookings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Saved Address Handlers
  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.details) return;
    
    const newAddress = {
      id: addressEditId || Date.now().toString(),
      type: addressForm.type,
      name: addressForm.name,
      details: addressForm.details,
      isDefault: addressForm.isDefault
    };
    
    let updatedAddresses = [];
    if (addressEditId) {
      updatedAddresses = addresses.map(addr => addr.id === addressEditId ? newAddress : addr);
    } else {
      updatedAddresses = [...addresses, newAddress];
    }
    
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(addr => addr.id === newAddress.id ? addr : { ...addr, isDefault: false });
    }
    
    setAddresses(updatedAddresses);
    if (profile?.userId) {
      localStorage.setItem('saved_addresses_' + profile.userId, JSON.stringify(updatedAddresses));
    }
    
    setAddressForm({ type: 'Home', name: '', details: '', isDefault: false });
    setAddressEditId(null);
    setShowAddressForm(false);
    showToast(addressEditId ? 'Address Updated' : 'Address Saved', 'Your address has been saved successfully.', 'success', true);
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(addr => addr.id !== id);
    if (addresses.find(addr => addr.id === id)?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    if (profile?.userId) {
      localStorage.setItem('saved_addresses_' + profile.userId, JSON.stringify(updated));
    }
    showToast('Address Deleted', 'Address removed from your saved list.', 'info', true);
  };

  const handleMarkAddressDefault = (id) => {
    const updated = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    setAddresses(updated);
    if (profile?.userId) {
      localStorage.setItem('saved_addresses_' + profile.userId, JSON.stringify(updated));
    }
    showToast('Default Address Changed', 'Your default address has been updated.', 'success', true);
  };

  // Wallet Top Up handler
  const handleAddWalletMoney = (e) => {
    e.preventDefault();
    const amount = Number(walletAddAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    
    const newBalance = (profile?.walletBalance || 0) + amount;
    setProfile(prev => prev ? { ...prev, walletBalance: newBalance } : prev);
    
    const newTx = {
      id: 'tx_' + Date.now(),
      type: 'credit',
      desc: 'Wallet Top Up',
      amount,
      date: new Date().toISOString()
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    
    if (profile?.userId) {
      localStorage.setItem('wallet_transactions_' + profile.userId, JSON.stringify(updatedTxs));
    }
    
    api.put('/users/profile', { walletBalance: newBalance }).catch(() => {});
    
    setWalletAddAmount('');
    showToast('Top Up Successful ✅', `₹${amount} added successfully to your Fixvo Wallet!`, 'success');
  };

  // Support Ticket handler
  const handleRaiseTicket = (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) return;
    
    const newTicket = {
      id: 'tkt_' + Date.now(),
      category: ticketForm.category,
      subject: ticketForm.subject,
      message: ticketForm.message,
      status: 'Open',
      date: new Date().toISOString()
    };
    
    const updatedTickets = [newTicket, ...supportTickets];
    setSupportTickets(updatedTickets);
    if (profile?.userId) {
      localStorage.setItem('support_tickets_' + profile.userId, JSON.stringify(updatedTickets));
    }
    
    setTicketForm({ category: 'Booking', subject: '', message: '' });
    setShowTicketForm(false);
    showToast('Ticket Raised', 'We have received your request. Support team will respond shortly.', 'success');
  };

  const filteredBookings = bookings.filter(b => {
    const query = searchQuery.toLowerCase();
    const matchesService = (b.serviceId?.name || b.serviceName || '').toLowerCase().includes(query);
    const matchesId = b._id.toLowerCase().includes(query);
    const matchesStatus = (b.status || '').toLowerCase().includes(query);
    const matchesSearch = matchesService || matchesId || matchesStatus;
    
    if (filterTab === 'active') {
      return matchesSearch && !['completed', 'cancelled'].includes(b.status);
    } else if (filterTab === 'completed') {
      return matchesSearch && b.status === 'completed';
    }
    return matchesSearch;
  });


  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'wallet', label: 'Wallet', icon: CreditCard },
    { id: 'rewards', label: 'Rewards & Offers', icon: Sparkles },
    { id: 'referral', label: 'Refer & Earn', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans mt-4 sm:mt-10 pb-16">
      {showForm ? (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-750 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Wrench size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    {step === 1 ? 'Schedule a Repair' : 'Select a Technician'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Verify details and match with nearby experts</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-bold bg-slate-950/60 border border-slate-200/80 rounded-full px-4 py-1.5 self-start sm:self-auto">
                <span className={`px-2 py-0.5 rounded-full ${step >= 1 ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500'}`}>1. Details</span>
                <ChevronRight size={12} className="text-slate-650"/>
                <span className={`px-2 py-0.5 rounded-full ${step >= 2 ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500'}`}>2. Match Tech</span>
              </div>
            </div>
            
            {step === 1 && (
              services.length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-2xl">
                  <AlertCircle size={20} />
                  <p className="font-semibold text-sm">No services are currently available. Please contact support.</p>
                </div>
              ) : (
                <form onSubmit={handleInitialSubmit} className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-300">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-[ping_2s_infinite]"></span>
                    <p className="text-xs sm:text-sm font-semibold">
                      High Demand: Only <span className="font-black text-amber-400">2 technicians</span> available near you right now.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Settings size={14} className="text-slate-500"/> Select Service
                      </label>
                      <SearchableServiceSelector
                        value={formData.serviceId}
                        onChange={(serviceId) => setFormData({ ...formData, serviceId })}
                        theme="light"
                        placeholder="Search and select a service..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500"/> Preferred Date
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-5 py-3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-505/20 transition-all font-semibold text-slate-800 rounded-2xl outline-none text-sm"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 p-6 rounded-2xl border border-slate-200/80">
                    {categoryId === 'repair' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Smartphone size={14} className="text-slate-500"/> Device Type
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. iPhone 13, HP Pavilion" 
                          required 
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-505/20 transition-all font-semibold text-slate-800 rounded-2xl outline-none text-sm" 
                          value={formData.deviceType || ''} 
                          onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })} 
                        />
                      </div>
                    )}

                    {categoryId === 'cleaning' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Home size={14} className="text-slate-500"/> House / Premise Type
                          </label>
                          <select 
                            required 
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-505/20 transition-all font-semibold text-slate-800 rounded-2xl outline-none text-sm" 
                            value={formData.houseType || ''} 
                            onChange={(e) => setFormData({ ...formData, houseType: e.target.value })}
                          >
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
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Maximize2 size={14} className="text-slate-500"/> Area Size (Sq Ft)
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. 1200 sq ft" 
                            required 
                            className="w-full px-5 py-3 bg-slate-955 border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-white rounded-2xl outline-none text-sm" 
                            value={formData.areaSize || ''} 
                            onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Hash size={14} className="text-slate-500"/> Number of Rooms/Bathrooms
                          </label>
                          <input 
                            type="number" 
                            min="1" 
                            placeholder="e.g. 3" 
                            required 
                            className="w-full px-5 py-3 bg-slate-955 border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-white rounded-2xl outline-none text-sm" 
                            value={formData.numberOfRooms || ''} 
                            onChange={(e) => setFormData({ ...formData, numberOfRooms: e.target.value })} 
                          />
                        </div>
                      </>
                    )}

                    {(categoryId === 'painting' || serviceNameLower.includes('paint')) && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Home size={14} className="text-slate-500"/> Premise / Area to Paint
                          </label>
                          <select 
                            required 
                            className="w-full px-5 py-3 bg-slate-955 border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-white rounded-2xl outline-none text-sm" 
                            value={formData.houseType || ''} 
                            onChange={(e) => setFormData({ ...formData, houseType: e.target.value })}
                          >
                            <option value="">Select option</option>
                            <option value="1 BHK">1 BHK Interior</option>
                            <option value="2 BHK">2 BHK Interior</option>
                            <option value="3 BHK">3 BHK Interior</option>
                            <option value="Single Room">Single Room / Accent Wall</option>
                            <option value="Exterior">Exterior Painting</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Maximize2 size={14} className="text-slate-500"/> Wall Area Size (Sq Ft)
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. 1500 sq ft" 
                            required 
                            className="w-full px-5 py-3 bg-slate-955 border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-white rounded-2xl outline-none text-sm" 
                            value={formData.wallArea || ''} 
                            onChange={(e) => setFormData({ ...formData, wallArea: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Layers size={14} className="text-slate-500"/> Location Type
                          </label>
                          <select 
                            required 
                            className="w-full px-5 py-3 bg-slate-955 border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-white rounded-2xl outline-none text-sm" 
                            value={formData.indoorOutdoor || ''} 
                            onChange={(e) => setFormData({ ...formData, indoorOutdoor: e.target.value })}
                          >
                            <option value="">Select location type</option>
                            <option value="Indoor">Indoor Only</option>
                            <option value="Outdoor">Outdoor Only</option>
                            <option value="Both">Both (Indoor & Outdoor)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Paintbrush size={14} className="text-slate-500"/> Paint Preference
                          </label>
                          <select 
                            required 
                            className="w-full px-5 py-3 bg-slate-955 border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-white rounded-2xl outline-none text-sm" 
                            value={formData.paintPreference || ''} 
                            onChange={(e) => setFormData({ ...formData, paintPreference: e.target.value })}
                          >
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
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Tv size={14} className="text-slate-500"/> Appliance / Item to Install
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. Split AC 1.5 Ton, 55 inch TV" 
                            required 
                            className="w-full px-5 py-3 bg-slate-955 border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-white rounded-2xl outline-none text-sm" 
                            value={formData.applianceType || ''} 
                            onChange={(e) => setFormData({ ...formData, applianceType: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <MapPin size={14} className="text-slate-500"/> Installation Location
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. Living Room Brick Wall" 
                            required 
                            className="w-full px-5 py-3 bg-slate-955 border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-white rounded-2xl outline-none text-sm" 
                            value={formData.installationLocation || ''} 
                            onChange={(e) => setFormData({ ...formData, installationLocation: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Layers size={14} className="text-slate-500"/> Accessories Needed
                          </label>
                          <select 
                            required 
                            className="w-full px-5 py-3 bg-slate-955 border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-white rounded-2xl outline-none text-sm" 
                            value={formData.accessoriesNeeded || ''} 
                            onChange={(e) => setFormData({ ...formData, accessoriesNeeded: e.target.value })}
                          >
                            <option value="">Select option</option>
                            <option value="None">None (I have all accessories)</option>
                            <option value="Wall Mount Bracket">Wall Mount Bracket (+₹299)</option>
                            <option value="Extension Pipe">Extension Copper Pipe (+₹599/m)</option>
                            <option value="Full Kit">Standard Installation Kit</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <MapPin size={14} className="text-slate-500"/> Town / Area
                      </label>
                      <SearchableAreaSelector
                        value={formData.location || ''}
                        onChange={(areaName) => setFormData({ ...formData, location: areaName })}
                        theme="light"
                        placeholder="Search your area..."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Camera size={14} className="text-slate-500"/> Device Media / Photo (Optional)
                    </label>
                    <div className="relative group border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl p-6 transition-all duration-300 hover:bg-indigo-950/20 flex flex-col items-center justify-center min-h-[130px] bg-slate-900/40 cursor-pointer overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/*,video/mp4,video/quicktime" 
                        onChange={handleImageUpload} 
                        disabled={uploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 animate-pulse" 
                      />
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-2 text-indigo-400">
                          <Loader2 size={28} className="animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-wider animate-pulse">Uploading Media...</span>
                        </div>
                      ) : formData.mediaUrl ? (
                        <div className="flex flex-col items-center text-emerald-400 relative z-20">
                          <CheckCircle className="mb-2 text-emerald-500" size={28} />
                          <span className="text-xs font-bold uppercase tracking-wider">Media Uploaded!</span>
                          {formData.mediaType?.startsWith('video') ? (
                            <video src={formData.mediaUrl} className="mt-3 w-16 h-16 object-cover rounded-xl border border-emerald-500/30 shadow-md" />
                          ) : (
                            <img src={formData.mediaUrl} alt="Preview" className="mt-3 w-16 h-16 object-cover rounded-xl border border-emerald-500/30 shadow-md" />
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-2 text-slate-500 group-hover:text-indigo-400 transition-colors">
                          <UploadCloud size={32} className="text-slate-600 group-hover:text-indigo-500 transition-colors" />
                          <div>
                            <p className="text-xs font-extrabold text-slate-300">Drag & drop or click to upload</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Supports images & videos (Max 10MB)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-800 items-stretch">
                    <div className="flex flex-col h-full space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <HelpCircle size={14} className="text-slate-500"/> Describe the problem
                      </label>
                      <div className="flex items-start gap-2.5 p-4 bg-slate-900/60 border border-slate-200/80 rounded-2xl transition-all hover:bg-slate-900">
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
                          className="mt-1 w-4 h-4 text-indigo-650 rounded border-slate-700 bg-slate-950 focus:ring-indigo-500 cursor-pointer" 
                        />
                        <label htmlFor="unknownProblem" className="text-xs text-slate-300 font-extrabold cursor-pointer leading-tight select-none">I don't know the exact issue (Technician will diagnose)</label>
                      </div>
                      <textarea 
                        rows="6" 
                        placeholder={formData.unknownProblem ? "Tell us what happened (e.g., screen went black, strange noise)..." : "Describe the issue you're facing in detail..."} 
                        required 
                        className="w-full flex-grow px-5 py-4 bg-slate-950 border border-white/10 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-slate-100 resize-none outline-none text-sm" 
                        value={formData.problemDescription} 
                        onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                      ></textarea>
                    </div>
                    
                    <div className="flex flex-col h-full space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Wrench size={14} className="text-slate-500"/> Service Visit Type
                      </label>
                      
                      <div className="flex-grow flex flex-col gap-4">
                        <label className={`relative flex-1 block p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.serviceOption === 'inspection' ? 'border-indigo-650 bg-indigo-950/20 shadow-md shadow-indigo-600/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}>
                           <div className="flex items-start gap-4">
                             <input type="radio" name="serviceOption" checked={formData.serviceOption === 'inspection'} onChange={() => setFormData({...formData, serviceOption: 'inspection'})} className="mt-1 w-4.5 h-4.5 text-indigo-650 focus:ring-indigo-500 cursor-pointer" />
                             <div className="flex-grow">
                               <div className="flex items-center gap-2 flex-wrap">
                                 <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5"><Eye size={14} className="text-indigo-400" /> Inspection Visit</span>
                                 {formData.unknownProblem && (
                                   <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-600 text-white animate-pulse">
                                     ✨ Recommended
                                   </span>
                                 )}
                               </div>
                               <span className="block text-[11px] text-slate-405 mt-2 font-medium leading-relaxed">
                                 Technician visits first to diagnose and provides a quote. Free booking – pay only after quote approval.
                               </span>
                             </div>
                           </div>
                        </label>
                        
                        <label className={`relative flex-1 block p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.serviceOption === 'direct' ? 'border-indigo-650 bg-indigo-950/20 shadow-md shadow-indigo-600/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}>
                           <div className="flex items-start gap-4">
                             <input type="radio" name="serviceOption" checked={formData.serviceOption === 'direct'} onChange={() => setFormData({...formData, serviceOption: 'direct'})} className="mt-1 w-4.5 h-4.5 text-indigo-650 focus:ring-indigo-500 cursor-pointer" />
                             <div className="flex-grow">
                               <div className="flex items-center gap-2 flex-wrap">
                                 <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5"><Zap size={14} className="text-amber-400" /> Direct Repair Visit</span>
                                 {!formData.unknownProblem && (
                                   <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white">
                                     ⚡ Faster
                                   </span>
                                 )}
                               </div>
                               <span className="block text-[11px] text-slate-405 mt-2 font-medium leading-relaxed">
                                 For simple, known services like cleaning or minor repairs. Technician comes prepared to fix it immediately.
                               </span>
                             </div>
                           </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-800">
                    <button 
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="py-3 px-6 font-bold text-slate-400 bg-slate-905 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      Back to Dashboard
                    </button>
                    <button 
                      type="submit" 
                      disabled={isBooking}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs border border-slate-200/80"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-indigo-300" />
                          <span>Finding Technicians...</span>
                        </>
                      ) : (
                        <>
                          <span>Find Nearby Technicians</span>
                          <Sparkles size={14} className="text-indigo-400" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )
            )}
            
            {step === 2 && (
              <div ref={techSectionRef} className="scroll-mt-6 animate-in slide-in-from-right-4 fade-in duration-500">
                {fetchingTechs ? (
                  <div className="flex flex-col items-center py-16 space-y-6 text-center">
                    <div className="relative flex items-center justify-center w-24 h-24">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-500/30 opacity-75 animate-ping"></span>
                      <div className="relative z-10 w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg text-white font-extrabold animate-pulse">
                        <Search className="w-7 h-7 animate-pulse text-indigo-100" />
                      </div>
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <p className="font-extrabold text-white text-lg tracking-tight">Scanning Madanapalle Area...</p>
                      <p className="text-xs text-slate-450 font-semibold leading-relaxed">Connecting with available, top-rated experts nearby...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-slate-400 font-medium pb-2 border-b border-slate-800">We found several qualified technicians nearby. Please select one for direct assignment.</p>
                    
                    {technicians.length > 0 && (
                      <button
                        onClick={handleLightningMatch}
                        disabled={isBooking}
                        className="w-full relative overflow-hidden group bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-left border border-slate-200/80 active:scale-[0.99] cursor-pointer outline-none"
                      >
                        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3 shadow-inner">
                          <ShieldCheck size={22} className="text-emerald-400 flex-shrink-0" />
                          <div>
                            <p className="font-extrabold text-emerald-300 text-xs">100% Free Booking</p>
                            <p className="text-[10px] text-emerald-450 mt-0.5 font-medium">Final pricing is provided after inspection. Pay only after quote approval.</p>
                          </div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white">
                              <Sparkles size={24} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black tracking-tight">{isBooking ? 'Auto-Dispatching...' : '⚡ Lightning Match'}</h3>
                              <p className="text-indigo-200 font-medium text-xs mt-0.5">Auto-assign the highest-rated technician near you instantly</p>
                            </div>
                          </div>
                        </div>
                      </button>
                    )}

                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search technician by name, skill or area..."
                        value={techSearchQuery}
                        onChange={(e) => setTechSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-905 border border-slate-200/80 rounded-2xl focus:border-indigo-500 transition-all font-medium text-slate-100 shadow-sm outline-none text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTechnicians.length === 0 ? (
                        <div className="col-span-full py-16 text-center bg-slate-900/40 border border-slate-200/80 rounded-3xl p-8">
                          <h3 className="text-lg font-extrabold text-white mb-2">No Technicians Found</h3>
                          <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                            We couldn't find any professionals matching your search query.
                          </p>
                        </div>
                      ) : (
                        filteredTechnicians.map((tech) => (
                           <div 
                             key={tech.id}
                             onClick={() => setSelectedTech(tech)}
                             className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                               selectedTech?.id === tech.id 
                                 ? 'border-indigo-500 bg-indigo-950/20 shadow-lg scale-[1.01]' 
                                 : 'border-slate-200/80 hover:border-slate-800 bg-slate-900/40'
                             }`}
                           >
                             <div>
                               <div className="flex items-center gap-3.5 mb-4">
                                 <div className="w-12 h-12 bg-slate-850 rounded-full flex items-center justify-center text-2xl shadow-inner shrink-0">
                                   {tech.avatar || '👨‍🔧'}
                                 </div>
                                 <div className="min-w-0">
                                   <h3 className="font-extrabold text-slate-100 flex items-center gap-1 text-sm truncate">
                                      {tech.name}
                                      <ShieldCheck size={14} className="text-emerald-400 shrink-0"/>
                                   </h3>
                                   <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-wider font-extrabold">Verified Pro</span>
                                 </div>
                               </div>
                               
                               <div className="flex items-center gap-3 mb-4 bg-slate-955 p-2.5 rounded-xl border border-slate-200/80">
                                 <div className="flex items-center text-amber-400 text-xs font-black">
                                   <Star size={12} className="fill-current mr-1"/>
                                   {tech.rating}
                                 </div>
                                 <div className="h-3.5 w-px bg-slate-800"></div>
                                 <div className="text-[10px] text-slate-400 font-extrabold">{tech.jobsCompleted || 0} Jobs Done</div>
                               </div>
                             </div>
                             
                             <div className="space-y-2 text-[10px] pt-3.5 border-t border-slate-200/80">
                               <div className="flex justify-between items-center">
                                 <span className="font-extrabold text-slate-500">Experience</span>
                                 <span className="font-black text-slate-300">{tech.experience || '3+ Years'}</span>
                                </div>
                               <div className="flex justify-between items-center">
                                 <span className="font-extrabold text-slate-500">Availability</span>
                                 <span className="font-black text-emerald-400">{tech.distance || 'Available Now'}</span>
                               </div>
                             </div>
                           </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4 p-4 bg-slate-900/60 border border-slate-200/80 rounded-2xl">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="text" 
                          placeholder="Promo Code (e.g. FIXVO10)" 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none uppercase font-semibold text-slate-800 text-xs"
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
                          className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 text-xs cursor-pointer border-none"
                        >
                          Apply
                        </button>
                      </div>
                      {discountAmount > 0 && <p className="text-emerald-400 text-xs font-bold mt-2">✓ 10% Discount Applied to Final Bill</p>}
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-slate-800">
                      <button 
                        onClick={() => setStep(1)} 
                        disabled={isBooking}
                        className="py-3 px-6 font-bold text-slate-400 bg-slate-900 hover:bg-slate-850 rounded-xl transition-colors disabled:opacity-50 text-xs cursor-pointer"
                      >
                        Back
                      </button>
                      <button 
                        onClick={handleFinalSubmit}
                        disabled={!selectedTech || isBooking}
                        className={`flex-1 py-3 px-6 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer border border-slate-200/80 ${selectedTech && !isBooking ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-650/20' : 'bg-slate-905 text-slate-650 cursor-not-allowed shadow-none'}`}
                      >
                        {isBooking ? <Loader2 className="animate-spin" size={16} /> : null}
                        {isBooking ? 'Booking...' : `Send Request to ${selectedTech ? selectedTech.name.split(' ')[0] : 'Technician'} 🚀`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-10 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                      
                      {/* Sidebar menu */}
                      <div className="lg:col-span-1 space-y-6">
                        
                        {/* Profile Card */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl relative overflow-hidden text-center text-slate-800">
                          <div className="absolute top-[-30%] left-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                          <div className="w-20 h-20 bg-indigo-650/20 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner mx-auto mb-4 relative">
                            {profile?.avatar || '👤'}
                            {profile?.isPremium && (
                              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-lg shadow-lg border border-amber-300 text-[8px] font-black uppercase tracking-wider animate-pulse">Plus</span>
                            )}
                          </div>
                          <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center justify-center gap-1.5 font-bold">
                            {profile?.name || 'Customer'}
                            {(profile?.isEmailVerified || profile?.isPhoneVerified) && (
                              <ShieldCheck size={16} className="text-emerald-400 shrink-0" title="Verified Customer" />
                            )}
                          </h2>
                          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{profile?.email}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{profile?.phone}</p>
                          
                          {/* Complete Profile Warning */}
                          {(!profile?.name || !profile?.phone || !profile?.address) && (
                            <div className="mt-3.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                              <AlertCircle size={12} /> Incomplete Profile
                            </div>
                          )}

                          <button
                            onClick={() => setShowSettings(true)}
                            className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition duration-200 cursor-pointer border-none outline-none"
                          >
                            Edit Profile
                          </button>
                        </div>

                        {/* Sidebar Menu */}
                        <div className="hidden lg:block bg-white border border-slate-150 rounded-3xl p-4 shadow-sm space-y-1">
                          {sidebarItems.map(item => {
                            const IconComp = item.icon;
                            const isSelected = activeSubTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => setActiveSubTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border-none outline-none text-left tracking-wide ${
                                  isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-700 hover:text-indigo-650 hover:bg-indigo-50/50'
                                }`}
                              >
                                <IconComp size={16} className={isSelected ? "text-white animate-pulse" : "text-slate-500"} />
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Main content pane */}
                      <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm min-h-[500px]">
                        
                        {/* OVERVIEW TAB */}
                        {activeSubTab === 'overview' && (
                          <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
                              <div>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Welcome back, {profile?.name?.split(' ')[0] || 'Client'}! 👋</h2>
                                <p className="text-xs text-slate-400 mt-1 font-medium font-semibold">Manage your services, wallet and account rewards</p>
                              </div>
                              <button
                                onClick={() => setShowForm(true)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-indigo-650/15 cursor-pointer active:scale-95 transition-all border-none outline-none"
                              >
                                <Plus size={14} /> Book Repair
                              </button>
                            </div>

                            {/* Plus promo banner */}
                            {!profile?.isPremium && (
                              <div className="bg-gradient-to-r from-amber-50/80 to-yellow-100/40 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm text-slate-800">
                                <div className="flex items-center gap-3.5 text-center sm:text-left">
                                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                    <Sparkles size={20} className="animate-pulse" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <h3 className="text-sm font-black text-amber-900">Upgrade to Fixvo Plus</h3>
                                    <p className="text-[10px] text-amber-800/90 font-bold max-w-sm leading-relaxed">
                                      Get 5% discount on all quotes, zero inspection fees (save ₹99), and priority technician dispatch.
                                    </p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setShowPremiumModal(true)}
                                  className="px-4.5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-md cursor-pointer border-none outline-none active:scale-95 transition-all"
                                >
                                  Upgrade to Plus
                                </button>
                              </div>
                            )}

                            {/* Quick actions cards */}
                            <div className="space-y-4">
                              <h3 className="font-extrabold text-xs text-slate-450 uppercase tracking-widest ml-1">Quick Actions</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {sidebarItems.filter(i => i.id !== 'overview').map(item => {
                                  const IconComp = item.icon;
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => setActiveSubTab(item.id)}
                                      className="bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-slate-100/50 p-5 rounded-2xl text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm flex flex-col items-center justify-center min-h-[110px]"
                                    >
                                      <div className="p-3 bg-indigo-650/10 text-indigo-405 border border-indigo-505/20 rounded-xl mb-3 shrink-0">
                                        <IconComp size={18} />
                                      </div>
                                      <h4 className="font-extrabold text-slate-800 text-xs tracking-tight">{item.label}</h4>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Bookings Preview */}
                            <div className="space-y-4">
                              <h3 className="font-extrabold text-xs text-slate-600 uppercase tracking-widest ml-1">Recent Booking Status</h3>
                              {bookings.length === 0 ? (
                                <div className="bg-slate-900/20 border border-slate-200/80 rounded-3xl p-8 text-center text-slate-550 font-bold text-sm">
                                  No service bookings yet. Click "Book Repair" to request your first visit.
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {bookings.slice(0, 1).map(booking => (
                                    <div key={booking._id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                      <div className="space-y-1 text-left">
                                        <span className="inline-block text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-extrabold">
                                          {booking.serviceName || 'Service Visit'}
                                        </span>
                                        <h4 className="font-bold text-slate-800 text-sm">ID: #{booking._id.slice(-6).toUpperCase()} • Final Bill: ₹{booking.finalQuote || booking.amount || 0}</h4>
                                        <p className="text-[10px] text-slate-450 font-medium">Date: {booking.date ? new Date(booking.date).toLocaleDateString() : 'Pending'}</p>
                                      </div>
                                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-600 bg-slate-800 px-3 py-1 rounded-full border border-slate-200/80">
                                          {booking.status}
                                        </span>
                                        <button
                                          onClick={() => setActiveSubTab('bookings')}
                                          className="text-xs text-indigo-400 hover:text-indigo-300 font-extrabold cursor-pointer border-none bg-transparent outline-none"
                                        >
                                          View Details
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* BOOKINGS TAB */}
                        {activeSubTab === 'bookings' && (
                          <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80">
                              <div>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                                  <Calendar className="text-indigo-400" /> Service Bookings
                                </h2>
                                <p className="text-xs text-slate-400 mt-1 font-semibold">Track active repairs and check completed history</p>
                              </div>
                              
                              {/* Search input */}
                              <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550" size={16} />
                                <input
                                  type="text"
                                  placeholder="Search bookings..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-xs focus:border-indigo-500 transition-all font-medium"
                                />
                              </div>
                            </div>

                            {/* Filter subtabs */}
                            <div className="flex border-b border-slate-200/80 gap-1 pt-1 overflow-x-auto scrollbar-none">
                              {['all', 'active', 'completed'].map(tab => (
                                <button
                                  key={tab}
                                  onClick={() => setFilterTab(tab)}
                                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap outline-none cursor-pointer border-none bg-transparent ${
                                    filterTab === tab
                                      ? 'border-indigo-500 text-indigo-400'
                                      : 'border-transparent text-slate-500 hover:text-slate-600'
                                  }`}
                                >
                                  {tab === 'all' ? 'All Bookings' : tab === 'active' ? 'Active' : 'Completed'}
                                </button>
                              ))}
                            </div>
                            {loading ? (
                              <LoadingSkeleton count={2} />
                            ) : filteredBookings.length === 0 ? (
                              <div className="py-20 text-center text-slate-550 font-bold text-sm">No bookings found.</div>
                            ) : (
                              <div className="space-y-4">
                                {filteredBookings.map((booking) => {
                                  return (
                                    <div 
                                      key={booking._id} 
                                      className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                                        expandedBookings[booking._id] ? 'border-indigo-200 bg-indigo-50/50 shadow-md' : 'border-slate-200 bg-white'
                                      }`}
                                    >
                                      <div onClick={() => toggleExpand(booking._id)} className="cursor-pointer space-y-2 text-left">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                            {booking.serviceName || 'Service Visit'}
                                          </span>
                                          <span className="text-[9px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-200/80 uppercase tracking-wider font-extrabold">
                                            {booking.status}
                                          </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">₹{booking.finalQuote || booking.amount || 0}</h3>
                                        <p className="text-[10px] text-slate-600 font-medium">Date: {booking.date ? new Date(booking.date).toLocaleDateString() : 'Pending'}</p>
                                        {booking.technicianName && booking.technicianName !== 'Unassigned' && (
                                          <span className="inline-block text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold uppercase px-2 py-0.5 rounded mt-1.5 border border-indigo-500/30">👨‍🔧 {booking.technicianName}</span>
                                        )}
                                      </div>

                                      {/* Details Toggle content */}
                                      {expandedBookings[booking._id] && (
                                        <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-4 animate-in fade-in duration-200 text-left text-xs font-semibold">
                                          <p className="text-slate-650 leading-relaxed font-semibold"><strong className="text-slate-800">Problem:</strong> {booking.problemDescription}</p>
                                          <p className="text-slate-650 leading-relaxed font-semibold"><strong className="text-slate-700">Address:</strong> {booking.location}</p>
                                          {booking.deviceType && <p className="text-slate-600"><strong className="text-slate-700">Device Type:</strong> {booking.deviceType}</p>}

                                          {/* Quote Details & Approval Panel */}
                                          {['quote_pending', 'quote_clarification', 'quote_rejected'].includes(booking.status) && (
                                            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4 my-3 text-slate-800">
                                              <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                                                  <Wrench size={14} /> Service Quote Details
                                                </h4>
                                                <span className="text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded">
                                                  {booking.status.replace(/_/g, ' ')}
                                                </span>
                                              </div>

                                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                                <div>
                                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Inspection / Visit Fee</p>
                                                  <p className="font-extrabold text-slate-850">₹{booking.transportCharge || 0}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Labor Cost</p>
                                                  <p className="font-extrabold text-slate-850">₹{booking.serviceCharge || booking.amount || 0}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Parts / Accessories</p>
                                                  <p className="font-extrabold text-slate-850">₹{booking.sparePartsCost || 0}</p>
                                                </div>
                                              </div>

                                              <div className="border-t border-indigo-100 pt-3">
                                                <div className="flex justify-between items-center bg-indigo-100/50 px-4 py-2.5 rounded-xl border border-indigo-100">
                                                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">Total Invoice Price:</span>
                                                  <span className="text-lg font-black text-indigo-905">
                                                    ₹{(booking.serviceCharge || booking.amount || 0) + (booking.sparePartsCost || 0) + (booking.transportCharge || 0)}
                                                  </span>
                                                </div>
                                              </div>

                                              {booking.detectedIssues && (
                                                <div>
                                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Detected Issues</p>
                                                  <p className="text-xs font-semibold text-slate-700 italic">"{booking.detectedIssues}"</p>
                                                </div>
                                              )}

                                              {booking.quoteReason && (
                                                <div>
                                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Technician Explanation</p>
                                                  <p className="text-xs font-semibold text-slate-700">"{booking.quoteReason}"</p>
                                                </div>
                                              )}

                                              {booking.status === 'quote_pending' && (
                                                <div className="space-y-3 pt-2">
                                                  <div className="flex gap-2">
                                                    <button
                                                      disabled={updatingJobs[booking._id]}
                                                      onClick={() => handleQuoteApproval(booking._id, true)}
                                                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer border-none outline-none"
                                                    >
                                                      {updatingJobs[booking._id] ? <Loader2 size={12} className="animate-spin" /> : <><CheckCircle size={14} /> Approve & Start</>}
                                                    </button>
                                                    <button
                                                      disabled={updatingJobs[booking._id]}
                                                      onClick={() => handleQuoteApproval(booking._id, false)}
                                                      className="flex-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer outline-none"
                                                    >
                                                      {updatingJobs[booking._id] ? <Loader2 size={12} className="animate-spin" /> : <><XCircle size={14} /> Reject</>}
                                                    </button>
                                                  </div>
                                                  
                                                  <button
                                                    onClick={() => setShowClarifyInput(prev => ({ ...prev, [booking._id]: !prev[booking._id] }))}
                                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider border-none outline-none cursor-pointer transition-colors"
                                                  >
                                                    {showClarifyInput[booking._id] ? 'Hide Clarification Input' : 'Ask for Clarification'}
                                                  </button>

                                                  {showClarifyInput[booking._id] && (
                                                    <div className="space-y-2 p-3 bg-white border border-slate-200 rounded-xl animate-in slide-in-from-top-2 duration-200">
                                                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">What needs clarification?</label>
                                                      <textarea
                                                        value={clarificationText}
                                                        onChange={(e) => setClarificationText(e.target.value)}
                                                        placeholder="e.g., Why are these spare parts necessary? Can you explain the labor charges?"
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 text-xs focus:border-indigo-500 transition-all resize-none font-semibold"
                                                        rows={2}
                                                      />
                                                      <button
                                                        disabled={updatingJobs[booking._id] || !clarificationText.trim()}
                                                        onClick={() => handleQuoteClarification(booking._id)}
                                                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white disabled:text-slate-450 font-black py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-1.5 cursor-pointer border-none outline-none"
                                                      >
                                                        {updatingJobs[booking._id] ? <Loader2 size={12} className="animate-spin"/> : 'Send Clarification Request'}
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {booking.status === 'quote_clarification' && (
                                                <div className="p-3 bg-purple-50 border border-purple-100 text-purple-700 rounded-xl text-xs font-semibold leading-relaxed flex items-center gap-2">
                                                  <Clock size={16} className="animate-pulse" />
                                                  <span>Awaiting technician response to your clarification request.</span>
                                                </div>
                                              )}

                                              {booking.status === 'quote_rejected' && (
                                                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold leading-relaxed flex items-center gap-2">
                                                  <XCircle size={16} />
                                                  <span>You rejected this quote. Awaiting a revised quote proposal from the technician.</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          
                                          {/* Actions */}
                                          {booking.providerId && ['assigned', 'accepted', 'on_the_way', 'arrived', 'inspection_started', 'work_started', 'quote_pending', 'quote_clarification', 'quote_rejected'].includes(booking.status) && (
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                                              {(booking.providerPhone || booking.providerId?.phone) && (
                                                <a 
                                                  href={`tel:${formatPhoneLink(booking.providerPhone || booking.providerId?.phone)}`}
                                                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer no-underline text-center"
                                                >
                                                  <PhoneCall size={12} /> Call
                                                </a>
                                              )}
                                              <button 
                                                onClick={() => setChatBookingId(booking._id)}
                                                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-250 cursor-pointer border-none outline-none relative"
                                              >
                                                <MessageSquare size={12} /> Chat
                                                {booking.unreadCount > 0 && (
                                                  <span className="absolute -top-1.5 -right-1.5 bg-rose-505 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border border-slate-900 animate-pulse">{booking.unreadCount}</span>
                                                )}
                                              </button>
                                            </div>
                                          )}

                                          {/* Cancel */}
                                          {!['completed', 'cancelled', 'rejected'].includes(booking.status) && (
                                            <button
                                              onClick={() => setCancelBookingId(booking._id)}
                                              className="w-full bg-slate-50 text-rose-600 hover:bg-rose-100/50 border border-rose-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                                            >
                                              Cancel Booking
                                            </button>
                                          )}

                                          {/* Payments */}
                                          {booking.status === 'completed' && !['completed', 'cash_pending'].includes(booking.paymentStatus) && (
                                            <button
                                              onClick={() => setPaymentBooking(booking)}
                                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none shadow-md"
                                            >
                                              Pay Now Online
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      <button
                                        onClick={() => toggleExpand(booking._id)}
                                        className="mt-4 text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest text-left cursor-pointer border-none bg-transparent outline-none"
                                      >
                                        {expandedBookings[booking._id] ? 'Hide Details' : 'View Full Details'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                          {/* SAVED ADDRESSES TAB */}
                          {activeSubTab === 'addresses' && (
                            <SavedAddresses
                              addresses={addresses}
                              handleAddAddress={handleAddAddress}
                              handleDeleteAddress={handleDeleteAddress}
                              handleMarkAddressDefault={handleMarkAddressDefault}
                              showAddressForm={showAddressForm}
                              setShowAddressForm={setShowAddressForm}
                              addressEditId={addressEditId}
                              setAddressEditId={setAddressEditId}
                              addressForm={addressForm}
                              setAddressForm={setAddressForm}
                            />
                          )}

                          {/* WALLET TAB */}
                          {activeSubTab === 'wallet' && (
                            <WalletView
                              profile={profile}
                              transactions={transactions}
                              walletAddAmount={walletAddAmount}
                              setWalletAddAmount={setWalletAddAmount}
                              handleAddWalletMoney={handleAddWalletMoney}
                            />
                          )}

                          {/* REWARDS TAB */}
                          {activeSubTab === 'rewards' && (
                            <RewardsView bookings={bookings} />
                          )}

                          {/* REFERRAL TAB */}
                          {activeSubTab === 'referral' && (
                            <ReferralView profile={profile} showToast={showToast} />
                          )}

                          {/* NOTIFICATIONS TAB */}
                          {activeSubTab === 'notifications' && (
                            <div className="space-y-6">
                              <div className="flex justify-between items-center pb-4 border-b border-slate-200/80">
                                <div>
                                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                                    <Bell className="text-indigo-400" /> Notification Center
                                  </h2>
                                  <p className="text-xs text-slate-400 mt-1 font-semibold">Review your recent billing, update alerts, and offers</p>
                                </div>
                              </div>
                              <div className="bg-slate-900/20 border border-slate-200/80 rounded-3xl p-6 text-center text-slate-500 font-bold text-sm">
                                All notifications are up to date. You will receive notifications in real-time here.
                              </div>
                            </div>
                          )}

                          {/* SUPPORT TAB */}
                          {activeSubTab === 'support' && (
                            <SupportView
                              supportTickets={supportTickets}
                              ticketForm={ticketForm}
                              setTicketForm={setTicketForm}
                              showTicketForm={showTicketForm}
                              setShowTicketForm={setShowTicketForm}
                              handleRaiseTicket={handleRaiseTicket}
                            />
                          )}

                          {/* SETTINGS TAB */}
                          {activeSubTab === 'settings' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                              <div className="pb-4 border-b border-slate-200/80">
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                                  <Settings className="text-indigo-400" /> Account Settings
                                </h2>
                                <p className="text-xs text-slate-400 mt-1 font-medium font-semibold">Control notifications, privacy, language, and security</p>
                              </div>

                              <div className="space-y-6 divide-y divide-white/5">
                                <div className="space-y-4">
                                  <h3 className="font-extrabold text-sm text-slate-800">Preferences</h3>
                                  <div className="flex justify-between items-center py-2.5">
                                    <div>
                                      <p className="text-xs sm:text-sm font-bold text-white">Interface Dark Mode</p>
                                      <p className="text-[10px] text-slate-500 font-medium">Uses battery saver dark visual profiles</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isDarkMode}
                                        onChange={(e) => setIsDarkMode(e.target.checked)}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-650"></div>
                                    </label>
                                  </div>
                                  <div className="flex justify-between items-center py-2.5">
                                    <div>
                                      <p className="text-xs sm:text-sm font-bold text-white">Preferred Language</p>
                                      <p className="text-[10px] text-slate-500 font-medium">Select dashboard visual display language</p>
                                    </div>
                                    <select
                                      value={preferredLanguage}
                                      onChange={(e) => setPreferredLanguage(e.target.value)}
                                      className="px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl outline-none font-bold text-white text-xs"
                                    >
                                      <option value="English">English</option>
                                      <option value="Hindi">Hindi (हिंदी)</option>
                                      <option value="Telugu">Telugu (తెలుగు)</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="pt-6 space-y-4">
                                  <h3 className="font-extrabold text-sm text-slate-800">Security & Sessions</h3>
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                      onClick={() => setShowSettings(true)}
                                      className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-200/80 hover:border-slate-700 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer outline-none"
                                    >
                                      Update Account Credentials
                                    </button>
                                    <button
                                      onClick={async () => {
                                        localStorage.removeItem('token');
                                        window.location.href = '/login';
                                      }}
                                      className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer outline-none"
                                    >
                                      Sign Out of All Sessions
                                    </button>
                                  </div>
                                </div>

                                <div className="pt-6 space-y-4">
                                  <h3 className="font-extrabold text-sm text-rose-600">Danger Zone</h3>
                                  <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                      <p className="text-xs sm:text-sm font-bold text-white">Permanently Delete Account</p>
                                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">This action deletes all active booking logs and KYC information.</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (window.confirm("Are you absolutely sure you want to request account deletion? This action is permanent and irreversible.")) {
                                          showToast('Delete Request Filed ⚠️', 'Account deletion request received and pending admin action.', 'warning');
                                        }
                                      }}
                                      className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-4.5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer border-none outline-none"
                                    >
                                      Delete Account
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>

                      {/* Bottom Nav for mobile */}
                      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 px-4 py-2.5 flex justify-between z-45">
                        {sidebarItems.slice(0, 5).map(item => {
                          const IconComp = item.icon;
                          const isSelected = activeSubTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveSubTab(item.id)}
                              className={`flex flex-col items-center gap-1 cursor-pointer border-none bg-transparent outline-none ${
                                isSelected ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'
                              }`}
                            >
                              <IconComp size={18} />
                              <span className="text-[8px] font-bold">{item.label.split(' ')[0]}</span>
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setActiveSubTab('settings')}
                          className={`flex flex-col items-center gap-1 cursor-pointer border-none bg-transparent outline-none ${
                            activeSubTab === 'settings' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          <Settings size={18} />
                          <span className="text-[8px] font-bold">Settings</span>
                        </button>
                      </div>

                    </div>
                  )}

                  {/* --- OVERLAYS & MODALS --- */}
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
                        showToast("Settings Updated ✅", "Settings updated successfully", "success");
                      }}
                    />
                  )}

                  {viewReasonBooking && (
                    <div className="fixed inset-0 z-[999] bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-center p-4">
                      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-white">
                        <h3 className="text-xl font-black text-slate-900 mb-2">Cancellation Details</h3>
                        <div className="space-y-4 my-6">
                          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-350 text-xs sm:text-sm font-semibold">
                            <span className="font-extrabold text-[10px] bg-rose-500/20 text-rose-350 px-2.5 py-1 rounded uppercase tracking-wider block mb-2 w-max border border-rose-500/30">Reason Given</span>
                            "{viewReasonBooking.cancellationReason || 'No reason provided.'}"
                          </div>
                          <div className="text-xs text-slate-400 font-semibold space-y-2 pl-1">
                            <p>Cancelled By: <strong className="text-slate-800 capitalize">{viewReasonBooking.cancelledBy || 'system'}</strong></p>
                            {viewReasonBooking.cancelledAt && (
                              <p>Cancelled On: <strong className="text-slate-800">{new Date(viewReasonBooking.cancelledAt).toLocaleString()}</strong></p>
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
                          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all cursor-pointer border-none outline-none"
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
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-slate-800 outline-none text-sm font-semibold focus:border-red-500 transition-all resize-none"
                            required
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => setCancelBookingId(null)} 
                            disabled={submittingCancellation}
                            className="flex-1 border border-white/10 hover:bg-white/5 text-slate-355 font-bold py-3 rounded-xl transition-all text-xs sm:text-sm uppercase tracking-wider outline-none disabled:opacity-50 cursor-pointer"
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
                          className="text-slate-400 hover:text-slate-800 self-start transition-colors font-bold text-xs p-1"
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
