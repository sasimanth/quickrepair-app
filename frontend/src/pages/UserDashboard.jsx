import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api'; 
import { globalCategories, globalServices, getDbServices } from '../data/services';
import SearchableServiceSelector from '../components/SearchableServiceSelector';
import SearchableAreaSelector from '../components/SearchableAreaSelector';
import { subscribeToPushNotifications } from '../services/pushNotification';
import { requestFcmPermission } from '../services/firebase';
import { Calendar, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, Plus, LayoutDashboard, Wrench, Settings, Star, User, ChevronRight, MessageSquare, Camera, UploadCloud, Loader2, Shield, ShieldCheck, HelpCircle, Truck, Home, Search, Eye, Zap, Maximize2, Hash, Layers, Paintbrush, Tv, X, CreditCard, Sparkles, PhoneCall, Bell, Copy, Share2, Trash2, Edit, CheckSquare, RefreshCw, Menu } from 'lucide-react';
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
import HelpSupportView from '../components/HelpSupportView';

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
  const { user: authUser } = useAuth();

  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.user || parsed;
      }
    } catch (e) {}
    return null;
  };

  const [profile, setProfile] = useState(() => authUser || getStoredUser() || null);
  const currentUserId = profile?.userId || profile?._id || profile?.id || authUser?._id || authUser?.id || authUser?.email || 'demo_user';
  
  useEffect(() => {
    if (authUser) {
      setProfile(prev => prev || authUser);
    } else {
      const stored = getStoredUser();
      if (stored) setProfile(prev => prev || stored);
    }
  }, [authUser]);

  const [bookings, setBookings] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [toasts, setToasts] = useState([]);

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

  // Settings & Profile states
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [filterTab, setFilterTab] = useState('all');
  const [expandedBookings, setExpandedBookings] = useState({});
  const toggleExpand = (id) => setExpandedBookings(prev => ({ ...prev, [id]: !prev[id] }));

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '👤'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || profile.location || '',
        avatar: profile.avatar || '👤'
      });
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/users/profile', profileForm);
      const updated = data.user || { ...profile, ...profileForm };
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setIsEditingProfile(false);
      showToast('Profile Updated! ✅', 'Your profile details have been saved successfully.', 'success');
    } catch (err) {
      setProfile(prev => ({ ...prev, ...profileForm }));
      setIsEditingProfile(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const [dispatchStatus, setDispatchStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const queryParams = new URLSearchParams(location.search);
  const initialShowForm = queryParams.get('action') === 'book';
  const initialShowPremium = queryParams.get('action') === 'premium';
  const initialService = queryParams.get('service');
  const [showForm, setShowForm] = useState(initialShowForm);
  const [showPremiumModal, setShowPremiumModal] = useState(initialShowPremium);
  const [services, setServices] = useState(globalServices);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Booking Form & Tech match states
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
  const [liveLocations, setLiveLocations] = useState({});
  const techSectionRef = useRef(null);

  // Quote Action states
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
      fetchData(false);
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
      fetchData(false);
    } catch (error) {
       const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
       alert(`Failed to update quote status: ${errorMsg}`);
       console.error(error);
       fetchData(false);
    } finally {
       setUpdatingJobs(prev => ({ ...prev, [bookingId]: false }));
    }
  };

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
      setBookings(prev => prev.map(b => b._id === cancelBookingId ? { ...b, status: 'cancelled', cancellationReason } : b));
      setCancelBookingId(null);
      setCancellationReason('');
      showToast('Booking Cancelled ❌', 'Your booking request was successfully cancelled.', 'info');
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setSubmittingCancellation(false);
    }
  };

  const [formData, setFormData] = useState({
    serviceId: initialService || '',
    date: new Date().toISOString().split('T')[0],
    deviceType: '',
    houseType: '',
    areaSize: '',
    numberOfRooms: '',
    wallArea: '',
    indoorOutdoor: '',
    paintPreference: '',
    vehicleModel: '',
    vehicleServiceType: 'Doorstep Visit',
    applianceBrand: '',
    problemDescription: '',
    location: 'Madanapalle Main Town',
    detailedAddress: '',
    landmark: '',
    gpsLocation: null,
    imageUrl: '',
    serviceOption: 'direct',
    unknownProblem: false
  });

  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState(null);

  async function fetchData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      setFetchError(null);

      const token = localStorage.getItem('token');
      
      let bookingFailed = false;
      try {
        if (token) {
          const bookingsRes = await api.get('/bookings');
          const list = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data?.bookings || []);
          setBookings(list);

          list.filter(b => b && b.status === 'accepted' && b.providerId).forEach(b => {
            socket.emit('track_tech', b.providerId);
          });
        }
      } catch (err) {
        console.warn('Could not fetch bookings from backend API:', err.message);
        bookingFailed = true;
      }

      try {
        if (token) {
          const profileRes = await api.get('/users/profile');
          if (profileRes.data) {
            const userObj = profileRes.data.user || profileRes.data;
            setProfile(userObj);
            localStorage.setItem('user', JSON.stringify(userObj));
          }
        }
      } catch (err) {
        console.warn('Could not fetch profile from backend API:', err.message);
      }

      if (bookingFailed && !bookings.length) {
        setFetchError('Backend server is waking up or temporarily unavailable. Showing saved local session data.');
      }

    } catch (error) { 
      console.error('Error fetching dashboard data:', error);
      setFetchError('Unable to connect to Fixvo backend servers. Please retry.');
    } finally { 
      if (showLoading) setLoading(false); 
    }
  }

  const showToast = (title, message, type = 'info', silent = false) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    if (!silent) {
      playNotificationSound('low');
    }
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

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

  const selectedServiceObj = useMemo(() => {
    return services.find(s => s.id === formData.serviceId) || globalServices.find(s => s.id === formData.serviceId);
  }, [services, formData.serviceId]);
  const categoryId = selectedServiceObj ? selectedServiceObj.categoryId : '';
  const serviceNameLower = selectedServiceObj?.name?.toLowerCase() || '';

  useEffect(() => {
    getDbServices().then(setServices);
    fetchData(true);
    subscribeToPushNotifications();
    requestFcmPermission();
    const interval = setInterval(() => fetchData(false), 8000);

    const handleLocationUpdate = (data) => {
       setLiveLocations(prev => ({ ...prev, [data.techId]: [data.lat, data.lng] }));
    };

    socket.on('location_update', handleLocationUpdate);

    return () => {
      clearInterval(interval);
      socket.off('location_update', handleLocationUpdate);
    };
  }, []);

  useEffect(() => {
    if (currentUserId) {
      const savedAdd = localStorage.getItem('saved_addresses_' + currentUserId);
      if (savedAdd) setAddresses(JSON.parse(savedAdd));

      const savedTx = localStorage.getItem('wallet_transactions_' + currentUserId);
      if (savedTx) setTransactions(JSON.parse(savedTx));

      const savedTickets = localStorage.getItem('support_tickets_' + currentUserId);
      if (savedTickets) setSupportTickets(JSON.parse(savedTickets));
    }
  }, [currentUserId]);

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
      setFormData(prev => ({ ...prev, imageUrl: reader.result }));
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
            gpsLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            landmark: prev.landmark || `GPS Pin: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          }));
          showToast('GPS Location Detected 📍', 'Current coordinates attached to booking request.', 'success', true);
        },
        () => {
          alert("Please allow location access in your browser to share live GPS.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceId) {
      alert('Please select a service.');
      return;
    }
    setStep(2);
    setFetchingTechs(true);

    setTimeout(() => {
      techSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const queryParams = new URLSearchParams();
      if (formData.location) queryParams.append('area', formData.location);
      if (formData.serviceId) queryParams.append('serviceId', formData.serviceId);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await api.get(`/technicians/nearby${queryString}`);
      setTechnicians(res.data || []);
    } catch (err) {
      console.error('Failed to fetch technicians', err);
      setTechnicians([]);
    } finally {
      setFetchingTechs(false);
    }
  };

  const [isBooking, setIsBooking] = useState(false);

  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
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
        service: selectedServiceName,
        providerId: selectedTech.id,
        promoCode: promoCode,
        discountPercentage: discountAmount
      };
      await api.post('/bookings', payload);
      
      showToast('Booking Request Submitted 🚀', 'Your booking request has been sent to the technician.', 'success');
      localStorage.removeItem('pendingBooking');
      setShowForm(false);
      setStep(1);
      setSelectedTech(null);
      fetchData(false);
    } catch (error) {
      console.error("Booking submission error:", error);
      const errMsg = error.response?.data?.message || 'Unable to process booking. Please try again.';
      showToast('Booking Failed ❌', errMsg, 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const handleLightningMatch = async () => {
    if (technicians.length === 0 || isBooking) return;
    const bestTech = [...technicians].sort((a, b) => {
      if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
      return (b.jobsCompleted || 0) - (a.jobsCompleted || 0);
    })[0];

    setSelectedTech(bestTech);
    setIsBooking(true);

    setTimeout(async () => {
      try {
        const selectedServiceName = globalServices.find(s => s.id === formData.serviceId)?.name || 'Unknown Service';
        const payload = {
          ...formData,
          service: selectedServiceName,
          providerId: bestTech.id,
          promoCode: promoCode,
          discountPercentage: discountAmount
        };
        await api.post('/bookings', payload);

        showToast('Technician Assigned Successfully! 👨‍🔧', `Matched with top expert ${bestTech.name}.`, 'success');
        localStorage.removeItem('pendingBooking');
        setShowForm(false);
        setStep(1);
        setSelectedTech(null);
        fetchData(false);
      } catch (error) {
        console.error("Lightning match failed:", error);
        const errMsg = error.response?.data?.message || 'Auto-dispatch failed. Please select a technician manually.';
        showToast('Auto-Dispatch Failed ❌', errMsg, 'error');
      } finally {
        setIsBooking(false);
      }
    }, 1200);
  };

  // Saved Address Handlers
  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.details) return;

    const newAddress = {
      id: addressEditId || Date.now().toString(),
      type: addressForm.type || 'Home',
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
    if (currentUserId) {
      localStorage.setItem('saved_addresses_' + currentUserId, JSON.stringify(updatedAddresses));
    }

    setAddressForm({ type: 'Home', name: '', details: '', isDefault: false });
    setAddressEditId(null);
    setShowAddressForm(false);
    showToast(addressEditId ? 'Address Updated ✅' : 'Address Saved ✅', 'Your service address has been saved.', 'success', true);
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(addr => addr.id !== id);
    if (addresses.find(addr => addr.id === id)?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    if (currentUserId) {
      localStorage.setItem('saved_addresses_' + currentUserId, JSON.stringify(updated));
    }
    showToast('Address Deleted 🗑️', 'Address removed from your saved list.', 'info', true);
  };

  const handleMarkAddressDefault = (id) => {
    const updated = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    setAddresses(updated);
    if (currentUserId) {
      localStorage.setItem('saved_addresses_' + currentUserId, JSON.stringify(updated));
    }
    showToast('Default Address Changed ✅', 'Your default service address has been updated.', 'success', true);
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
    const updatedProfile = profile ? { ...profile, walletBalance: newBalance } : { walletBalance: newBalance };
    setProfile(updatedProfile);
    localStorage.setItem('user', JSON.stringify(updatedProfile));

    const newTx = {
      id: 'tx_' + Date.now(),
      type: 'credit',
      desc: 'Wallet Top Up',
      amount,
      date: new Date().toISOString()
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);

    if (currentUserId) {
      localStorage.setItem('wallet_transactions_' + currentUserId, JSON.stringify(updatedTxs));
    }

    api.put('/users/profile', { walletBalance: newBalance }).catch(() => {});

    setWalletAddAmount('');
    showToast('Top Up Successful 🎉', `₹${amount} added successfully to your Fixvo Wallet!`, 'success');
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Finding Tech' },
      assigned: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, label: 'Assigned' },
      queued: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: 'Tech Busy' },
      accepted: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: CheckCircle, label: 'Accepted' },
      on_the_way: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Truck, label: 'Tech On Way' },
      arrived: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: MapPin, label: 'Tech Arrived' },
      in_progress: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Wrench, label: 'In Progress' },
      quote_pending: { color: 'bg-purple-100 text-purple-800 border-purple-300 font-extrabold', icon: CreditCard, label: 'Quote Pending Approval' },
      quote_clarification: { color: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold', icon: MessageSquare, label: 'Question Sent to Tech' },
      quote_rejected: { color: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold', icon: XCircle, label: 'Quote Declined' },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Completed' },
      rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Rejected' },
      cancelled: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Cancelled' }
    };
    const { color, icon: Icon, label } = config[status] || { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock, label: status };
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${color}`}>
        <Icon size={14} />
        {label || status}
      </span>
    );
  };

  const safeBookingsList = Array.isArray(bookings) ? bookings : [];
  
  const filteredBookings = safeBookingsList.filter(b => {
    if (!b) return false;
    const query = searchQuery.toLowerCase();
    const matchesService = (b.serviceId?.name || b.serviceName || '').toLowerCase().includes(query);
    const bookingIdStr = (b._id || b.id || '').toString();
    const matchesId = bookingIdStr.toLowerCase().includes(query);
    const matchesStatus = (b.status || '').toLowerCase().includes(query);
    const matchesSearch = matchesService || matchesId || matchesStatus;

    if (filterTab === 'active') {
      return matchesSearch && !['completed', 'cancelled'].includes(b.status);
    } else if (filterTab === 'completed') {
      return matchesSearch && b.status === 'completed';
    }
    return matchesSearch;
  });

  const activeBooking = safeBookingsList.find(b => b && ['requested', 'accepted', 'assigned', 'on_the_way', 'in_progress', 'inspection_started', 'quote_pending', 'quote_clarification'].includes(b.status));

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'wallet', label: 'Wallet', icon: CreditCard },
    { id: 'rewards', label: 'Rewards & Offers', icon: Sparkles },
    { id: 'referral', label: 'Refer & Earn', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
    { id: 'menu', label: 'Menu & Account', icon: Menu },
  ];

  // Helper component to render quote approval card
  const renderQuoteProposalCard = (b) => {
    if (b.status !== 'quote_pending' && b.status !== 'quote_clarification') return null;

    return (
      <div className="mt-3 p-4 sm:p-5 bg-gradient-to-br from-amber-50 to-orange-50/70 rounded-2xl border border-amber-300 shadow-sm space-y-4 animate-in fade-in duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-amber-200/80">
          <h4 className="text-slate-900 font-extrabold text-sm flex items-center gap-2">
            <CreditCard size={18} className="text-amber-600"/> Technician Quote Proposal
          </h4>
          <span className="text-amber-900 text-[10px] font-black uppercase tracking-wider bg-amber-200/90 px-2.5 py-1 rounded-full border border-amber-300 animate-pulse">
            Approval Required
          </span>
        </div>

        {/* Cost Breakdown Matrix */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600 font-semibold">
            <span>Service & Labour Charge:</span>
            <strong className="text-slate-900">₹{b.serviceCharge || 199}</strong>
          </div>
          <div className="flex justify-between text-slate-600 font-semibold">
            <span>Spare Parts & Material:</span>
            <strong className="text-slate-900">₹{b.sparePartsCost || 0}</strong>
          </div>
          <div className="flex justify-between text-slate-600 font-semibold pb-2 border-b border-slate-100">
            <span>Visiting & Transport Fee:</span>
            <strong className="text-slate-900">₹{b.transportCharge || 50}</strong>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Total Guaranteed Quote:</span>
            <span className="text-xl font-black text-emerald-700">₹{b.finalQuote || b.amount || 0}</span>
          </div>
        </div>

        {/* Diagnosis & Explanation */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 text-xs space-y-1.5">
          {b.detectedIssues && (
            <div>
              <p className="text-amber-900 font-extrabold text-[11px]">Diagnosed Problem:</p>
              <p className="text-slate-700 italic font-medium">"{b.detectedIssues}"</p>
            </div>
          )}
          <p className="text-blue-900 font-extrabold text-[11px]">Technician's Note & Explanation:</p>
          <p className="text-slate-700 italic font-medium">"{b.quoteReason || 'Diagnosed root cause and replaced necessary parts for repair.'}"</p>
          {b.quotePhoto && (
            <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 shadow-xs">
              <img src={b.quotePhoto} className="w-full h-32 object-cover" alt="Inspection Proof" />
            </div>
          )}
        </div>

        {/* Question & Clarification Input */}
        {showClarifyInput[b._id] ? (
          <div className="space-y-2 bg-white p-3 rounded-xl border border-amber-200">
            <input
              type="text"
              placeholder="Ask technician a question about this quote..."
              value={clarificationText}
              onChange={(e) => setClarificationText(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-blue-600"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClarifyInput(prev => ({ ...prev, [b._id]: false }))}
                className="px-3 py-1 text-slate-500 font-bold text-xs cursor-pointer border-none bg-transparent"
              >
                Cancel
              </button>
              <button
                onClick={() => handleQuoteClarification(b._id)}
                disabled={updatingJobs[b._id]}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg border-none cursor-pointer"
              >
                Send Question
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClarifyInput(prev => ({ ...prev, [b._id]: true }))}
            className="text-[11px] font-extrabold text-amber-900 hover:text-amber-950 underline cursor-pointer bg-transparent border-none p-0"
          >
            💬 Have a question about this quote? Ask technician
          </button>
        )}

        {/* Accept & Reject Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            disabled={updatingJobs[b._id]}
            onClick={() => handleQuoteApproval(b._id, false)}
            className="w-full bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs flex justify-center items-center gap-1.5"
          >
            {updatingJobs[b._id] ? <Loader2 size={14} className="animate-spin"/> : '✕ Decline Quote'}
          </button>

          <button
            disabled={updatingJobs[b._id]}
            onClick={() => handleQuoteApproval(b._id, true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-600/10 flex justify-center items-center gap-1.5 border-none"
          >
            {updatingJobs[b._id] ? <Loader2 size={14} className="animate-spin"/> : '✓ Approve & Start Work'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 select-none">
      
      {/* Compact Urban Company Native Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0">
            {profile?.avatar || authUser?.avatar || '👤'}
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
              Welcome, {profile?.name?.split(' ')[0] || authUser?.name?.split(' ')[0] || 'Customer'}! 👋
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[180px] sm:max-w-xs">
              📍 {profile?.address || profile?.location || 'Select Location'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm border-none cursor-pointer"
          >
            <Plus size={14} /> Book Service
          </button>

          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-200 transition cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-200 transition cursor-pointer"
            title="Account Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 animate-in fade-in duration-300">
        
        {/* Booking Form View */}
        {showForm ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden space-y-6">
            <div className={`absolute top-0 left-0 h-1.5 bg-blue-600 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
            
            {/* Form Top Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                  <Wrench size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    {step === 1 ? 'Schedule a Service Booking' : 'Select Expert Technician'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Verify details and match with top-rated local technicians</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full ${step >= 1 ? 'bg-blue-600 text-white font-black' : 'text-slate-400'}`}>1. Details</span>
                  <ChevronRight size={12} className="text-slate-400"/>
                  <span className={`px-2.5 py-0.5 rounded-full ${step >= 2 ? 'bg-blue-600 text-white font-black' : 'text-slate-400'}`}>2. Match Tech</span>
                </div>
                <button 
                  onClick={() => { setShowForm(false); setStep(1); setSelectedTech(null); }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* STEP 1: Details */}
            {step === 1 && (
              <form onSubmit={handleInitialSubmit} className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-[ping_2s_infinite]"></span>
                  <p className="text-xs sm:text-sm font-semibold">
                    High Demand Notice: Only <span className="font-black text-amber-700">2 technicians</span> available near you right now.
                  </p>
                </div>

                {/* Service Visit Mode Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <Wrench size={14} className="text-blue-600"/> Select Service Booking Option
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'direct', label: '⚡ Direct Technician Visit', desc: 'Doorstep repair visit with instant on-site solution', tag: 'Standard' },
                      { id: 'inspection', label: '🔍 Inspection & Diagnosis', desc: 'Root cause diagnosis & itemized quote prior to repair', tag: '₹99 Inspection' },
                      { id: 'emergency', label: '🚨 Emergency 30-Min Dispatch', desc: 'Priority urgent booking for water leakages or short circuit', tag: 'Priority' }
                    ].map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setFormData({ ...formData, serviceOption: opt.id })}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          formData.serviceOption === opt.id
                            ? 'border-blue-600 bg-blue-50/60 shadow-xs scale-[1.01]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-slate-900 text-xs">{opt.label}</span>
                          <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{opt.tag}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 ml-1">
                      <Settings size={14} className="text-blue-600"/> Select Service
                    </label>
                    <SearchableServiceSelector
                      value={formData.serviceId}
                      onChange={(serviceId) => setFormData({ ...formData, serviceId })}
                      theme="light"
                      placeholder="Search and select a service..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 ml-1">
                      <Calendar size={14} className="text-blue-600"/> Preferred Service Date
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-slate-900 rounded-2xl outline-none text-xs"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Dynamic Category Specific Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  {categoryId === 'repair' && (
                    <div className="space-y-2 col-span-full md:col-span-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Smartphone size={14} className="text-blue-600"/> Device Type / Brand
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. iPhone 13 Pro, HP Pavilion Laptop, Samsung Fridge"
                        required
                        className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
                        value={formData.deviceType || ''}
                        onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                      />
                    </div>
                  )}

                  {categoryId === 'cleaning' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Home size={14} className="text-blue-600"/> House / Premise Type
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
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
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Maximize2 size={14} className="text-blue-600"/> Area Size (Sq Ft)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1200 sq ft"
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
                          value={formData.areaSize || ''}
                          onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {(categoryId === 'painting' || serviceNameLower.includes('paint')) && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Home size={14} className="text-blue-600"/> Premise Area to Paint
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
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
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Maximize2 size={14} className="text-blue-600"/> Wall Area Size (Sq Ft)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1500 sq ft"
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
                          value={formData.wallArea || ''}
                          onChange={(e) => setFormData({ ...formData, wallArea: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {(categoryId === 'vehicle' || serviceNameLower.includes('bike') || serviceNameLower.includes('car')) && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Truck size={14} className="text-blue-600"/> Vehicle Brand & Model
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Honda City 2021, Royal Enfield Classic 350"
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
                          value={formData.vehicleModel || ''}
                          onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Wrench size={14} className="text-blue-600"/> Service Option
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
                          value={formData.vehicleServiceType || ''}
                          onChange={(e) => setFormData({ ...formData, vehicleServiceType: e.target.value })}
                        >
                          <option value="Doorstep Visit">Doorstep Mechanic Visit</option>
                          <option value="Full Service">Full General Service & Water Wash</option>
                          <option value="Emergency Breakdown">Roadside Breakdown Support</option>
                        </select>
                      </div>
                    </>
                  )}

                  {(categoryId === 'appliance' || serviceNameLower.includes('ac') || serviceNameLower.includes('washing')) && (
                    <div className="space-y-2 col-span-full md:col-span-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Tv size={14} className="text-blue-600"/> Appliance Brand / Capacity
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Voltas 1.5 Ton Split AC, IFB 7kg Front Load"
                        required
                        className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
                        value={formData.applianceBrand || ''}
                        onChange={(e) => setFormData({ ...formData, applianceBrand: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2 col-span-full">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle size={14} className="text-blue-600"/> Describe Issue / Problem in Detail
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. AC is not cooling properly, makes squeaking noise when turned on..."
                      className="w-full p-4 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs resize-none"
                      value={formData.problemDescription}
                      onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                    />
                  </div>
                </div>

                {/* Location & Address Section */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" /> Doorstep Service Address
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Area / Locality</label>
                      <SearchableAreaSelector
                        value={formData.location}
                        onChange={(location) => setFormData({ ...formData, location })}
                        theme="light"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Landmark / Nearby Spot</label>
                      <input
                        type="text"
                        placeholder="e.g. Near RTC Bus Stand, Opp SBI Bank"
                        className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
                        value={formData.landmark || ''}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Street Address & House/Flat No.</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Door No 4-12, Green Park Colony, Madanapalle"
                      className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-600 font-semibold text-slate-900 rounded-xl outline-none text-xs"
                      value={formData.detailedAddress || ''}
                      onChange={(e) => setFormData({ ...formData, detailedAddress: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAutoDetectLocation}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <MapPin size={14} /> Detect GPS Location
                    </button>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-all">
                      <UploadCloud size={14} className="text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">
                        {uploadingImage ? 'Uploading Image...' : formData.imageUrl ? 'Photo Attached ✓' : 'Upload Inspection Photo (Optional)'}
                      </span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Form Action CTAs */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setStep(1); setSelectedTech(null); }}
                    className="px-5 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={fetchingTechs || !formData.serviceId}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-blue-600/10 cursor-pointer border-none flex items-center gap-2"
                  >
                    {fetchingTechs ? 'Searching Experts...' : 'Next: Choose Technician →'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Match Technician */}
            {step === 2 && (
              <div ref={techSectionRef} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                {fetchingTechs ? (
                  <div className="flex flex-col items-center py-16 space-y-6 text-center">
                    <div className="relative flex items-center justify-center w-20 h-20">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                      <div className="relative z-10 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg text-white font-extrabold">
                        <Search className="w-6 h-6 animate-spin text-white" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-base">Scanning Madanapalle Area...</p>
                      <p className="text-xs text-slate-500 font-medium">Connecting with available top-rated technicians near you...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Instant Lightning Dispatch Card */}
                    {technicians.length > 0 && (
                      <button
                        onClick={handleLightningMatch}
                        disabled={isBooking}
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all text-left cursor-pointer border-none outline-none relative overflow-hidden group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white">
                              <Sparkles size={22} />
                            </div>
                            <div>
                              <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
                                {isBooking ? 'Auto-Dispatching...' : '⚡ Lightning Match (Instant Auto-Assign)'}
                              </h3>
                              <p className="text-blue-100 font-medium text-xs mt-0.5">Auto-assign the highest-rated technician near you instantly with 1 click</p>
                            </div>
                          </div>
                          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0">
                            Recommended
                          </span>
                        </div>
                      </button>
                    )}

                    {/* Search Technicians Input */}
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Search size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Search technician by name, skill, or locality..."
                        value={techSearchQuery}
                        onChange={(e) => setTechSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 font-medium text-slate-900 shadow-xs outline-none text-xs"
                      />
                    </div>

                    {/* Technician Cards List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTechnicians.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-500 font-semibold text-xs">
                          No technicians found matching your search. Try adjusting the search term.
                        </div>
                      ) : (
                        filteredTechnicians.map((tech) => {
                          const isSelected = selectedTech?.id === tech.id;
                          return (
                            <div
                              key={tech.id}
                              onClick={() => setSelectedTech(tech)}
                              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/50 shadow-md scale-[1.01]'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl shadow-inner shrink-0">
                                    {tech.avatar || '👨‍🔧'}
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="font-extrabold text-slate-900 text-sm truncate flex items-center gap-1">
                                      {tech.name}
                                      <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                                    </h3>
                                    <span className="text-[9px] bg-blue-100 text-blue-800 font-black uppercase tracking-wider px-2 py-0.5 rounded mt-0.5 inline-block">
                                      Verified Pro
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
                                  <span className="flex items-center text-amber-500 font-black">
                                    <Star size={12} className="fill-current mr-1"/> {tech.rating || '4.9'}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[10px] text-slate-600 font-bold">{tech.jobsCompleted || 50}+ Jobs</span>
                                </div>
                              </div>

                              <div className="space-y-1.5 text-[10px] pt-3 border-t border-slate-100 mt-2">
                                <div className="flex justify-between items-center text-slate-600 font-semibold">
                                  <span>Service Fee:</span>
                                  <strong className="text-slate-900">₹{tech.baseFee || 199} Base</strong>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 font-semibold">
                                  <span>Location:</span>
                                  <strong className="text-emerald-700">{tech.distance || tech.area || 'Available Now'}</strong>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Promo Code Box */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter Promo Code (e.g. FIXVO10)"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-600 outline-none uppercase font-bold text-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (promoCode === 'FIXVO10' || promoCode === 'WELCOME100') {
                              setDiscountAmount(10);
                              alert('Promo code applied! 10% discount added to final quote.');
                            } else {
                              setDiscountAmount(0);
                              alert('Invalid promo code');
                            }
                          }}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs cursor-pointer border-none"
                        >
                          Apply
                        </button>
                      </div>
                      {discountAmount > 0 && <p className="text-emerald-700 text-xs font-bold mt-2">✓ 10% Discount Applied to Final Bill</p>}
                    </div>

                    {/* Final Action CTAs */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={isBooking}
                        className="px-5 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-50"
                      >
                        ← Back to Details
                      </button>

                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={isBooking || !selectedTech}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-blue-600/10 cursor-pointer border-none flex items-center gap-2"
                      >
                        {isBooking ? 'Booking...' : selectedTech ? `Confirm & Book ${selectedTech.name}` : 'Select a Tech to Continue'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            {/* Desktop Left Navigation Sidebar */}
            <div className="hidden md:block md:col-span-1 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-3 space-y-1 shadow-sm sticky top-20">
                {sidebarItems.map(item => {
                  const IconComp = item.icon;
                  const isSelected = activeSubTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSubTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border-none outline-none text-left tracking-wide ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <IconComp size={16} className={isSelected ? "text-white" : "text-slate-400"} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content Pane */}
            <div className="md:col-span-3 bg-white border border-slate-200 rounded-[2rem] p-5 sm:p-8 shadow-sm min-h-[500px]">

              {/* OVERVIEW TAB */}
              {activeSubTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Welcome back, {profile?.name?.split(' ')[0] || authUser?.name?.split(' ')[0] || 'Customer'}! 👋</h2>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">Track active repairs, manage wallet balance, and review special offers</p>
                    </div>
                  </div>

                  {/* Active Booking Tracker */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                      <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Active Service Status</h3>
                      {activeBooking && (
                        <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 animate-pulse">Live Tracker Active</span>
                      )}
                    </div>

                    {activeBooking ? (
                      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-blue-100/80 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                                {activeBooking.serviceName || 'Home Repair'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-500">ID: #{((activeBooking._id || activeBooking.id || 'N/A').toString()).slice(-6).toUpperCase()}</span>
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mt-1">₹{activeBooking.finalQuote || activeBooking.amount || 0}</h4>
                            <p className="text-xs text-slate-600 font-medium">{activeBooking.location}</p>
                          </div>

                          <div className="flex flex-col items-start sm:items-end gap-1.5">
                            {getStatusBadge(activeBooking.status)}
                          </div>
                        </div>

                        {/* Render Quote proposal card if pending quote approval */}
                        {renderQuoteProposalCard(activeBooking)}

                        <div className="flex items-center justify-between pt-2">
                          <p className="text-xs font-semibold text-slate-600">Assigned Tech: <strong className="text-slate-900">{activeBooking.technicianName || 'Expert Pro'}</strong></p>
                          <div className="flex gap-2">
                            {(activeBooking.providerPhone || activeBooking.providerId?.phone) && (
                              <a 
                                href={`tel:${formatPhoneLink(activeBooking.providerPhone || activeBooking.providerId?.phone)}`}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 no-underline"
                              >
                                <PhoneCall size={12} /> Call
                              </a>
                            )}
                            <button
                              onClick={() => setChatBookingId(activeBooking._id)}
                              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold border-none cursor-pointer flex items-center gap-1 relative"
                            >
                              <MessageSquare size={12} /> Chat
                              {activeBooking.unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border border-white animate-pulse">{activeBooking.unreadCount}</span>
                              )}
                            </button>
                            <button
                              onClick={() => setActiveSubTab('bookings')}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold border-none cursor-pointer"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 text-center space-y-2">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                          <Wrench size={20} />
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-800">No active bookings right now</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Click "Book Service" to request an expert technician near you.</p>
                      </div>
                    )}
                  </div>

                  {/* Performance Snapshot Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-xs">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
                      <span className="text-2xl font-black text-blue-600 mt-1 block">{safeBookingsList.length}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-xs">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Completed Services</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">{safeBookingsList.filter(b => b.status === 'completed').length}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-xs">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Wallet Balance</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">₹{(profile?.walletBalance || 0).toFixed(0)}</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-xs">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Saved Addresses</span>
                      <span className="text-2xl font-black text-amber-600 mt-1 block">{addresses.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* BOOKINGS TAB */}
              {activeSubTab === 'bookings' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <Calendar className="text-blue-600" /> My Service Bookings
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">Track active repair orders, review technician quotes, and payment history</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        onClick={() => setFilterTab('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${filterTab === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
                      >
                        All ({safeBookingsList.length})
                      </button>
                      <button
                        onClick={() => setFilterTab('active')}
                        className={`px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${filterTab === 'active' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setFilterTab('completed')}
                        className={`px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${filterTab === 'completed' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 font-semibold text-sm bg-slate-50/50 border border-slate-100 rounded-2xl">
                      No repair bookings found in this view.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBookings.map(b => {
                        const isExpanded = expandedBookings[b._id || b.id];
                        return (
                          <div id={`booking-card-${b._id || b.id}`} key={b._id || b.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-slate-900 text-sm sm:text-base">{b.serviceName || 'Home Repair Service'}</span>
                                  <span className="text-[10px] font-mono font-bold text-slate-400">#{((b._id || b.id || '').toString()).slice(-6).toUpperCase()}</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">{b.location}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {getStatusBadge(b.status)}
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  {b.date ? new Date(b.date).toLocaleDateString() : 'Today'}
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Quoted Amount</span>
                                <strong className="text-slate-900 text-base">₹{b.finalQuote || b.amount || 0}</strong>
                              </div>
                              <div className="text-right space-y-0.5">
                                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Assigned Technician</span>
                                <strong className="text-slate-800 font-bold">{b.technicianName || 'Expert Pro'}</strong>
                              </div>
                            </div>

                            {/* QUOTE PROPOSAL CARD IF PENDING APPROVAL */}
                            {renderQuoteProposalCard(b)}

                            {/* Details Toggle Content */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-slate-100 space-y-3 text-xs font-semibold animate-in fade-in duration-200">
                                <p className="text-slate-600 leading-relaxed font-medium"><strong className="text-slate-900">Problem Description:</strong> {b.problemDescription || 'General Service & Repair'}</p>
                                <p className="text-slate-600 leading-relaxed font-medium"><strong className="text-slate-900">Address Details:</strong> {b.detailedAddress || b.location}</p>
                                {b.landmark && <p className="text-slate-600"><strong className="text-slate-900">Landmark:</strong> {b.landmark}</p>}
                                {b.deviceType && <p className="text-slate-600"><strong className="text-slate-900">Device Type:</strong> {b.deviceType}</p>}

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                  {(b.providerPhone || b.providerId?.phone) && (
                                    <a 
                                      href={`tel:${formatPhoneLink(b.providerPhone || b.providerId?.phone)}`}
                                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer no-underline text-center shadow-xs"
                                    >
                                      <PhoneCall size={14} /> Call Technician
                                    </a>
                                  )}
                                  <button 
                                    onClick={() => setChatBookingId(b._id)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-800 text-white hover:bg-slate-900 cursor-pointer border-none outline-none relative shadow-xs"
                                  >
                                    <MessageSquare size={14} /> Chat
                                    {b.unreadCount > 0 && (
                                      <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border border-white animate-pulse">{b.unreadCount}</span>
                                    )}
                                  </button>
                                </div>

                                {!['completed', 'cancelled', 'rejected'].includes(b.status) && (
                                  <button
                                    onClick={() => setCancelBookingId(b._id)}
                                    className="w-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                                  >
                                    Cancel Booking
                                  </button>
                                )}

                                {b.status === 'completed' && !['completed', 'cash_pending'].includes(b.paymentStatus) && (
                                  <button
                                    onClick={() => setPaymentBooking(b)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer border-none shadow-md shadow-blue-600/10"
                                  >
                                    Pay Now Online
                                  </button>
                                )}

                                {b.status === 'completed' && (
                                  <button
                                    onClick={() => setReviewBooking(b)}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md shadow-amber-500/10 flex justify-center items-center gap-1.5"
                                  >
                                    <Star size={14} className="fill-current" /> Rate & Review Technician
                                  </button>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => toggleExpand(b._id || b.id)}
                              className="w-full pt-1 text-[11px] font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-wider text-center cursor-pointer border-none bg-transparent outline-none"
                            >
                              {isExpanded ? 'Hide Details ▲' : 'View Full Details & Actions ▼'}
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
                <RewardsView />
              )}

              {/* REFERRAL TAB */}
              {activeSubTab === 'referral' && (
                <ReferralView userCode={profile?.referralCode || 'FIXVO100'} />
              )}

              {/* SUPPORT TAB */}
              {activeSubTab === 'support' && (
                <HelpSupportView />
              )}

              {/* MENU TAB (Clean Urban Company Style Account Menu without Chapter numbers) */}
              {activeSubTab === 'menu' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <Menu className="text-blue-600" /> Account Menu & Services
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">Access all service bookings, wallet, rewards, addresses, and account settings</p>
                    </div>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Settings size={14} /> Profile
                    </button>
                  </div>

                  {/* Menu List Cards */}
                  <div className="space-y-3">
                    {[
                      { id: 'bookings', title: 'My Service Bookings', desc: 'Track active repair orders, scheduled visits, completed history', icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                      { id: 'booking-form', title: 'Book a New Service', desc: 'Instant repair booking for home appliances, electrical, plumbing', icon: Wrench, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', isAction: true },
                      { id: 'wallet', title: 'Wallet & Fixvo Cash', desc: `Available Balance: ₹${(profile?.walletBalance || 0).toFixed(0)} • Cashback & transactions`, icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                      { id: 'rewards', title: 'Rewards & Promo Vouchers', desc: 'Active coupons, reward points, and special discounts', icon: Sparkles, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                      { id: 'addresses', title: 'Saved Addresses', desc: `${addresses.length} saved addresses (Home, Work, Service locations)`, icon: MapPin, color: 'text-rose-600 bg-rose-50 border-rose-200' },
                      { id: 'referral', title: 'Refer & Earn Rewards', desc: 'Invite friends and earn ₹100 Fixvo cash per referral', icon: User, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                      { id: 'support', title: 'Customer Help & Support', desc: '24/7 support hotline, FAQs, raise ticket', icon: HelpCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                      { id: 'settings', title: 'Account Settings & Profile', desc: 'Update name, phone, email, and personal preferences', icon: Settings, color: 'text-slate-700 bg-slate-100 border-slate-200', isModal: true }
                    ].map((ch) => {
                      const IconComp = ch.icon;
                      return (
                        <div
                          key={ch.id}
                          onClick={() => {
                            if (ch.isModal) {
                              setShowSettings(true);
                            } else if (ch.isAction) {
                              setShowForm(true);
                            } else {
                              setActiveSubTab(ch.id);
                            }
                          }}
                          className="bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl border ${ch.color} shrink-0 group-hover:scale-105 transition-transform`}>
                              <IconComp size={20} />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{ch.title}</h3>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{ch.desc}</p>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Urban Company Mobile Bottom App Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 flex justify-around items-center z-50 shadow-lg">
        {[
          { id: 'overview', label: 'Home', icon: Home },
          { id: 'bookings', label: 'Bookings', icon: Calendar },
          { id: 'book', label: 'Book', icon: Plus, isAction: true },
          { id: 'wallet', label: 'Wallet', icon: CreditCard },
          { id: 'menu', label: 'Menu', icon: Menu }
        ].map(nav => {
          const IconComp = nav.icon;
          const isActive = activeSubTab === nav.id;
          return (
            <button
              key={nav.id}
              onClick={() => {
                if (nav.isAction) {
                  setShowForm(true);
                } else {
                  setActiveSubTab(nav.id);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-all border-none outline-none cursor-pointer bg-transparent ${
                isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <IconComp size={20} className={isActive ? 'text-blue-600 stroke-[2.5]' : ''} />
              <span className="text-[10px] tracking-tight">{nav.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals & Overlays */}
      {chatBookingId && (
        <ChatModal 
          booking={bookings.find(b => b._id === chatBookingId)} 
          currentRole="user" 
          onClose={handleCloseChat} 
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

      {paymentBooking && (
        <PaymentModal 
          booking={paymentBooking}
          onClose={() => setPaymentBooking(null)}
          onSuccess={() => {
            const b = paymentBooking;
            setPaymentBooking(null);
            setReviewBooking(b);
            fetchData();
            showToast("Payment Complete 🎉", "Thank you for your payment!", "success");
          }}
        />
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            fetchData();
            showToast("Review Submitted ⭐", "Your rating has been saved and sent to technician.", "success");
          }}
        />
      )}

      {cancelBookingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={24} />
              <h3 className="font-extrabold text-base text-slate-900">Cancel Booking Request</h3>
            </div>
            <p className="text-xs text-slate-600 font-medium">Please let us know the reason for cancellation:</p>
            <textarea
              rows={3}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Reason for cancelling (e.g., changed mind, technician delayed...)"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelBookingId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={submittingCancellation}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer border-none"
              >
                {submittingCancellation ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Stack */}
      <div className="fixed bottom-16 sm:bottom-5 right-5 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 flex gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 relative overflow-hidden"
          >
            <div className="p-1.5 bg-slate-800 rounded-lg text-blue-400 self-start">
              <Sparkles size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-slate-100 leading-tight">{toast.title}</h4>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-200 self-start font-bold text-xs p-1 cursor-pointer border-none bg-transparent"
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
