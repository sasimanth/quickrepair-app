import { useState, useEffect } from 'react';
import api from '../services/api';
import { Briefcase, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, User, Wrench, RefreshCw, MessageSquare, Camera, HelpCircle, Hammer, Truck, Settings, Navigation, Copy, Map, PhoneCall, Loader2 } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import SettingsModal from '../components/SettingsModal';
import VerificationModal from '../components/VerificationModal';
import KycModal from '../components/KycModal';
import { Star, ShieldAlert, ShieldCheck } from 'lucide-react';
import { socket } from '../services/socket';

const TechnicianDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [chatBookingId, setChatBookingId] = useState(null);
  const [quoteModalJob, setQuoteModalJob] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ serviceCharge: '', sparePartsCost: '', transportCharge: '50', quoteReason: '', quotePhoto: '', detectedIssues: '' });
  
  const handleOpenQuoteModal = (job) => {
    setQuoteModalJob(job);
    setQuoteForm({
      serviceCharge: '',
      sparePartsCost: '',
      transportCharge: String(job.transportCharge || 50),
      quoteReason: '',
      quotePhoto: '',
      detectedIssues: ''
    });
  };

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Calculate earnings with 10% commission
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const totalAmount = completedJobs.reduce((sum, j) => sum + (j.finalQuote || j.serviceId?.price || 0), 0);
  const commissionAmount = totalAmount * 0.10;
  const netEarnings = totalAmount - commissionAmount;

  useEffect(() => { fetchJobs(); }, []);

  // Live Location Broadcasting via WebSockets
  useEffect(() => {
    let watchId;
    if (profile?.isOnline && profile?.userId && navigator.geolocation) {
       socket.emit('register_tech', profile.userId);
       
       watchId = navigator.geolocation.watchPosition((position) => {
         socket.emit('update_location', {
           techId: profile.userId,
           lat: position.coords.latitude,
           lng: position.coords.longitude
         });
       }, () => {},
       { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [profile?.isOnline, profile?.userId]);

  // WebSocket Chat Event Handlers
  useEffect(() => {
    if (jobs.length > 0) {
      jobs.forEach(b => {
        socket.emit('join_chat', b._id);
      });
    }
  }, [jobs.length]);

  useEffect(() => {
    const handleReceiveMessage = (newMsg) => {
      setJobs(prev => prev.map(b => {
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

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/technicians/profile');
      setProfile(profileRes.data);

      if (profileRes.data.isProfileComplete) {
        const { data } = await api.get('/bookings');
        // Show NEW jobs at TOP
        const sortedJobs = data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setJobs(sortedJobs);
        const reviewsRes = await api.get(`/reviews/technician/${profileRes.data.userId}`);
        setReviews(reviewsRes.data);
      }
    } catch (error) { console.error('Error fetching dashboard data', error); }
    finally { setLoading(false); }
  };

  const [updatingJobs, setUpdatingJobs] = useState({});

  const updateJobStatus = async (id, status) => {
    // Optimistic update
    setJobs(prevJobs => prevJobs.map(job => job._id === id ? { ...job, status } : job));
    setUpdatingJobs(prev => ({ ...prev, [id]: true }));
    
    try {
      await api.put(`/bookings/${id}/status`, { status });
    } catch (error) { 
      // Revert on failure
      alert(`Failed to update status to ${status}`);
      fetchJobs(); 
    } finally {
      setUpdatingJobs(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    const jobId = quoteModalJob._id;
    const sCharge = Number(quoteForm.serviceCharge || 0);
    const pCost = Number(quoteForm.sparePartsCost || 0);
    const tCharge = Number(quoteForm.transportCharge || 50);
    const finalPrice = sCharge + pCost + tCharge;
    
    // Optimistic update
    setJobs(prevJobs => prevJobs.map(job => job._id === jobId ? { 
      ...job, 
      status: 'quote_pending', 
      serviceCharge: sCharge,
      sparePartsCost: pCost,
      transportCharge: tCharge,
      finalQuote: finalPrice, 
      quoteReason: quoteForm.quoteReason 
    } : job));
    
    setQuoteModalJob(null);
    setQuoteForm({ serviceCharge: '', sparePartsCost: '', transportCharge: '50', quoteReason: '', quotePhoto: '', detectedIssues: '' });
    setUpdatingJobs(prev => ({ ...prev, [jobId]: true }));
    
    try {
      await api.put(`/bookings/${jobId}/quote`, {
         serviceCharge: sCharge,
         sparePartsCost: pCost,
         transportCharge: tCharge,
         quoteReason: quoteForm.quoteReason,
         quotePhoto: quoteForm.quotePhoto,
         detectedIssues: quoteForm.detectedIssues
      });
    } catch (error) {
      alert("Failed to submit quote");
      fetchJobs();
    } finally {
      setUpdatingJobs(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleCloseChat = () => {
    setChatBookingId(null);
    setJobs(prev => prev.map(b => b._id === chatBookingId ? { ...b, unreadCount: 0 } : b));
  };

  const handleSetupProfile = async () => {
    setSetupLoading(true);

    const completeProfileWithLocation = async (lat, lng, addressString) => {
      try {
        await api.put('/technicians/profile', {
          lat,
          lng,
          address: addressString,
          skills: ['All Devices'], // basic default for demo
          experience: '5 Years'
        });
        fetchJobs();
      } catch (error) {
        alert('Failed to save profile');
      } finally {
        setSetupLoading(false);
      }
    };

    if (!navigator.geolocation) {
       return completeProfileWithLocation(30.2672, -97.7431, "Default Testing Location");
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        completeProfileWithLocation(position.coords.latitude, position.coords.longitude, 'Verified Geolocation');
      }, 
      () => {
      completeProfileWithLocation(30.2672, -97.7431, 'Default Testing Location');
    });
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !profile.isOnline;
      const res = await api.put('/technicians/profile', { isOnline: newStatus });
      setProfile(res.data);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleWithdrawal = async () => {
    if (!profile?.kycCompleted) {
       setShowKyc(true);
       return;
    }
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
       alert("Please enter a valid amount");
       return;
    }
    const maxAvailable = netEarnings - (profile?.withdrawnAmount || 0) - (profile?.pendingWithdrawal || 0);

    if (Number(withdrawAmount) > maxAvailable) {
       alert(`You can only withdraw up to $${maxAvailable}`);
       return;
    }

    try {
       setIsWithdrawing(true);
       await api.post('/technicians/withdraw', { amount: Number(withdrawAmount) });
       alert("Withdrawal requested successfully! Admin will approve it shortly.");
       setWithdrawAmount('');
       fetchJobs();
       // Note: In real app, `profile` needs to update immediately via response instead of just relying on fetchJobs() (since fetchJobs fetches profile too it'll update)
    } catch (error) {
       alert(error.response?.data?.message || "Failed to request withdrawal");
    } finally {
       setIsWithdrawing(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Unassigned' },
      assigned: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock, label: 'Assigned To You' },
      queued: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Queued' },
      accepted: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CheckCircle, label: 'Accepted by Tech' },
      quote_pending: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock, label: 'Quote Sent' },
      quote_approved: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CheckCircle, label: 'Quote Approved' },
      on_the_way: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Truck, label: 'On The Way' },
      arrived: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: MapPin, label: 'Arrived at Location' },
      in_progress: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Wrench, label: 'Work In Progress' },
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

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 mt-4 sm:mt-10">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100/80">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="p-3 sm:p-4 bg-slate-900 rounded-2xl sm:rounded-[1.25rem] shadow-xl shadow-slate-900/20 text-white">
              <Briefcase size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                 <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Tech Dashboard</h1>
                 {profile?.isVerified && (
                   <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tooltip" title="Identity Verified">
                     <ShieldCheck size={12} className="sm:w-3.5 sm:h-3.5" /> Verified
                   </div>
                 )}
              </div>
              <p className="text-xs sm:text-base text-slate-500 font-medium mt-0.5 sm:mt-1">Manage assigned jobs and discover new repairs</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
            {profile?.isProfileComplete && (
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm border-2 ${profile?.isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
              >
                <div className={`w-3 h-3 rounded-full ${profile?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {profile?.isOnline ? 'Online (Accepting Jobs)' : 'Offline (Hidden)'}
              </button>
            )}
            <button
               onClick={() => setShowSettings(true)}
               className="flex items-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-2xl transition-all shadow-sm"
            >
              <Settings size={20} /> Settings
            </button>
            <button
              onClick={fetchJobs}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-sm"
            >
              <RefreshCw size={18} /> Refresh Jobs
            </button>
          </div>
        </div>

        {/* Onboarding Section */}
        {!loading && profile && !profile.isProfileComplete && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-50">
               <MapPin className="text-indigo-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Activate Your Profile</h2>
            <p className="text-slate-600 max-w-md mx-auto">To start receiving repair requests from local customers, we need to verify your local service area using your device's location.</p>
            <button 
              onClick={handleSetupProfile}
              disabled={setupLoading}
              className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
            >
              {setupLoading ? <RefreshCw className="animate-spin" size={20}/> : <MapPin size={20}/>}
              {setupLoading ? 'Locating...' : 'Share Location & Go Active'}
            </button>
          </div>
        )}

        {/* Verification Banner */}
        {!loading && profile?.isProfileComplete && !profile?.isVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-amber-100">
               <ShieldAlert className="text-amber-500" size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold text-slate-800">Identity Not Verified</h2>
              <p className="text-slate-600 mt-1 max-w-2xl text-sm md:text-base">Verified technicians receive 300% more direct repair requests. Complete your background check securely to earn your verified badge and unlock premier jobs.</p>
            </div>
            <button 
              onClick={() => setShowVerification(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 w-full md:w-auto whitespace-nowrap"
            >
              Get Verified Now
            </button>
          </div>
        )}

        {/* Stats Section */}
        {!loading && profile?.isProfileComplete && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex items-center gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1">
              <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.25rem] group-hover:scale-110 transition-transform"><CheckCircle size={32} /></div>
              <div>
                <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Jobs Completed</p>
                <p className="text-4xl font-black text-slate-900 tracking-tight mt-1">
                  {jobs.filter(j => j.status === 'completed').length}
                </p>
              </div>
            </div>
            <div className="group bg-white p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex flex-col justify-center transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1">
              <div className="flex items-center gap-6">
                 <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[1.25rem] group-hover:scale-110 transition-transform"><Briefcase size={32} /></div>
                 <div>
                   <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Total Earned</p>
                   <p className="text-4xl font-black text-indigo-600 tracking-tight mt-1">
                     ₹{totalAmount.toFixed(0)}
                   </p>
                 </div>
              </div>
            </div>
            <div className="group bg-white p-6 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex flex-col transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1">
               <div className="flex justify-between items-start mb-2">
                 <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Available Balance <span className="text-[10px] lowercase text-slate-400 font-normal">(After 10% Commission)</span></p>
                 <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">Pending: ₹{profile?.pendingWithdrawal || 0}</span>
               </div>
               <p className="text-3xl font-black text-emerald-600 tracking-tight mb-4">
                 ₹{(netEarnings - (profile?.withdrawnAmount || 0) - (profile?.pendingWithdrawal || 0)).toFixed(0)}
               </p>
               <div className="flex gap-2">
                 <input 
                    type="number" 
                    placeholder="Amount" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                 />
                 <button 
                    onClick={handleWithdrawal}
                    disabled={isWithdrawing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center whitespace-nowrap disabled:bg-indigo-400"
                 >
                    {isWithdrawing ? 'Sending...' : 'Withdraw'}
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {!loading && profile?.isProfileComplete && (
          <>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                  <PackageSearch className="text-amber-500" size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No Jobs Available</h3>
                <p className="text-slate-500 max-w-sm text-center">There are no pending repair requests assigned to you currently. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {jobs.map((job) => (
                  <div key={job._id} className="relative bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 border border-slate-100/80 overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-2 h-full ${['pending','assigned','queued'].includes(job.status) ? 'bg-amber-400' : ['accepted', 'quote_approved'].includes(job.status) ? 'bg-indigo-500' : job.status === 'completed' ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
                    
                    <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 pl-10 md:pl-12">
                      <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
                            {job.serviceId?.name || 'Device Repair'}
                          </span>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm border ${job.serviceOption === 'inspection' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            {job.serviceOption === 'inspection' ? 'Inspection Visit' : 'Direct Repair'}
                          </span>
                          {getStatusBadge(job.status)}
                          <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium ml-auto md:ml-0">
                            <Clock size={16} />
                            {job.date ? new Date(job.date).toLocaleDateString() : 'TBD'}
                          </div>
                        </div>
                        
                        <h3 className="text-3xl font-extrabold text-slate-800 inline-flex items-center gap-2">
                          <span className="text-amber-500">₹</span>{job.finalQuote || job.serviceId?.price || 0} <span className="text-sm text-slate-400 font-bold ml-2">(+₹{job.transportCharge || 0} Transp.)</span>
                        </h3>

                        {job.deviceType && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-5">
                            <div className="space-y-4">
                              <div className="flex gap-3">
                                <Smartphone className="text-blue-500 mt-1 shrink-0" size={20} />
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Device</p>
                                  <p className="font-medium text-slate-800">{job.deviceType}</p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <MapPin className="text-emerald-500 mt-1 shrink-0" size={20} />
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</p>
                                  <p className="font-medium text-slate-800">{job.location}</p>
                                  {(job.serviceLocation && job.serviceLocation !== 'on-site') && (
                                     <span className="inline-block mt-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                                       {job.serviceLocation === 'gate' ? 'Gate Meetup' : 'Off-site Pickup Required'}
                                     </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <AlertCircle className="text-rose-500 mt-1 shrink-0" size={20} />
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue Description</p>
                                <p className="text-slate-700 italic">"{job.problemDescription}"</p>
                                {job.unknownProblem && (
                                   <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                                     <HelpCircle size={12}/> Unknown Issue - Requires Diagnosis
                                   </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        


                        {(job.imageUrl || job.mediaUrl) && (
                          <div className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden group/image">
                            <Camera className="text-indigo-500 mt-1 shrink-0 absolute top-5 left-5 opacity-40 group-hover/image:opacity-100 transition-opacity" size={24} />
                            <div className="w-full">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pl-8">Customer Media Proof</p>
                              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-sm ml-8">
                                {job.mediaType?.startsWith('video') ? (
                                  <video src={job.mediaUrl} controls className="w-full h-auto object-cover hover:scale-[1.03] transition-transform duration-500" />
                                ) : (
                                  <img src={job.mediaUrl || job.imageUrl} alt="Damage evidence" className="w-full h-auto object-cover hover:scale-[1.03] transition-transform duration-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {['accepted', 'quote_approved', 'on_the_way', 'in_progress'].includes(job.status) && (
                           <div className="pt-3 mt-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col gap-3">
                             <p className="font-bold text-sm text-indigo-900 flex items-center justify-between">
                               <span className="flex items-center gap-2"><Truck size={18} className="text-indigo-500"/> Navigation & Contact</span>
                             </p>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                               <a href={job.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-lg text-sm font-bold shadow-sm border border-indigo-100 transition-all flex items-center justify-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                 <Navigation size={16} className="shrink-0" /> <span className="truncate">Open Maps</span>
                               </a>
                               <a href={`tel:${job.phone}`} className="bg-white hover:bg-slate-50 text-indigo-700 px-3 py-2.5 rounded-lg text-sm font-bold shadow-sm border border-indigo-200 transition-all flex items-center justify-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                 <Smartphone size={16} className="shrink-0" /> <span className="truncate">Call Customer</span>
                               </a>
                               <button onClick={() => { navigator.clipboard.writeText(job.location); alert('Address copied to clipboard!'); }} className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-bold shadow-sm border border-slate-200 transition-all flex items-center justify-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                 <MapPin size={16} className="shrink-0" /> <span className="truncate">Copy Address</span>
                               </button>
                               <button onClick={() => { navigator.clipboard.writeText(job.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`); alert('Map link copied to clipboard!'); }} className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-bold shadow-sm border border-slate-200 transition-all flex items-center justify-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                 <Copy size={16} className="shrink-0" /> <span className="truncate">Copy Map Link</span>
                               </button>
                             </div>
                           </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-100 rounded-full px-4 py-2 w-max shadow-sm mt-4">
                          <User size={16} />
                          <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                            Customer: {job.userEmail ? job.userEmail.split('@')[0] : 'Guest User'}
                          </span>
                        </div>
                        {job.lastMessage && (
                          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 max-w-md">
                            <MessageSquare size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-slate-600 truncate">
                              <span className="font-bold">{job.lastMessage.senderId === profile?.userId ? 'You: ' : ''}</span>
                              {job.lastMessage.text}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-4 min-w-[200px] justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-8">
                        {['pending', 'assigned'].includes(job.status) && (
                          <>
                            <button
                              disabled={updatingJobs[job._id]}
                              onClick={() => updateJobStatus(job._id, 'accepted')}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-slate-900/20 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {updatingJobs[job._id] ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Accept Job</>}
                            </button>
                            <button
                              disabled={updatingJobs[job._id]}
                              onClick={() => updateJobStatus(job._id, 'rejected')}
                              className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-3 p-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {updatingJobs[job._id] ? <Loader2 size={18} className="animate-spin" /> : <><XCircle size={18} /> Decline</>}
                            </button>
                          </>
                        )}
                        {job.status === 'queued' && (
                           <div className="flex flex-col text-center items-center justify-center gap-2 p-4 rounded-xl font-bold border bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm">
                             <Clock size={18} /> 
                             <span>In Your Queue</span>
                             <span className="text-xs font-normal">Finish current job first</span>
                           </div>
                        )}
                        {job.status === 'accepted' && (
                            <button
                              disabled={updatingJobs[job._id]}
                              onClick={() => updateJobStatus(job._id, 'on_the_way')}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-4 rounded-2xl shadow-xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {updatingJobs[job._id] ? <Loader2 size={18} className="animate-spin" /> : <><Truck size={18} /> Start Route (On The Way)</>}
                            </button>
                        )}
                        {job.status === 'on_the_way' && (
                            <button
                              disabled={updatingJobs[job._id]}
                              onClick={() => updateJobStatus(job._id, 'arrived')}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-2xl shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {updatingJobs[job._id] ? <Loader2 size={18} className="animate-spin" /> : <><MapPin size={18} /> Technician Arrived</>}
                            </button>
                        )}
                        {job.status === 'arrived' && (
                            <button
                              onClick={() => handleOpenQuoteModal(job)}
                              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-4 rounded-2xl shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                              <Wrench size={18} /> Inspection Done - Send Quote
                            </button>
                        )}
                        {job.status === 'quote_approved' && (
                            <button
                              disabled={updatingJobs[job._id]}
                              onClick={() => updateJobStatus(job._id, 'in_progress')}
                              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-4 rounded-2xl shadow-xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {updatingJobs[job._id] ? <Loader2 size={18} className="animate-spin" /> : <><Wrench size={18} /> Work In Progress</>}
                            </button>
                        )}
                        {job.status === 'in_progress' && (
                            <button
                              disabled={updatingJobs[job._id]}
                              onClick={() => updateJobStatus(job._id, 'completed')}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {updatingJobs[job._id] ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Mark Completed</>}
                            </button>
                        )}
                        {['accepted', 'quote_approved', 'on_the_way', 'arrived', 'in_progress'].includes(job.status) && (
                            <div className="flex gap-2">
                              {job.phone && (
                                <a 
                                  href={`tel:${job.phone}`} 
                                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 p-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                                >
                                  <PhoneCall size={18} /> Call
                                </a>
                              )}
                              <button
                                onClick={() => setChatBookingId(job._id)}
                                className="relative flex-1 bg-white hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-200 text-indigo-600 font-bold py-3 p-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                              >
                                <MessageSquare size={18} /> Chat
                                {job.unreadCount > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full text-xs font-black w-6 h-6 flex items-center justify-center border-2 border-white animate-pulse shadow-md">
                                    {job.unreadCount}
                                  </span>
                                )}
                              </button>
                            </div>
                        )}
                        {job.status === 'quote_pending' && (
                           <div className="flex items-center justify-center gap-2 p-4 rounded-xl font-bold border bg-blue-50 text-blue-600 border-blue-200 shadow-sm">
                             <Clock size={18} /> Awaiting Approval
                           </div>
                        )}
                        {job.status === 'completed' && (
                          <div className={`flex items-center justify-center gap-2 p-4 rounded-xl font-bold border ${job.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm'}`}>
                            {job.paymentStatus === 'completed' ? <><CheckCircle size={18} /> Paid In Full</> : <><Clock size={18} /> Awaiting Payment</>}
                          </div>
                        )}
                        {job.status === 'completed' && reviews.some(r => r.bookingId === job._id) && (
                          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star} 
                                  size={14} 
                                  className={star <= reviews.find(r => r.bookingId === job._id).rating ? 'text-amber-500 fill-amber-500' : 'text-amber-200 fill-amber-200'} 
                                />
                              ))}
                            </div>
                            <p className="text-sm text-slate-700 italic">"{reviews.find(r => r.bookingId === job._id).comment || 'No comment provided.'}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {chatBookingId && (
        <ChatModal 
          bookingId={chatBookingId} 
          currentRole="technician" 
          onClose={handleCloseChat} 
        />
      )}

      {showSettings && (
        <SettingsModal 
          role="technician"
          currentProfile={profile}
          onClose={() => setShowSettings(false)}
          onSuccess={() => {
            setShowSettings(false);
            fetchJobs();
          }}
        />
      )}

      {showVerification && (
        <VerificationModal 
          currentStatus={profile?.backgroundCheckStatus}
          onClose={() => setShowVerification(false)}
          onSuccess={() => {
            setShowVerification(false);
            fetchJobs();
          }}
        />
      )}

      {showKyc && (
        <KycModal 
          onClose={() => setShowKyc(false)}
          onSuccess={() => {
            setShowKyc(false);
            fetchJobs();
          }}
        />
      )}

      {quoteModalJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Submit Final Quote</h3>
              <button onClick={() => setQuoteModalJob(null)} className="text-slate-400 hover:text-slate-600"><XCircle /></button>
            </div>
            <form onSubmit={handleSubmitQuote} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Service Charge (₹)</label>
                  <input required type="number" value={quoteForm.serviceCharge} onChange={(e) => setQuoteForm({...quoteForm, serviceCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800" placeholder="e.g. 150" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Spare Parts (₹)</label>
                  <input required type="number" value={quoteForm.sparePartsCost} onChange={(e) => setQuoteForm({...quoteForm, sparePartsCost: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800" placeholder="e.g. 0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transport Charge (₹)</label>
                <input required type="number" value={quoteForm.transportCharge} onChange={(e) => setQuoteForm({...quoteForm, transportCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800" placeholder="e.g. 50" />
              </div>
              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                 <span className="text-sm font-bold text-indigo-700">Total Customer Price:</span>
                 <span className="text-xl font-black text-indigo-800">
                   ₹{Number(quoteForm.serviceCharge || 0) + Number(quoteForm.sparePartsCost || 0) + Number(quoteForm.transportCharge || 0)}
                 </span>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Detected Issues (From Inspection)</label>
                <textarea required value={quoteForm.detectedIssues} onChange={(e) => setQuoteForm({...quoteForm, detectedIssues: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows="2" placeholder="List all detected problems physically observed..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Diagnosis / Reason</label>
                <textarea required value={quoteForm.quoteReason} onChange={(e) => setQuoteForm({...quoteForm, quoteReason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows="2" placeholder="Explain the required work..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Proof Image URL (Optional)</label>
                <input type="url" value={quoteForm.quotePhoto} onChange={(e) => setQuoteForm({...quoteForm, quotePhoto: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4">Send Quote for Approval</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
