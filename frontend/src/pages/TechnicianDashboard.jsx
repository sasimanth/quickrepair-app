import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Briefcase, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, User, Wrench, RefreshCw, MessageSquare, Camera, HelpCircle, Hammer, Truck, Settings, Navigation, Copy, Map, PhoneCall, Loader2 } from 'lucide-react';
import { globalServices } from '../data/services';
import ChatModal from '../components/ChatModal';
import SettingsModal from '../components/SettingsModal';
import VerificationModal from '../components/VerificationModal';
import KycModal from '../components/KycModal';
import { Star, ShieldAlert, ShieldCheck, Sparkles, IndianRupee, Wallet, Coins, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import { socket } from '../services/socket';

const formatPhoneLink = (phone) => {
  if (!phone) return '';
  // Strip spaces, brackets, hyphens but preserve digits and plus sign exactly
  return phone.toString().replace(/[^\d+]/g, '');
};

const TechnicianDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

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
  const [setupLoading, setSetupLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [chatBookingId, setChatBookingId] = useState(null);
  const [quoteModalJob, setQuoteModalJob] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ serviceCharge: '', sparePartsCost: '', transportCharge: '50', quoteReason: '', quotePhoto: '', detectedIssues: '' });
  const [updatingJobs, setUpdatingJobs] = useState({});
  const [cancelJobId, setCancelJobId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [submittingCancellation, setSubmittingCancellation] = useState(false);
  const [jobTab, setJobTab] = useState('new');
  const [viewReasonJob, setViewReasonJob] = useState(null);

  const handleCancelJob = async () => {
    if (!cancellationReason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    setSubmittingCancellation(true);
    try {
      await api.put(`/bookings/${cancelJobId}/cancel`, { reason: cancellationReason });
      showToast('Job Cancelled ❌', 'You have successfully cancelled this job.', 'success');
      setCancelJobId(null);
      setCancellationReason('');
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel job.");
    } finally {
      setSubmittingCancellation(false);
    }
  };

  const [expandedCompletedJobs, setExpandedCompletedJobs] = useState({});
  const toggleCompletedExpand = (id) => {
    setExpandedCompletedJobs(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
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

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const handleOpenWithdrawModal = () => {
    setWithdrawForm({
      amount: '',
      accountName: profile?.bankDetails?.accountName || profile?.name || '',
      accountNumber: profile?.bankDetails?.accountNumber || '',
      ifscCode: profile?.bankDetails?.ifscCode || '',
      upiId: profile?.bankDetails?.upiId || ''
    });
    setShowWithdrawModal(true);
  };
  
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (jobTab === 'new') {
        return ['pending', 'assigned', 'queued'].includes(job.status);
      } else if (jobTab === 'active') {
        return ['accepted', 'on_the_way', 'arrived', 'quote_approved', 'in_progress'].includes(job.status);
      } else if (jobTab === 'quote_pending') {
        return job.status === 'quote_pending';
      } else if (jobTab === 'completed') {
        return job.status === 'completed';
      } else if (jobTab === 'cancelled') {
        return ['cancelled', 'rejected'].includes(job.status);
      }
      return true;
    });
  }, [jobs, jobTab]);

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

  // Register private user room for job alerts and status updates
  useEffect(() => {
    if (profile?.userId) {
      socket.emit('register_user', profile.userId);
    }
  }, [profile?.userId]);

  useEffect(() => {
    if (!profile?.userId) return;

    const handleNewJob = (newJob) => {
      showToast(
        '💼 New Job Assigned!', 
        `New repair request for ${newJob.serviceName} has been assigned to you.`, 
        'info'
      );
      setJobs(prev => {
        if (prev.some(j => j._id === newJob._id)) return prev;
        return [newJob, ...prev];
      });
    };

    const handleJobUpdate = (updatedJob) => {
      showToast(
        '🔄 Job Update', 
        `Job #${updatedJob._id.slice(-6)} is now: ${updatedJob.status.replace(/_/g, ' ').toUpperCase()}`, 
        'info'
      );
      setJobs(prev => prev.map(j => j._id === updatedJob._id ? updatedJob : j));
    };

    const handleNewNotification = (notif) => {
      showToast(
        notif.title || '🔔 Notification', 
        notif.message || '', 
        'info'
      );
      fetchJobs();
    };

    socket.on('new_job', handleNewJob);
    socket.on('job_update', handleJobUpdate);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_job', handleNewJob);
      socket.off('job_update', handleJobUpdate);
      socket.off('new_notification', handleNewNotification);
    };
  }, [profile?.userId]);

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

  const updateJobStatus = async (id, status) => {
    if (updatingJobs[id]) return;
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
    if (updatingJobs[jobId]) return;
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

  const handleWithdrawal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const numAmount = Number(withdrawForm.amount);
    if (!numAmount || numAmount < 500) {
      alert("Minimum withdrawal amount is ₹500.");
      return;
    }
    if (numAmount > (profile?.walletBalance || 0)) {
      alert("Cannot withdraw more than available wallet balance.");
      return;
    }
    if (!withdrawForm.accountName || !withdrawForm.accountNumber || !withdrawForm.ifscCode) {
      alert("Please fill all required bank account details.");
      return;
    }

    setSubmittingWithdraw(true);
    try {
      await api.post('/technicians/withdraw', {
        amount: numAmount,
        accountName: withdrawForm.accountName,
        accountNumber: withdrawForm.accountNumber,
        ifscCode: withdrawForm.ifscCode,
        upiId: withdrawForm.upiId
      });
      showToast('Withdrawal Requested 💰', `Your payout request for ₹${numAmount} was submitted successfully!`, 'success');
      setShowWithdrawModal(false);
      fetchJobs();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit withdrawal request.");
    } finally {
      setSubmittingWithdraw(false);
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
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
      cancelled: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle, label: 'Cancelled' }
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
          <div className="grid grid-cols-2 md:flex md:items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            {profile?.isProfileComplete && (
              <button
                onClick={toggleOnlineStatus}
                className={`col-span-2 md:col-span-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm border-2 ${profile?.isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
              >
                <div className={`w-3 h-3 rounded-full ${profile?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {profile?.isOnline ? 'Online (Accepting Jobs)' : 'Offline (Hidden)'}
              </button>
            )}
            <button
               onClick={() => setShowSettings(true)}
               className="col-span-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-2xl transition-all shadow-sm text-sm"
            >
              <Settings size={18} /> Settings
            </button>
            <button
              onClick={fetchJobs}
              className="col-span-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-sm text-sm"
            >
              <RefreshCw size={18} /> Refresh
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Available Balance */}
            <div className="col-span-2 sm:col-span-1 md:col-span-1 xl:col-span-1 group bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-[2rem] shadow-lg shadow-emerald-600/10 text-white flex flex-col justify-between relative overflow-hidden transition-all hover:scale-[1.01] hover:shadow-xl">
              <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-[40px]"></div>
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/10 rounded-xl"><Wallet size={20} /></div>
                {profile?.pendingWithdrawal > 0 && (
                  <span className="text-[8px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Pending: ₹{profile.pendingWithdrawal}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-100 opacity-90">Available Balance</p>
                <p className="text-2xl font-black mt-0.5">₹{(profile?.walletBalance || 0).toFixed(2)}</p>
              </div>
              <button 
                onClick={handleOpenWithdrawModal}
                className="mt-3 w-full bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold py-2 px-3 rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5 outline-none cursor-pointer border-none shadow-sm"
              >
                Withdraw <ArrowUpRight size={12} />
              </button>
            </div>

            {/* Gross Earned */}
            <div className="group bg-white p-5 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Coins size={20} /></div>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Gross Earned</p>
                <p className="text-2xl font-black text-indigo-600 mt-0.5">₹{(profile?.totalEarned || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Platform Commission */}
            <div className="group bg-white p-5 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><ArrowDownLeft size={20} /></div>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Commission (20%)</p>
                <p className="text-2xl font-black text-rose-600 mt-0.5">₹{(profile?.platformCommission || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Net Earnings */}
            <div className="group bg-white p-5 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><CheckCircle size={20} /></div>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Net Earnings</p>
                <p className="text-2xl font-black text-teal-600 mt-0.5">₹{(profile?.netEarnings || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Pending Payouts / Pending Earnings */}
            <div className="group bg-white p-5 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pending Earnings</p>
                <p className="text-2xl font-black text-amber-500 mt-0.5">₹{(profile?.pendingEarnings || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Withdrawn Amount */}
            <div className="group bg-white p-5 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl"><FileText size={20} /></div>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Withdrawn Amount</p>
                <p className="text-2xl font-black text-slate-700 mt-0.5">₹{(profile?.withdrawnAmount || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {!loading && profile?.isProfileComplete && (
          <>
            {/* Quick Filters */}
            <div className="flex overflow-x-auto gap-2 pb-5 scrollbar-none snap-x snap-mandatory mb-2">
              {[
                { id: 'new', label: 'New Jobs', count: jobs.filter(j => ['pending', 'assigned', 'queued'].includes(j.status)).length },
                { id: 'active', label: 'In Progress', count: jobs.filter(j => ['accepted', 'on_the_way', 'arrived', 'quote_approved', 'in_progress'].includes(j.status)).length },
                { id: 'quote_pending', label: 'Pending Quote', count: jobs.filter(j => j.status === 'quote_pending').length },
                { id: 'completed', label: 'Completed', count: jobs.filter(j => j.status === 'completed').length },
                { id: 'cancelled', label: 'Cancelled / Rejected', count: jobs.filter(j => ['cancelled', 'rejected'].includes(j.status)).length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setJobTab(tab.id)}
                  className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 snap-center outline-none border cursor-pointer flex items-center gap-1.5 ${
                    jobTab === tab.id 
                      ? 'bg-slate-900 text-white border-slate-800 shadow-md shadow-slate-900/10' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    jobTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>

            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-5">
                  <PackageSearch className="text-amber-500" size={38} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">No Jobs Found</h3>
                <p className="text-slate-500 max-w-xs text-center text-xs font-medium">There are no jobs matching this category currently.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredJobs.map((job) => {
                  const isCompleted = job.status === 'completed';
                  const isExpanded = expandedCompletedJobs[job._id];
                  
                  if (isCompleted && !isExpanded) {
                    return (
                      <div key={job._id} className="relative bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all duration-300 border border-slate-100/80 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-hidden pl-8">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200 uppercase tracking-wide">
                              {job.serviceName || 'Device Repair'}
                            </span>
                            {getStatusBadge(job.status)}
                          </div>
                          <h4 className="text-xl font-black text-slate-900 tracking-tight">
                            Earned: ₹{job.finalTechnicianEarning ? job.finalTechnicianEarning.toFixed(2) : (((job.finalQuote || job.amount || job.serviceId?.price || 0) - (job.membershipDiscount || 0)) * 0.8).toFixed(2)} 
                            <span className="text-xs font-semibold text-slate-400 ml-1.5 border-l border-slate-200 pl-1.5">Gross Invoice: ₹{job.finalQuote || job.serviceId?.price || 0}</span>
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Completed: {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Date Pending'} • Customer: {job.name || 'Guest User'}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCompletedExpand(job._id)}
                          className="shrink-0 text-xs text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/80 px-4 py-2 rounded-xl transition-all shadow-sm"
                        >
                          View Details
                        </button>
                      </div>
                    );
                  }

                  return (
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
                        {job.status === 'completed' && (
                          <div className="space-y-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-5 mt-4 max-w-xl">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                              <FileText size={16} className="text-indigo-600" /> Billing & Earning Breakdown
                            </h4>
                            <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/60">
                                    <th className="px-4 py-2.5">Billing Item</th>
                                    <th className="px-4 py-2.5 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  <tr>
                                    <td className="px-4 py-2 text-slate-500">Gross Invoice (Billed to Customer)</td>
                                    <td className="px-4 py-2 text-right font-semibold">₹{job.finalQuote || job.amount || 0}</td>
                                  </tr>
                                  {job.membershipDiscount > 0 && (
                                    <tr className="text-amber-600 bg-amber-50/20">
                                      <td className="px-4 py-2 flex items-center gap-1">
                                        <Sparkles size={12} className="text-amber-500" /> 
                                        Plus Member Discount (15%)
                                      </td>
                                      <td className="px-4 py-2 text-right font-semibold">-₹{job.membershipDiscount}</td>
                                    </tr>
                                  )}
                                  <tr className="text-rose-600 bg-rose-50/10">
                                    <td className="px-4 py-2">Platform Commission Deducted (20%)</td>
                                    <td className="px-4 py-2 text-right font-semibold">-₹{(job.platformCommission || (((job.finalQuote || job.amount || 0) - (job.membershipDiscount || 0)) * 0.2)).toFixed(2)}</td>
                                  </tr>
                                  <tr className="bg-emerald-50 text-emerald-800 font-bold border-t border-slate-200">
                                    <td className="px-4 py-2.5">Your Net Earnings (80%)</td>
                                    <td className="px-4 py-2.5 text-right text-sm">₹{(job.finalTechnicianEarning || (((job.finalQuote || job.amount || 0) - (job.membershipDiscount || 0)) * 0.8)).toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold px-1 uppercase tracking-wider">
                              <span>Payment Mode: <strong className="text-slate-700">{job.paymentMethod || 'Cash'}</strong></span>
                              <span>Status: <strong className={job.paymentStatus === 'completed' ? 'text-emerald-600' : 'text-amber-600'}>{job.paymentStatus === 'completed' ? 'Paid' : 'Awaiting Payment'}</strong></span>
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
                            <div className="space-y-2 w-full">
                              <div className="flex gap-2">
                                {(job.customerPhone || job.phone) && (
                                  <a 
                                    href={`tel:${formatPhoneLink(job.customerPhone || job.phone)}`} 
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 p-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5 text-center"
                                  >
                                    <PhoneCall size={18} /> Call
                                  </a>
                                )}
                                <button
                                  onClick={() => setChatBookingId(job._id)}
                                  className="relative flex-1 bg-white hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-200 text-indigo-600 font-bold py-3 p-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                                  type="button"
                                >
                                  <MessageSquare size={18} /> Chat
                                  {job.unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full text-xs font-black w-6 h-6 flex items-center justify-center border-2 border-white animate-pulse shadow-md">
                                      {job.unreadCount}
                                    </span>
                                  )}
                                </button>
                              </div>
                              <button
                                onClick={() => setCancelJobId(job._id)}
                                className="w-full bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer outline-none"
                                type="button"
                              >
                                <XCircle size={14} /> Cancel Job
                              </button>
                            </div>
                        )}
                        {job.status === 'quote_pending' && (
                           <div className="flex items-center justify-center gap-2 p-4 rounded-xl font-bold border bg-blue-50 text-blue-600 border-blue-200 shadow-sm">
                             <Clock size={18} /> Awaiting Approval
                           </div>
                        )}
                        {job.status === 'completed' && (
                           <div className="space-y-3">
                             <div className={`flex items-center justify-center gap-2 p-4 rounded-xl font-bold border ${job.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm'}`}>
                               {job.paymentStatus === 'completed' ? <><CheckCircle size={18} /> Paid In Full</> : <><Clock size={18} /> Awaiting Payment</>}
                             </div>
                             <button
                               onClick={() => setChatBookingId(job._id)}
                               className="w-full bg-white hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-200 text-indigo-600 font-bold py-3 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
                             >
                               <MessageSquare size={18} /> View Chat History
                             </button>
                           </div>
                        )}
                        {['cancelled', 'rejected'].includes(job.status) && (
                           <div className="space-y-3">
                             <div className="flex items-center justify-center gap-2 p-4 rounded-xl font-bold border bg-rose-50 text-rose-700 border-rose-200 shadow-sm">
                               <XCircle size={18} /> {job.status === 'cancelled' ? 'Cancelled' : 'Rejected'}
                             </div>
                             <button
                               onClick={() => setViewReasonJob(job)}
                               className="w-full bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold py-3 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs"
                             >
                               <FileText size={18} /> View Reason
                             </button>
                           </div>
                        )}
                        {isCompleted && (
                          <button
                            onClick={() => toggleCompletedExpand(job._id)}
                            className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
                          >
                            Hide Details
                          </button>
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
                  );
                })}
              </div>
            )}
          </>
        )}
        {/* Payout & Withdrawal History Section */}
        {!loading && profile?.isProfileComplete && (
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 mt-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={20} /></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Payout & Withdrawal History</h3>
                  <p className="text-xs text-slate-500 font-medium">Track your bank transfers and payout request status</p>
                </div>
              </div>
            </div>

            {!profile.withdrawals || profile.withdrawals.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Coins size={36} className="text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-bold text-slate-500">No withdrawal requests found.</p>
                <p className="text-xs text-slate-400 mt-1">Submit your first request once you have at least ₹500 in earnings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Request Date</th>
                      <th className="px-6 py-4">Bank Details</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Transaction ID / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs sm:text-sm font-semibold text-slate-700">
                    {profile.withdrawals.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{req.bankDetails?.accountName}</p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {req.bankDetails?.accountNumber.slice(0, 4)}...{req.bankDetails?.accountNumber.slice(-4)} ({req.bankDetails?.ifscCode})
                          </p>
                          {req.bankDetails?.upiId && (
                            <p className="text-[11px] text-indigo-500 font-bold">UPI: {req.bankDetails?.upiId}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-extrabold text-base">
                          ₹{req.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            req.status === 'paid' 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                              : req.status === 'approved'
                              ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              req.status === 'paid' ? 'bg-emerald-500' : req.status === 'approved' ? 'bg-blue-500' : req.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {req.status === 'paid' ? (
                            <div>
                              <p className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-max">{req.transactionId || 'TXN_N/A'}</p>
                              {req.adminNotes && <p className="text-[10px] text-slate-400 font-medium mt-1">{req.adminNotes}</p>}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 font-medium italic">{req.adminNotes || 'Awaiting admin processing...'}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {chatBookingId && (
        <ChatModal 
          booking={jobs.find(b => b._id === chatBookingId)} 
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

      {viewReasonJob && (
        <div className="fixed inset-0 z-[999] bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-white">
            <h3 className="text-xl font-black text-white mb-2">Cancellation Details</h3>
            <div className="space-y-4 my-6">
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs sm:text-sm font-semibold">
                <span className="font-extrabold text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded uppercase tracking-wider block mb-2 w-max border border-rose-500/30">Reason Given</span>
                "{viewReasonJob.cancellationReason || 'No reason provided.'}"
              </div>
              <div className="text-xs text-slate-400 font-semibold space-y-2 pl-1">
                <p>Cancelled By: <strong className="text-slate-200 capitalize">{viewReasonJob.cancelledBy || 'system'}</strong></p>
                {viewReasonJob.cancelledAt && (
                  <p>Cancelled On: <strong className="text-slate-200">{new Date(viewReasonJob.cancelledAt).toLocaleString()}</strong></p>
                )}
              </div>
            </div>
            <button
              onClick={() => setViewReasonJob(null)}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3.5 rounded-xl transition-all shadow-md cursor-pointer border-none outline-none"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {cancelJobId && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
          <div className="bg-[#111827] border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] relative animate-in fade-in zoom-in duration-300 text-white p-6 sm:p-8 space-y-6">
            <button 
              onClick={() => setCancelJobId(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all cursor-pointer"
            >
              <XCircle size={16} />
            </button>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-md">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">Cancel Job Assignment</h3>
              <p className="text-slate-400 text-xs font-medium">Please let us know the reason for cancelling this job.</p>
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
                onClick={() => setCancelJobId(null)} 
                disabled={submittingCancellation}
                className="flex-1 border border-white/10 hover:bg-white/5 text-slate-300 font-bold py-3 rounded-xl transition-all text-xs sm:text-sm uppercase tracking-wider outline-none disabled:opacity-50 cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={handleCancelJob} 
                disabled={submittingCancellation}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all flex justify-center items-center gap-2 text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-[0.98] outline-none cursor-pointer"
              >
                {submittingCancellation ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Cancel Job</span>
                )}
              </button>
            </div>
          </div>
        </div>
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

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-[#0B0F19]/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#111827] border border-indigo-500/20 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-white p-6 sm:p-8 space-y-6">
            <button 
              onClick={() => setShowWithdrawModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all cursor-pointer border-none outline-none"
            >
              <XCircle size={18} />
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
                <Wallet size={24} />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Withdraw Earnings</h3>
              <p className="text-slate-400 text-xs font-medium">Funds will be transferred directly to your bank account or UPI.</p>
            </div>

            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Withdrawal Amount (₹)</label>
                <input 
                  required 
                  type="number" 
                  min="500" 
                  max={profile?.walletBalance || 0}
                  value={withdrawForm.amount} 
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" 
                  placeholder="Minimum ₹500" 
                />
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">Available for withdrawal: ₹{(profile?.walletBalance || 0).toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Holder Name</label>
                <input 
                  required 
                  type="text" 
                  value={withdrawForm.accountName} 
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-semibold text-white text-sm transition-all" 
                  placeholder="Name as in bank account" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Number</label>
                  <input 
                    required 
                    type="text" 
                    value={withdrawForm.accountNumber} 
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-semibold text-white text-sm transition-all" 
                    placeholder="Bank Account Number" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IFSC Code</label>
                  <input 
                    required 
                    type="text" 
                    value={withdrawForm.ifscCode} 
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, ifscCode: e.target.value.toUpperCase() })} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-semibold text-white text-sm transition-all" 
                    placeholder="SBIN0012345" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">UPI ID (Optional)</label>
                <input 
                  type="text" 
                  value={withdrawForm.upiId} 
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-semibold text-white text-sm transition-all" 
                  placeholder="username@okaxis" 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowWithdrawModal(false)} 
                  disabled={submittingWithdraw}
                  className="flex-1 border border-white/10 hover:bg-white/5 text-slate-300 font-bold py-3.5 rounded-xl transition-all text-xs sm:text-sm uppercase tracking-wider outline-none disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingWithdraw}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] outline-none cursor-pointer border-none"
                >
                  {submittingWithdraw ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {quoteModalJob && (() => {
        const service = globalServices.find(s => s.id === quoteModalJob.serviceId) || {};
        const serviceNameLower = (quoteModalJob.serviceName || '').toLowerCase();
        const categoryId = (serviceNameLower.includes('paint') || service.categoryId === 'painting') ? 'painting' : (service.categoryId || 'repair');
        
        return (
          <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#111827] border border-white/5 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-white">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/60">
                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">Submit Final Quote</h3>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Category: {categoryId}</p>
                </div>
                <button onClick={() => setQuoteModalJob(null)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all hover:rotate-95"><XCircle size={18} /></button>
              </div>
              <form onSubmit={handleSubmitQuote} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                
                {/* Category-Specific Inputs */}
                {(() => {
                  switch (categoryId) {
                    case 'repair':
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Labor Cost (₹)</label>
                              <input required type="number" value={quoteForm.serviceCharge} onChange={(e) => setQuoteForm({...quoteForm, serviceCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 250" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Parts Cost (₹)</label>
                              <input required type="number" value={quoteForm.sparePartsCost} onChange={(e) => setQuoteForm({...quoteForm, sparePartsCost: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 0" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visiting / Inspection Fee (₹)</label>
                            <input required type="number" value={quoteForm.transportCharge} onChange={(e) => setQuoteForm({...quoteForm, transportCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 99" />
                          </div>
                        </>
                      );
                    case 'installation':
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Installation Fee (₹)</label>
                              <input required type="number" value={quoteForm.serviceCharge} onChange={(e) => setQuoteForm({...quoteForm, serviceCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 350" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accessories (₹)</label>
                              <input required type="number" value={quoteForm.sparePartsCost} onChange={(e) => setQuoteForm({...quoteForm, sparePartsCost: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 100" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transport Charges (₹)</label>
                            <input required type="number" value={quoteForm.transportCharge} onChange={(e) => setQuoteForm({...quoteForm, transportCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 50" />
                          </div>
                        </>
                      );
                    case 'cleaning':
                      return (
                        <>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Area Size / Rooms Details</label>
                              <input required type="text" value={quoteForm.detectedIssues} onChange={(e) => setQuoteForm({...quoteForm, detectedIssues: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-semibold text-white text-sm transition-all" placeholder="e.g. 3 BHK / 1200 Sq Ft" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Labor / Manpower Cost (₹)</label>
                                <input required type="number" value={quoteForm.serviceCharge} onChange={(e) => setQuoteForm({...quoteForm, serviceCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 600" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material Cost (₹)</label>
                                <input required type="number" value={quoteForm.sparePartsCost} onChange={(e) => setQuoteForm({...quoteForm, sparePartsCost: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 150" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transport Charges (₹)</label>
                              <input required type="number" value={quoteForm.transportCharge} onChange={(e) => setQuoteForm({...quoteForm, transportCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 50" />
                            </div>
                          </div>
                        </>
                      );
                    case 'painting':
                      return (
                        <>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Wall Area / Room Details</label>
                              <input required type="text" value={quoteForm.detectedIssues} onChange={(e) => setQuoteForm({...quoteForm, detectedIssues: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-semibold text-white text-sm transition-all" placeholder="e.g. 1500 Sq Ft / 2 BHK" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Labor / Painter Cost (₹)</label>
                                <input required type="number" value={quoteForm.serviceCharge} onChange={(e) => setQuoteForm({...quoteForm, serviceCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 800" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paint & Material Cost (₹)</label>
                                <input required type="number" value={quoteForm.sparePartsCost} onChange={(e) => setQuoteForm({...quoteForm, sparePartsCost: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 1200" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transport / Setup Charges (₹)</label>
                              <input required type="number" value={quoteForm.transportCharge} onChange={(e) => setQuoteForm({...quoteForm, transportCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 100" />
                            </div>
                          </div>
                        </>
                      );
                    default:
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnosis Fee (₹)</label>
                              <input required type="number" value={quoteForm.serviceCharge} onChange={(e) => setQuoteForm({...quoteForm, serviceCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 199" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Replacement Cost (₹)</label>
                              <input required type="number" value={quoteForm.sparePartsCost} onChange={(e) => setQuoteForm({...quoteForm, sparePartsCost: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 200" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visiting / Extra Charges (₹)</label>
                            <input required type="number" value={quoteForm.transportCharge} onChange={(e) => setQuoteForm({...quoteForm, transportCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-white text-sm transition-all" placeholder="e.g. 50" />
                          </div>
                        </>
                      );
                  }
                })()}

                {/* Total Summary */}
                <div className="flex justify-between items-center bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                   <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Total Customer Price:</span>
                   <span className="text-xl font-black text-indigo-300">
                     ₹{Number(quoteForm.serviceCharge || 0) + Number(quoteForm.sparePartsCost || 0) + Number(quoteForm.transportCharge || 0)}
                   </span>
                </div>

                {categoryId !== 'cleaning' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Detected Issues (From Inspection)</label>
                    <textarea required value={quoteForm.detectedIssues} onChange={(e) => setQuoteForm({...quoteForm, detectedIssues: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none text-white text-xs font-semibold" rows="2" placeholder="List all observed problems..."></textarea>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnosis / Explanation</label>
                  <textarea required value={quoteForm.quoteReason} onChange={(e) => setQuoteForm({...quoteForm, quoteReason: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none text-white text-xs font-semibold" rows="2" placeholder="Explain the required work scope..."></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Proof Image URL (Optional)</label>
                  <input type="url" value={quoteForm.quotePhoto} onChange={(e) => setQuoteForm({...quoteForm, quotePhoto: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-200 text-xs font-medium" placeholder="https://..." />
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest outline-none active:scale-[0.98] mt-4">
                  Send Quote for Approval
                </button>
              </form>
            </div>
          </div>
        );
      })()}

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

export default TechnicianDashboard;
