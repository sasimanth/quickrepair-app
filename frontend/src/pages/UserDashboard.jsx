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
  const [isPlusDismissed, setIsPlusDismissed] = useState(localStorage.getItem('fixvo_plus_dismissed') === 'true');

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
      showToast('Booking Cancelled ❌', 'Your booking was cancelled.', 'info');
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setSubmittingCancellation(false);
    }
  };

  const [formData, setFormData] = useState({
    serviceId: initialService || '', date: '', deviceType: '', problemDescription: '', location: '', detailedAddress: '', landmark: '', gpsLocation: null, imageUrl: '',
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

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setStep(2);
    setFetchingTechs(true);
    
    try {
      const queryParams = new URLSearchParams();
      if (formData.location) queryParams.append('area', formData.location);
      if (formData.serviceId) queryParams.append('serviceId', formData.serviceId);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await api.get(`/technicians/nearby${queryString}`);
      setTechnicians(res.data || []);
    } catch (err) {
      console.error('Failed to fetch nearby technicians', err);
    } finally {
      setFetchingTechs(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTech) return;
    
    try {
      const selectedServiceName = globalServices.find(s => s.id === formData.serviceId)?.name || 'Unknown Service';
      const payload = {
        ...formData,
        service: selectedServiceName,
        providerId: selectedTech.id
      };
      await api.post('/bookings', payload);
      
      showToast('Booking Created! 🚀', 'Your booking request has been sent to technician.', 'success');
      setShowForm(false);
      setStep(1);
      setSelectedTech(null);
      fetchData(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create booking.');
    }
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
      quote_pending: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: CreditCard, label: 'Quote Pending' },
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
  const activeBooking = safeBookingsList.find(b => b && ['requested', 'accepted', 'assigned', 'on_the_way', 'in_progress', 'inspection_started', 'quote_pending'].includes(b.status));

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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                  <Wrench size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">Book Repair Service</h2>
                  <p className="text-xs text-slate-500">Select service, schedule time, and confirm booking</p>
                </div>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full border border-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInitialSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Service</label>
                  <SearchableServiceSelector
                    value={formData.serviceId}
                    onChange={(serviceId) => setFormData({ ...formData, serviceId })}
                    theme="light"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select City / Area</label>
                  <SearchableAreaSelector
                    value={formData.location}
                    onChange={(location) => setFormData({ ...formData, location })}
                    theme="light"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Problem Description</label>
                <textarea
                  rows="3"
                  value={formData.problemDescription}
                  onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                  placeholder="Describe what needs repair..."
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 font-semibold text-slate-900 outline-none text-sm focus:border-blue-600 transition-all resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fetchingTechs || !formData.serviceId}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                >
                  {fetchingTechs ? 'Searching Technicians...' : 'Find Technicians Nearby'}
                </button>
              </div>
            </form>
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
                      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
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

                        <div className="flex items-center justify-between pt-4">
                          <p className="text-xs font-semibold text-slate-600">Assigned Tech: <strong className="text-slate-900">{activeBooking.technicianName || 'Expert Pro'}</strong></p>
                          <button
                            onClick={() => setActiveSubTab('bookings')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold border-none cursor-pointer"
                          >
                            View Order Details
                          </button>
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
                  <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <Calendar className="text-blue-600" /> My Service Bookings
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">Track active repair orders, scheduled visits, and completed history</p>
                    </div>
                  </div>

                  {safeBookingsList.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 font-semibold text-sm bg-slate-50/50 border border-slate-100 rounded-2xl">
                      No repair bookings found in your account.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {safeBookingsList.map(b => (
                        <div key={b._id || b.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <span className="font-black text-slate-900 text-sm">{b.serviceName || 'Home Repair'}</span>
                            {getStatusBadge(b.status)}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Quoted Price: <strong className="text-slate-900">₹{b.finalQuote || b.amount || 0}</strong></span>
                            <span className="text-slate-500 font-medium">Date: {b.date ? new Date(b.date).toLocaleDateString() : 'Today'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SAVED ADDRESSES TAB */}
              {activeSubTab === 'addresses' && (
                <SavedAddresses 
                  addresses={addresses} 
                  onAddAddress={handleAddAddress}
                  onDeleteAddress={handleDeleteAddress}
                  onMakeDefault={handleMarkAddressDefault}
                />
              )}

              {/* WALLET TAB */}
              {activeSubTab === 'wallet' && (
                <WalletView 
                  balance={profile?.walletBalance || 0}
                  transactions={transactions}
                  onAddMoney={handleAddWalletMoney}
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
