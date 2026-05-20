import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; 
import { globalCategories, globalServices, getDbServices } from '../data/services';
import { Calendar, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, Plus, LayoutDashboard, Wrench, Settings, Star, User, ChevronRight, MessageSquare, Camera, UploadCloud, Loader2, Shield, ShieldCheck, HelpCircle, Truck, Home, Search } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import ReviewModal from '../components/ReviewModal';
import PaymentModal from '../components/PaymentModal';
import SettingsModal from '../components/SettingsModal';
import PremiumModal from '../components/PremiumModal';
import { CreditCard, Sparkles, PhoneCall } from 'lucide-react';
import { socket } from '../services/socket';
import LoadingSkeleton from '../components/LoadingSkeleton';


const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryParams = new URLSearchParams(document.location.search);
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
  const [reviewBooking, setReviewBooking] = useState(null);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [liveLocations, setLiveLocations] = useState({}); // { techId: [lat, lng] }
  const [profile, setProfile] = useState(null);

  const pendingStr = localStorage.getItem('pendingBooking');
  const pendingData = pendingStr ? JSON.parse(pendingStr) : null;
  
  const [formData, setFormData] = useState(pendingData || {
    serviceId: initialService || '', date: '', deviceType: '', problemDescription: '', location: '', detailedAddress: '', landmark: '', gpsLocation: null, imageUrl: '',
    serviceOption: 'direct',
    unknownProblem: false
  });

  useEffect(() => {
    getDbServices().then(setServices);
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 5000);

    // Subscribe to WebSocket location updates
    socket.on('location_update', (data) => {
       setLiveLocations(prev => ({ ...prev, [data.techId]: [data.lat, data.lng] }));
    });

    return () => {
      clearInterval(interval);
      socket.off('location_update');
    };
  }, []);

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
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' }
    };
    const { color, icon: Icon, label } = config[status] || config.pending;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${color}`}>
        <Icon size={14} />
        {label || status}
      </span>
    );
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
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
            <button
               onClick={() => setShowSettings(true)}
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base"
            >
              <Settings size={20} /> Settings
            </button>
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by ID, Status, or Service..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700"
              />
            </div>
            <button
              onClick={cancelRequest}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-md ${showForm ? 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/20 shadow-xl'}`}
            >
              {showForm ? <XCircle size={20} /> : <Plus size={20} />}
              {showForm ? 'Cancel Request' : 'Book a New Repair'}
            </button>
          </div>
        </div>

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Smartphone size={16} className="text-slate-400"/> Device Type</label>
                      <input type="text" placeholder="e.g. iPhone 13, HP Pavilion" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium" value={formData.deviceType} onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> Town / Area</label>
                      </div>
                      <select 
                        required 
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" 
                        value={formData.location} 
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      >
                        <option value="">Select your area</option>
                        <option value="Tirupati">Tirupati</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Chennai">Chennai</option>
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
                        <input type="checkbox" id="unknownProblem" checked={formData.unknownProblem} onChange={(e) => setFormData({...formData, unknownProblem: e.target.checked})} className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label htmlFor="unknownProblem" className="text-sm text-slate-700 font-medium cursor-pointer">I don't know the exact issue (Technician will diagnose)</label>
                      </div>
                      <textarea rows="3" placeholder={formData.unknownProblem ? "Tell us what happened (e.g., screen went black, strange noise)..." : "Describe the issue you're facing in detail..."} required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium resize-none" value={formData.problemDescription} onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}></textarea>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Wrench size={16} className="text-slate-400"/> Service Visit Type</label>
                      <div className="space-y-3">
                        <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.serviceOption === 'inspection' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                           <div className="flex items-center gap-3">
                             <input type="radio" name="serviceOption" checked={formData.serviceOption === 'inspection'} onChange={() => setFormData({...formData, serviceOption: 'inspection'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                             <div>
                               <span className="block font-bold text-slate-800">Inspection Visit</span>
                               <span className="block text-xs text-slate-500 mt-1">Final price will be provided after inspection and approval</span>
                             </div>
                           </div>
                        </label>
                        <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.serviceOption === 'direct' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                           <div className="flex items-center gap-3">
                             <input type="radio" name="serviceOption" checked={formData.serviceOption === 'direct'} onChange={() => setFormData({...formData, serviceOption: 'direct'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                             <div>
                               <span className="block font-bold text-slate-800">Direct Repair Visit</span>
                               <span className="block text-xs text-slate-500 mt-1">Tech comes fully prepared to fix standard issues immediately.</span>
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
            {filteredBookings.map((booking) => (
              <div key={booking._id} className={`group bg-white rounded-[2rem] p-6 sm:p-8 border ${expandedBookings[booking._id] ? 'border-indigo-300 shadow-md' : 'border-slate-100/80 shadow-sm'} hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden relative`}>
                <div className="relative z-10">
                  <div 
                    className="flex justify-between items-start mb-2 cursor-pointer"
                    onClick={() => toggleExpand(booking._id)}
                  >
                    <div className="space-y-2">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200/60 text-[10px] font-black rounded uppercase tracking-widest">
                        {booking.serviceId?.name || booking.serviceName || 'Device Repair'}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        ₹{booking.finalQuote ? booking.finalQuote : (booking.serviceId?.price || 0)}
                      </h3>
                      <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
                        <Calendar size={14} /> {booking.date ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pending'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                      <span className="text-indigo-500 text-xs font-bold bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                        {expandedBookings[booking._id] ? 'Less Details' : 'View Details'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedBookings[booking._id] && (
                    <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
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
                        <div className="mt-4 p-5 bg-[#0B0F19] rounded-xl border border-blue-500 shadow-xl shadow-blue-900/20 animate-in fade-in zoom-in">
                          <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-3">
                            <h4 className="text-white font-bold flex items-center gap-2"><CreditCard size={18} className="text-emerald-400"/> Approval Required</h4>
                            <span className="text-emerald-400 font-extrabold text-2xl">₹{booking.finalQuote || 120}</span>
                          </div>
                          <p className="text-slate-400 text-sm mb-4">Technician has diagnosed the issue and provided a final guaranteed quote to fix it. Review details and approve to start work immediately.</p>
                          
                          <div className="bg-white/5 p-3 rounded-lg mb-4 border border-white/10">
                            {booking.detectedIssues && (
                              <div className="mb-2">
                                <p className="text-amber-400 text-sm font-medium">Detected Issues:</p>
                                <p className="text-amber-100/70 text-sm italic mt-1">"{booking.detectedIssues}"</p>
                              </div>
                            )}
                            <p className="text-slate-300 text-sm font-medium mt-2">Technician Note:</p>
                            <p className="text-slate-400 text-sm italic mt-1">"{booking.quoteReason || 'Replaced parts and labor for fixing the root cause.'}"</p>
                            {booking.quotePhoto && (
                              <div className="mt-3">
                                <img src={booking.quotePhoto} className="w-full h-24 object-cover rounded shadow-sm border border-white/10" alt="Proof" />
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <button disabled={updatingJobs[booking._id]} onClick={() => handleQuoteApproval(booking._id, false)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2">
                              {updatingJobs[booking._id] ? <Loader2 size={16} className="animate-spin"/> : 'Reject Quote'}
                            </button>
                            <button disabled={updatingJobs[booking._id]} onClick={() => handleQuoteApproval(booking._id, true)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2">
                              {updatingJobs[booking._id] ? <Loader2 size={16} className="animate-spin"/> : 'Approve Work'}
                            </button>
                          </div>
                        </div>
                      )}
                      
                    </div>
                  )}
                </div>
                
                {expandedBookings[booking._id] && (
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-300">
                  {booking.providerId ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl text-indigo-700 text-sm font-bold shadow-sm border border-indigo-100">
                        <User size={16} className="text-indigo-500"/>
                        Technician Assigned
                      </div>

                      {['accepted', 'on_the_way', 'arrived'].includes(booking.status) && booking.providerId?.phone && (
                        <>
                          <a href={`tel:${booking.providerId.phone}`} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all shadow-emerald-200 transform hover:-translate-y-0.5">
                            <PhoneCall size={16} /> Call Technician
                          </a>
                          <a href={`https://wa.me/${booking.providerId.phone.replace(/\D/g, '')}?text=Hi, this is regarding my Fixvo booking. My exact location is: `} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all shadow-emerald-200 transform hover:-translate-y-0.5">
                            <MapPin size={16} /> Share Location
                          </a>
                        </>
                      )}

                      <button 
                         onClick={() => setChatBookingId(booking._id)}
                         className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all shadow-indigo-100 transform hover:-translate-y-0.5"
                      >
                         <MessageSquare size={16} /> Open Chat
                      </button>

                      {booking.status === 'completed' && (
                        <button 
                           onClick={() => !booking.isReviewed && setReviewBooking(booking)}
                           className={`flex items-center gap-2 px-4 py-2 ${booking.isReviewed ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-200 transition-all hover:-translate-y-0.5'} rounded-xl text-sm font-bold shadow-sm`}
                        >
                           <Star size={16} className={`fill-current ${booking.isReviewed ? 'text-slate-400' : 'text-amber-100'}`} /> {booking.isReviewed ? 'Reviewed' : 'Leave Review'}
                        </button>
                      )}

                      {booking.status === 'completed' && booking.paymentStatus !== 'completed' && (
                        <button 
                           onClick={() => setPaymentBooking(booking)}
                           className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all shadow-blue-500/30 transform hover:-translate-y-0.5"
                        >
                           <CreditCard size={16} /> Pay Now
                        </button>
                      )}

                      {booking.status === 'completed' && booking.paymentStatus === 'completed' && (
                         <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-emerald-700 text-sm font-bold shadow-sm">
                           <CheckCircle size={16} className="text-emerald-500" /> Payment & Service Completed
                         </div>
                      )}
                      
                      {booking.isReviewed && (
                         <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-emerald-700 text-sm font-bold shadow-sm">
                           <Star size={16} className="text-emerald-500 fill-emerald-500"/>
                           Reviewed
                         </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm font-medium italic">Unassigned...</span>
                  )}
                </div>
                )}


              </div>
            ))}
          </div>
        )}
      </div>
      
      {chatBookingId && (
        <ChatModal 
          bookingId={chatBookingId} 
          currentRole="user" 
          onClose={() => setChatBookingId(null)} 
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
    </div>
  );
};

export default UserDashboard;
