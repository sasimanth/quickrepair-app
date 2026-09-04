import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { globalServices } from '../data/services';
import { subscribeToPushNotifications } from '../services/pushNotification';
import { requestFcmPermission } from '../services/firebase';
import { Calendar, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, Plus, LayoutDashboard, Wrench, Settings, Briefcase, Star, User, ChevronRight, MessageSquare, Camera, UploadCloud, Loader2, Shield, ShieldCheck, ShieldAlert, Sparkles, IndianRupee, Wallet, Coins, ArrowUpRight, ArrowDownLeft, FileText, Bell, CreditCard, Banknote, HelpCircle, Truck, Home, Search, Eye, Zap, Maximize2, Hash, Layers, Paintbrush, Tv, X, RefreshCw, PhoneCall, Menu, LogOut, ToggleLeft, ToggleRight, Headphones, Gift } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import SettingsModal from '../components/SettingsModal';
import VerificationModal from '../components/VerificationModal';
import KycModal from '../components/KycModal';
import { socket } from '../services/socket';
import { motion } from 'framer-motion';
import { playNotificationSound, startDispatchRingtone, stopDispatchRingtone } from '../services/soundEffects';
import DispatchOverlay from '../components/DispatchOverlay';
import { queueOfflineAction, syncOfflineActions } from '../services/offlineSync';

const formatPhoneLink = (phone) => {
  if (!phone) return '';
  return phone.toString().replace(/[^\d+]/g, '');
};

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    if (logout) await logout();
    navigate('/login');
  };
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  const [loading, setLoading] = useState(true);
  const [showEarningsDetails, setShowEarningsDetails] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'granted'
  );
  
  // Navigation active subtab state: 'overview' | 'jobs' | 'earnings' | 'reviews' | 'notifications' | 'support' | 'menu'
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const handleEnableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      await subscribeToPushNotifications();
      await requestFcmPermission();
      showToast('Notifications Enabled 🔔', 'You will now receive job alerts instantly.', 'success');
    }
  };

  const playChime = () => {
    playNotificationSound('low');
  };

  const triggerBrowserNotification = (title, message, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const defaultOptions = {
        body: message,
        icon: '/fixvo-icon.png',
        tag: options.tag || 'fixvo-general',
        vibrate: [200, 100, 200],
        renotify: true,
        data: options.data || {}
      };
      
      const notif = new Notification(title, defaultOptions);
      notif.onclick = () => {
        window.focus();
        if (options.data?.url) {
          const urlParams = new URLSearchParams(options.data.url.split('?')[1]);
          const jobId = urlParams.get('jobId');
          const chatId = urlParams.get('chatId');
          if (chatId) {
            setChatBookingId(chatId);
          } else if (jobId) {
            setActiveSubTab('jobs');
            const job = jobs.find(j => j._id === jobId);
            if (job) {
              if (['pending', 'assigned', 'queued'].includes(job.status)) setJobTab('new');
              else if (['accepted', 'on_the_way', 'arrived', 'quote_approved', 'in_progress'].includes(job.status)) setJobTab('active');
              else if (job.status === 'quote_pending') setJobTab('quote_pending');
              else if (job.status === 'completed') {
                setJobTab('completed');
                setExpandedCompletedJobs(prev => ({ ...prev, [jobId]: true }));
              } else if (['cancelled', 'rejected'].includes(job.status)) setJobTab('cancelled');
            }
          }
        }
      };
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

  const [setupLoading, setSetupLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [chatBookingId, setChatBookingId] = useState(null);
  const [quoteModalJob, setQuoteModalJob] = useState(null);
  const [activeAlertJob, setActiveAlertJob] = useState(null);
  const [clarificationResponse, setClarificationResponse] = useState('');
  const [declineJobId, setDeclineJobId] = useState(null);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('');
  const [customDeclineReason, setCustomDeclineReason] = useState('');

  const startAlarm = () => {
    startDispatchRingtone();
  };

  const stopAlarm = () => {
    stopDispatchRingtone();
  };

  const [quoteForm, setQuoteForm] = useState({ serviceCharge: '', sparePartsCost: '', transportCharge: '50', quoteReason: '', quotePhoto: '', detectedIssues: '' });
  const [uploadedImages, setUploadedImages] = useState({
    damagedPart: '',
    repairProof: '',
    completedWork: ''
  });

  const handleImageChange = (e, slot) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      showToast('File Too Large ⚠️', 'Please upload an image smaller than 2.5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImages(prev => ({
        ...prev,
        [slot]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (slot) => {
    setUploadedImages(prev => ({
      ...prev,
      [slot]: ''
    }));
  };

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
      setJobs(prev => prev.filter(b => b._id !== cancelJobId));
      setCancelJobId(null);
      setCancellationReason('');
      showToast('Job Cancelled ❌', 'You have successfully cancelled this job.', 'success');
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
    setUploadedImages({
      damagedPart: '',
      repairProof: '',
      completedWork: ''
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
        return ['accepted', 'on_the_way', 'arrived', 'inspection_started', 'quote_approved', 'in_progress'].includes(job.status);
      } else if (jobTab === 'quote_pending') {
        return ['quote_pending', 'quote_clarification', 'quote_rejected'].includes(job.status);
      } else if (jobTab === 'completed') {
        return job.status === 'completed';
      } else if (jobTab === 'cancelled') {
        return ['cancelled', 'rejected'].includes(job.status);
      }
      return true;
    });
  }, [jobs, jobTab]);

  useEffect(() => { 
    fetchJobs(); 
    subscribeToPushNotifications(); 
    requestFcmPermission(); 
  }, []);

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

  // Register private room & sync
  useEffect(() => {
    if (!profile?.userId) return;

    const registerSocket = () => {
      socket.emit('register_user', profile.userId);
      socket.emit('register_tech', profile.userId);
      fetchJobs(true);
    };

    registerSocket();
    socket.on('connect', registerSocket);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!socket.connected) {
          socket.connect();
        }
        fetchJobs(true);
      }
    };

    const handleOnlineSync = () => {
      syncOfflineActions((action) => {
        showToast('🔄 Offline Sync Complete', `Status update synced successfully: ${action.status.replace(/_/g, ' ').toUpperCase()}`, 'success', true);
        fetchJobs(true);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnlineSync);

    syncOfflineActions((action) => {
      showToast('🔄 Offline Sync Complete', `Status update synced successfully: ${action.status.replace(/_/g, ' ').toUpperCase()}`, 'success', true);
      fetchJobs(true);
    });

    return () => {
      socket.off('connect', registerSocket);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineSync);
    };
  }, [profile?.userId]);

  useEffect(() => {
    if (!profile?.userId) return;

    const handleNewJob = (newJob) => {
      showToast(
        '💼 New Job Assigned!', 
        `New repair request for ${newJob.serviceName} has been assigned to you.`, 
        'info'
      );
      triggerBrowserNotification('💼 New Job Assigned!', `New repair request for ${newJob.serviceName} has been assigned to you.`, {
        tag: `job-${newJob._id}`,
        data: { url: `/dashboard?jobId=${newJob._id}` }
      });
      setJobs(prev => {
        if (prev.some(j => j._id === newJob._id)) return prev;
        return [newJob, ...prev];
      });
      setActiveAlertJob(newJob);
      startAlarm();
    };

    const handleJobUpdate = (updatedJob) => {
      fetchJobs(true);
      const isSelfGenerated = updatedJob.initiatorId === profileRef.current?.userId || updatedJob.initiatorRole === 'technician';

      if (!isSelfGenerated) {
        const criticalStatuses = ['in_progress', 'completed'];
        const isCritical = criticalStatuses.includes(updatedJob.status) || updatedJob.paymentStatus === 'completed';

        showToast(
          '🔄 Job Update', 
          `Job #${updatedJob._id.slice(-6)} is now: ${updatedJob.status.replace(/_/g, ' ').toUpperCase()}`, 
          'info',
          !isCritical
        );
        triggerBrowserNotification('🔄 Job Update', `Job #${updatedJob._id.slice(-6)} is now: ${updatedJob.status.replace(/_/g, ' ').toUpperCase()}`, {
          tag: `job-${updatedJob._id}`,
          data: { url: `/dashboard?jobId=${updatedJob._id}` }
        });

        if (updatedJob.status === 'quote_approved' || updatedJob.paymentStatus === 'completed') {
          playNotificationSound('high');
        }
      }
      
      if (activeAlertJob && updatedJob._id === activeAlertJob._id) {
        if (updatedJob.providerId !== profileRef.current?.userId) {
          setActiveAlertJob(null);
          stopAlarm();
          showToast('⚠️ ASAP Job Reassigned', 'The ASAP job response window closed.', 'error');
        }
      }
    };

    const handleNewNotification = (notif) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === notif._id || (n.title === notif.title && n.message === notif.message && Math.abs(new Date(n.createdAt) - new Date(notif.createdAt)) < 5000))) {
          return prev;
        }
        return [notif, ...prev];
      });
      if (notif.type === 'payout' || notif.type === 'system') {
        showToast(notif.title, notif.message, 'info');
      }
    };

    const handleJobExpired = (data) => {
      if (activeAlertJob && activeAlertJob._id === data.bookingId) {
        setActiveAlertJob(null);
        stopAlarm();
        showToast('⚠️ Request Expired', 'The incoming job request has expired.', 'warning');
        fetchJobs(true);
      }
    };

    socket.on('new_job', handleNewJob);
    socket.on('new_job_request', handleNewJob);
    socket.on('job_update', handleJobUpdate);
    socket.on('job_expired', handleJobExpired);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_job', handleNewJob);
      socket.off('new_job_request', handleNewJob);
      socket.off('job_update', handleJobUpdate);
      socket.off('job_expired', handleJobExpired);
      socket.off('new_notification', handleNewNotification);
    };
  }, [profile?.userId, activeAlertJob]);

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
      if (newMsg.senderId === profileRef.current?.userId || newMsg.senderId === 'system') {
        return;
      }
      const isCurrentChatOpen = chatBookingId === newMsg.bookingId;
      if (!isCurrentChatOpen) {
        showToast(
          `💬 Message from ${newMsg.senderName}`, 
          newMsg.text, 
          'info'
        );
        triggerBrowserNotification(`💬 Message from ${newMsg.senderName}`, newMsg.text, {
          tag: `chat-${newMsg.bookingId}`,
          data: { url: `/dashboard?chatId=${newMsg.bookingId}` }
        });
        playNotificationSound('low');
      }
      setJobs(prev => prev.map(b => {
        if (b._id === newMsg.bookingId) {
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

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  const fetchJobs = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const profileRes = await api.get('/technicians/profile');
      setProfile(profileRes.data);

      if (profileRes.data.isProfileComplete) {
        const { data } = await api.get('/bookings');
        const sortedJobs = data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setJobs(sortedJobs);
        const reviewsRes = await api.get(`/reviews/technician/${profileRes.data.userId}`);
        setReviews(reviewsRes.data);
        await fetchNotifications();
      }
    } catch (error) { 
      console.error('Error fetching dashboard data', error); 
    } finally { 
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const updateJobStatus = async (id, status, rejectionReason = '') => {
    if (!id) return;
    if (activeAlertJob && (activeAlertJob._id === id || activeAlertJob.id === id)) {
      stopAlarm();
      setActiveAlertJob(null);
    }
    if (updatingJobs[id]) return;

    // Instantly switch tabs so the job is visible in the right subtab
    const activeStatuses = ['accepted', 'on_the_way', 'arrived', 'inspection_started', 'quote_approved', 'in_progress'];
    if (activeStatuses.includes(status)) {
      setJobTab('active');
      setActiveSubTab('jobs');
    } else if (status === 'completed') {
      setJobTab('completed');
    } else if (['cancelled', 'rejected'].includes(status)) {
      setJobTab('cancelled');
    }

    // 1. Immediate optimistic UI update (supports both _id and id)
    setJobs(prevJobs => prevJobs.map(job => {
      const jId = job._id || job.id;
      if (jId === id || String(jId) === String(id)) {
        return { ...job, status };
      }
      return job;
    }));
    setUpdatingJobs(prev => ({ ...prev, [id]: true }));

    // 2. Persist in localStorage for instant local durability
    try {
      const stored = localStorage.getItem('demo_jobs');
      let currentLocal = stored ? JSON.parse(stored) : [];
      const updatedLocal = currentLocal.map(j => (j._id === id || j.id === id || String(j._id || j.id) === String(id)) ? { ...j, status } : j);
      localStorage.setItem('demo_jobs', JSON.stringify(updatedLocal));
    } catch (e) {}

    // 3. API request to backend asynchronously
    try {
      const { data: updatedBooking } = await api.put(`/bookings/${id}/status`, { status, rejectionReason });
      if (updatedBooking && (updatedBooking._id || updatedBooking.id)) {
        setJobs(prevJobs => prevJobs.map(job => (job._id === id || job.id === id || String(job._id || job.id) === String(id)) ? { ...job, ...updatedBooking } : job));
      }
      showToast('Status Updated ✅', `Job status changed to ${status.replace(/_/g, ' ').toUpperCase()}`, 'success', true);
    } catch (error) { 
      console.warn("Backend status sync warning, retained optimistic status update", error);
      showToast('Status Updated (Local) ⚡', `Job status changed to ${status.replace(/_/g, ' ').toUpperCase()}`, 'info', true);
    } finally {
      setUpdatingJobs(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!quoteModalJob) return;
    const jobId = quoteModalJob._id || quoteModalJob.id;
    if (!jobId || updatingJobs[jobId]) return;

    const sCharge = Number(quoteForm.serviceCharge || 0);
    const pCost = Number(quoteForm.sparePartsCost || 0);
    const tCharge = Number(quoteForm.transportCharge || 50);
    const finalPrice = sCharge + pCost + tCharge;
    
    let quotePhotoVal = '';
    const activePhotos = {};
    if (uploadedImages.damagedPart) activePhotos.damagedPart = uploadedImages.damagedPart;
    if (uploadedImages.repairProof) activePhotos.repairProof = uploadedImages.repairProof;
    if (uploadedImages.completedWork) activePhotos.completedWork = uploadedImages.completedWork;
    
    if (Object.keys(activePhotos).length > 0) {
      quotePhotoVal = JSON.stringify(activePhotos);
    }

    // Immediate optimistic update
    setJobs(prevJobs => prevJobs.map(job => (job._id === jobId || job.id === jobId || String(job._id || job.id) === String(jobId)) ? { 
      ...job, 
      status: 'quote_pending', 
      serviceCharge: sCharge,
      sparePartsCost: pCost,
      transportCharge: tCharge,
      finalQuote: finalPrice, 
      quoteReason: quoteForm.quoteReason,
      quotePhoto: quotePhotoVal
    } : job));
    
    setJobTab('quote_pending');
    setActiveSubTab('jobs');
    setQuoteModalJob(null);
    setQuoteForm({ serviceCharge: '', sparePartsCost: '', transportCharge: '50', quoteReason: '', quotePhoto: '', detectedIssues: '' });
    setUploadedImages({ damagedPart: '', repairProof: '', completedWork: '' });
    setUpdatingJobs(prev => ({ ...prev, [jobId]: true }));
    showToast('Quote Sent! 📄', `Quote of ₹${finalPrice} submitted to customer for approval.`, 'success');
    
    try {
      await api.put(`/bookings/${jobId}/quote`, {
         serviceCharge: sCharge,
         sparePartsCost: pCost,
         transportCharge: tCharge,
         quoteReason: quoteForm.quoteReason,
         quotePhoto: quotePhotoVal,
         detectedIssues: quoteForm.detectedIssues
      });
    } catch (error) {
      console.warn("Backend quote sync warning, retained optimistic quote state", error);
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
          skills: ['All Devices'],
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
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Unassigned' },
      assigned: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, label: 'Assigned To You' },
      queued: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: 'Queued' },
      accepted: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: CheckCircle, label: 'Accepted by Tech' },
      quote_pending: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Clock, label: 'Quote Sent' },
      quote_approved: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: CheckCircle, label: 'Quote Approved' },
      on_the_way: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Truck, label: 'On The Way' },
      arrived: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: MapPin, label: 'Arrived at Location' },
      in_progress: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Wrench, label: 'Work In Progress' },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Completed' },
      rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Rejected' },
      cancelled: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Cancelled' }
    };
    const { color, icon: Icon, label } = config[status] || config.pending;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${color}`}>
        <Icon size={14} />
        {label || status}
      </span>
    );
  };

  const activeJob = useMemo(() => {
    return jobs.find(j => j && ['accepted', 'on_the_way', 'arrived', 'inspection_started', 'quote_approved', 'in_progress'].includes(j.status));
  }, [jobs]);

  const activeJobsCount = jobs.filter(j => j && !['completed', 'cancelled', 'rejected'].includes(j.status)).length;
  const completedJobsCount = jobs.filter(j => j && j.status === 'completed').length;

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'jobs', label: 'My Jobs', icon: Briefcase },
    { id: 'earnings', label: 'Earnings & Wallet', icon: Wallet },
    { id: 'reviews', label: 'Ratings & Reviews', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
    { id: 'menu', label: 'Account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 select-none">
      
      {/* Sleek Header with ONLY Active / Deactive Toggle Button */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-600/30">
              F
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900">
              Fix<span className="text-blue-600">vo</span>
            </span>
            <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Technician Portal
            </span>
          </Link>
        </div>

        {/* Top Bar: ONLY Active / Deactive Switch */}
        <div className="flex items-center">
          {(() => {
            const status = profile?.currentStatus || (profile?.isOnline ? 'online' : 'offline');
            const isOnline = status === 'online' || status === 'available';
            
            return (
              <button
                onClick={status === 'on_job' ? null : toggleOnlineStatus}
                disabled={status === 'on_job'}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-xs ${
                  isOnline 
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20' 
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
                title={isOnline ? "Status: Active (Receiving Repair Requests)" : "Status: Deactive (Offline)"}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                <span>{isOnline ? 'Active (Online)' : 'Deactive (Offline)'}</span>
              </button>
            );
          })()}
        </div>
      </header>

      {/* Main Full-Width Container */}
      <div className="w-full min-h-screen animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row w-full min-h-screen">

          {/* Desktop Left Sidebar Menu (Full Height) */}
          <div className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-white border-r border-slate-200/80 min-h-screen sticky top-0 p-5 space-y-6 shadow-xs z-20">
            <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-600/30">
                F
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight">Technician Portal</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Pro Partner Workspace</p>
              </div>
            </div>

            <div className="space-y-1">
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

          {/* Right Main Content Workspace (Full Width Expanded) */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 bg-slate-50 min-h-screen space-y-6">

            {/* 1. OVERVIEW TAB */}
            {activeSubTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Welcome back, {profile?.name?.split(' ')[0] || 'Technician'}! 🛠️</h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Monitor active repair jobs, track earnings, and respond to incoming customer requests</p>
                </div>

                {/* Onboarding & Verification Banners */}
                {!loading && profile && !profile.isProfileComplete && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-3xl p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-200">
                      <MapPin size={24} />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">Activate Service Geolocation</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">To start receiving local repair requests, please verify your service area.</p>
                    <button 
                      onClick={handleSetupProfile}
                      disabled={setupLoading}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-md text-xs uppercase tracking-wider cursor-pointer border-none"
                    >
                      {setupLoading ? <Loader2 className="animate-spin" size={16}/> : <MapPin size={16}/>}
                      <span>{setupLoading ? 'Locating...' : 'Share Location & Activate'}</span>
                    </button>
                  </div>
                )}

                {/* Active Job Tracker Banner */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Active Job Live Tracker</h3>
                    {activeJob && (
                      <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 animate-pulse">Live Work Active</span>
                    )}
                  </div>

                  {activeJob ? (
                    <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-blue-100/80 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                              {activeJob.serviceName || 'Home Repair'}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-500">ID: #{((activeJob._id || 'N/A').toString()).slice(-6).toUpperCase()}</span>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 mt-1">₹{activeJob.finalQuote || activeJob.serviceId?.price || 0}</h4>
                          <p className="text-xs text-slate-600 font-medium">{activeJob.location}</p>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-1.5">
                          {getStatusBadge(activeJob.status)}
                          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            <Clock size={12} className="text-blue-600" />
                            {activeJob.date ? new Date(activeJob.date).toLocaleDateString() : 'Today'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-xs border border-blue-200">
                            👤
                          </div>
                          <div>
                            <h5 className="font-extrabold text-xs text-slate-900">{activeJob.userEmail ? activeJob.userEmail.split('@')[0] : 'Customer'}</h5>
                            <p className="text-[10px] text-slate-500 font-medium">Issue: "{activeJob.problemDescription?.slice(0, 30)}..."</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setActiveSubTab('jobs');
                            if (['pending', 'assigned', 'queued'].includes(activeJob.status)) setJobTab('new');
                            else setJobTab('active');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer border-none shadow-xs"
                        >
                          Manage Job Workflow
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 text-center space-y-2">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                        <Wrench size={20} />
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-800">No active job currently assigned</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Check the My Jobs tab for incoming repair requests and quotes.</p>
                    </div>
                  )}
                </div>

                {/* Performance Snapshot Matrix - Series A Funded Startup Aesthetics */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Performance Snapshot</h3>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Sparkles size={12} className="text-emerald-500"/> Verified Pro Partner
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border border-slate-200/90 p-4 sm:p-5 rounded-3xl text-left shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 font-bold">
                        <Wrench size={18} />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Jobs</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">{activeJobsCount}</span>
                    </div>

                    <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border border-slate-200/90 p-4 sm:p-5 rounded-3xl text-left shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 font-bold">
                        <CheckCircle size={18} />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Completed Jobs</span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">{completedJobsCount}</span>
                    </div>

                    <div className="bg-gradient-to-br from-white via-slate-50 to-amber-50/40 border border-slate-200/90 p-4 sm:p-5 rounded-3xl text-left shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2 font-bold">
                        <Star size={18} className="fill-amber-400 text-amber-500" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Rating Score</span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">★ {profile?.rating || '5.0'}</span>
                    </div>

                    <div className="bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 border border-slate-200/90 p-4 sm:p-5 rounded-3xl text-left shadow-xs relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 font-bold">
                          <Wallet size={18} />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Wallet Balance</span>
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">₹{(profile?.walletBalance || 0).toFixed(0)}</span>
                      </div>
                      <button
                        onClick={handleOpenWithdrawModal}
                        className="mt-2 text-[10px] font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-wider underline cursor-pointer border-none bg-transparent text-left"
                      >
                        Withdraw Funds →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MY JOBS TAB */}
            {activeSubTab === 'jobs' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <Briefcase className="text-blue-600" /> Repair Jobs & Requests
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Manage incoming job requests, active repairs, quote proposals, and completed history</p>
                </div>

                {/* Responsive Filter subtabs (All 5 visible without side scrolling) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/70">
                  {[
                    { id: 'new', label: 'New Requests', count: jobs.filter(j => ['pending', 'assigned', 'queued'].includes(j.status)).length },
                    { id: 'active', label: 'Active Jobs', count: jobs.filter(j => ['accepted', 'on_the_way', 'arrived', 'inspection_started', 'quote_approved', 'in_progress'].includes(j.status)).length },
                    { id: 'quote_pending', label: 'Quote Proposals', count: jobs.filter(j => ['quote_pending', 'quote_clarification', 'quote_rejected'].includes(j.status)).length },
                    { id: 'completed', label: 'Completed History', count: jobs.filter(j => j.status === 'completed').length },
                    { id: 'cancelled', label: 'Cancelled Jobs', count: jobs.filter(j => ['cancelled', 'rejected'].includes(j.status)).length }
                  ].map(tab => {
                    const isSelected = jobTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setJobTab(tab.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none outline-none flex items-center justify-between gap-1 shadow-xs ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : 'bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{tab.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 font-semibold text-sm bg-slate-50/50 border border-slate-100 rounded-2xl">
                    No jobs found in <strong className="text-slate-900 capitalize">"{jobTab.replace(/_/g, ' ')}"</strong> status.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => {
                      return (
                        <div 
                          key={job._id} 
                          id={`job-card-${job._id}`} 
                          className="rounded-3xl p-6 border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all space-y-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
                                {job.serviceId?.name || job.serviceName || 'Device Repair'}
                              </span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
                                {job.serviceOption === 'inspection' ? 'Inspection Visit' : 'Direct Repair'}
                              </span>
                            </div>
                            {getStatusBadge(job.status)}
                          </div>

                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Quoted Service Price</span>
                              <h3 className="text-3xl font-black text-slate-900 mt-0.5">₹{job.finalQuote || job.serviceId?.price || 0}</h3>
                              <p className="text-xs text-slate-500 font-medium mt-1">Date: {job.date ? new Date(job.date).toLocaleDateString() : 'Today'}</p>
                            </div>

                            {/* Workflow Actions */}
                            {(() => {
                              const jobId = job._id || job.id;
                              const isUpdating = updatingJobs[jobId];
                              return (
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                  {['pending', 'assigned'].includes(job.status) && (
                                    <>
                                      <button
                                        disabled={isUpdating}
                                        onClick={() => updateJobStatus(jobId, 'accepted')}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                                      >
                                        <CheckCircle size={14} /> Accept Request
                                      </button>
                                      <button
                                        disabled={isUpdating}
                                        onClick={() => setDeclineJobId(jobId)}
                                        className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {job.status === 'accepted' && (
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => updateJobStatus(jobId, 'on_the_way')}
                                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                                    >
                                      <Truck size={14} /> Start Route
                                    </button>
                                  )}

                                  {job.status === 'on_the_way' && (
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => updateJobStatus(jobId, 'arrived')}
                                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                                    >
                                      <MapPin size={14} /> Confirm Arrival
                                    </button>
                                  )}

                                  {job.status === 'arrived' && (
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => updateJobStatus(jobId, 'inspection_started')}
                                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                                    >
                                      <Wrench size={14} /> Start Inspection
                                    </button>
                                  )}

                                  {job.status === 'inspection_started' && (
                                    <button
                                      onClick={() => handleOpenQuoteModal(job)}
                                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                                    >
                                      <Wrench size={14} /> Submit Final Quote
                                    </button>
                                  )}

                                  {job.status === 'quote_approved' && (
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => updateJobStatus(jobId, 'in_progress')}
                                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                                    >
                                      <Wrench size={14} /> Start Repair Work
                                    </button>
                                  )}

                                  {job.status === 'in_progress' && (
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => updateJobStatus(jobId, 'completed')}
                                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                                    >
                                      <CheckCircle size={14} /> Complete Job
                                    </button>
                                  )}

                                  {['accepted', 'quote_approved', 'on_the_way', 'arrived', 'inspection_started', 'quote_pending', 'in_progress'].includes(job.status) && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.detailedAddress || job.location || 'Madanapalle')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer no-underline shadow-xs flex items-center gap-1.5"
                                      >
                                        <MapPin size={14} /> Directions
                                      </a>
                                      {(job.customerPhone || job.phone) && (
                                        <a
                                          href={`tel:${formatPhoneLink(job.customerPhone || job.phone)}`}
                                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer no-underline shadow-xs flex items-center gap-1.5"
                                        >
                                          <PhoneCall size={14} /> Call
                                        </a>
                                      )}
                                      <button
                                        onClick={() => setChatBookingId(jobId)}
                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-xs flex items-center gap-1.5 relative"
                                      >
                                        <MessageSquare size={14} /> Chat
                                        {job.unreadCount > 0 && (
                                          <span className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full text-[9px] font-black w-4 h-4 flex items-center justify-center border border-white animate-pulse">{job.unreadCount}</span>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Customer & Location Metadata */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 text-xs">
                            <div className="space-y-2">
                              <p className="text-slate-600"><strong className="text-slate-900">Customer:</strong> {job.userEmail ? job.userEmail.split('@')[0] : 'Guest Customer'}</p>
                              <p className="text-slate-600"><strong className="text-slate-900">Location:</strong> {job.location}</p>
                              {job.deviceType && <p className="text-slate-600"><strong className="text-slate-900">Device Model:</strong> {job.deviceType}</p>}
                            </div>
                            <div className="space-y-2">
                              <p className="text-slate-600"><strong className="text-slate-900">Problem Description:</strong> "{job.problemDescription || 'General Repair'}"</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. EARNINGS & WALLET TAB */}
            {activeSubTab === 'earnings' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <Wallet className="text-blue-600" /> Earnings & Wallet
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Track gross revenue, net payouts, platform fees, and request direct withdrawals</p>
                </div>

                {/* Available Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-md">
                  <div>
                    <span className="text-[10px] bg-white/20 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider select-none backdrop-blur-xs">
                      Available Wallet Balance
                    </span>
                    <p className="text-4xl font-black text-white mt-3 tracking-tight">₹{(profile?.walletBalance || 0).toFixed(2)}</p>
                    {profile?.pendingWithdrawal > 0 && (
                      <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mt-2">
                        Pending Payout: ₹{profile.pendingWithdrawal}
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={handleOpenWithdrawModal}
                    className="bg-white hover:bg-blue-50 text-blue-700 font-extrabold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm border-none cursor-pointer"
                  >
                    Request Payout <ArrowUpRight size={16} />
                  </button>
                </div>

                {/* Financial Breakdown Grid */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider ml-1">Financial Breakdown Matrix</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Gross Earnings', value: profile?.grossEarnings || 0, desc: 'Completed service volume', icon: Coins, color: 'text-blue-600 bg-blue-50' },
                      { label: 'Platform Fee (10%)', value: profile?.platformFee || 0, desc: 'Platform service commission', icon: ArrowDownLeft, color: 'text-rose-600 bg-rose-50' },
                      { label: 'Net Share (90%)', value: profile?.netEarnings || 0, desc: 'Your net revenue share', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                      { label: 'Cash Collected', value: profile?.cashCollected || 0, desc: 'Cash collected on-site', icon: Banknote, color: 'text-amber-600 bg-amber-50' },
                      { label: 'Online Payments', value: profile?.onlinePayments || 0, desc: 'Processed digitally', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
                      { label: 'Platform Due', value: profile?.platformDue || 0, desc: 'Fee owed from cash jobs', icon: AlertCircle, color: 'text-orange-600 bg-orange-50' },
                      { label: 'Pending Clearance', value: profile?.pendingClearance || 0, desc: 'Awaiting customer checkout', icon: Clock, color: 'text-purple-600 bg-purple-50' },
                      { label: 'Total Withdrawn', value: profile?.withdrawn || 0, desc: 'Paid out to bank account', icon: FileText, color: 'text-slate-600 bg-slate-100' }
                    ].map((card, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 shadow-xs">
                        <div className={`p-2 rounded-xl border ${card.color} w-max`}>
                          <card.icon size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{card.label}</p>
                          <p className="text-xl font-black text-slate-900 mt-0.5">₹{card.value.toFixed(2)}</p>
                          <p className="text-[9px] text-slate-500 font-medium mt-0.5">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payout History Table */}
                <div className="space-y-4 pt-4">
                  <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider ml-1">Payout & Bank Withdrawal History</h3>
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
                    {!profile?.withdrawals || profile.withdrawals.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 font-semibold text-xs">
                        No withdrawal requests recorded yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                              <th className="px-5 py-3.5">Date</th>
                              <th className="px-5 py-3.5">Account / UPI</th>
                              <th className="px-5 py-3.5">Amount</th>
                              <th className="px-5 py-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                            {profile.withdrawals.map((req) => (
                              <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3.5 text-slate-500">
                                  {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-3.5">
                                  <p className="font-bold text-slate-900">{req.bankDetails?.accountName}</p>
                                  <p className="text-[10px] text-slate-500">{req.bankDetails?.accountNumber} ({req.bankDetails?.ifscCode})</p>
                                </td>
                                <td className="px-5 py-3.5 font-black text-slate-900">₹{req.amount}</td>
                                <td className="px-5 py-3.5">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    req.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {req.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. RATINGS & REVIEWS TAB */}
            {activeSubTab === 'reviews' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <Star className="text-amber-500 fill-amber-500" /> Customer Ratings & Reviews
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Review customer ratings, service feedback, and performance stars</p>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xs">
                      ★ {profile?.rating || '5.0'}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Overall Rating Score</h3>
                      <p className="text-xs text-slate-600 font-medium">Based on customer feedback across completed jobs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">{reviews.length}</span>
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Total Reviews</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {reviews.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-semibold text-xs bg-slate-50/50 border border-slate-100 rounded-2xl">
                      No customer reviews recorded yet.
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={14} className={star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(rev.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-800 font-semibold italic">"{rev.comment || 'No comment provided.'}"</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">— Verified Customer</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 5. NOTIFICATIONS TAB */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <Bell className="text-blue-600" /> Notifications & Alerts
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Real-time alerts for job assignments, quote approvals, customer messages, and payouts</p>
                </div>

                {notifPermission !== 'granted' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Enable Desktop & Push Notifications</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">Receive sound chimes and lock screen alerts when new repair jobs arrive.</p>
                    </div>
                    <button
                      onClick={handleEnableNotifications}
                      className="px-4 py-2 bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none shadow-xs"
                    >
                      Enable Alerts
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-semibold text-xs bg-slate-50/50 border border-slate-100 rounded-2xl">
                      No notifications right now.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif._id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                          <Bell size={16} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{notif.title}</h4>
                          <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 font-medium block mt-1">{new Date(notif.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. HELP & SUPPORT TAB */}
            {activeSubTab === 'support' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <HelpCircle className="text-blue-600" /> Help & Partner Support
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Get assistance with job disputes, payout queries, and platform guidelines</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50/80 border border-blue-200 rounded-3xl p-6 space-y-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                      📞
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">Partner Helpline</h3>
                    <p className="text-xs text-slate-600 font-medium">Need immediate assistance on an active repair visit?</p>
                    <a href="tel:+918000000000" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider no-underline shadow-xs">
                      Call Support Team
                    </a>
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-6 space-y-3">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
                      💳
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">Payout Rules</h3>
                    <p className="text-xs text-slate-600 font-medium">Withdrawals processed within 24 hours. Minimum payout: ₹500.</p>
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">90% Net Share Guarantee</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. ACCOUNT MODULE (Urban Company layout adapted for Fixvo Technicians) */}
            {activeSubTab === 'menu' && (() => {
              const isKycComplete = Boolean(profile?.isKycVerified);
              const displayName = profile?.name || 'Certified Technician';
              const displayPhone = profile?.phone || '+91 95159 80170';

              return (
                <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-300 pb-16 text-left">
                  
                  {/* Top Header Card */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      {isKycComplete ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Verified Pro Partner</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>KYC Verification Pending</span>
                        </div>
                      )}

                      <button
                        onClick={() => isKycComplete ? setShowSettings(true) : setShowKyc(true)}
                        className="px-4 py-1.5 border border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        {isKycComplete ? 'Edit' : 'Complete KYC'}
                      </button>
                    </div>

                    <div className="mt-4">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        {displayName}
                      </h2>
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
                        <span>{displayPhone}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          profile?.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {profile?.isOnline ? '● Online' : '○ Offline'}
                        </span>
                      </p>
                    </div>

                    {/* 3 Quick Action Cards */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-6">
                      <button
                        onClick={() => setActiveSubTab('jobs')}
                        className="bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/90 p-3 sm:p-4 flex flex-col justify-between items-start gap-3 transition-all cursor-pointer text-left shadow-2xs group min-h-[96px]"
                      >
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Briefcase size={18} />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">My Jobs</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowKyc(true)}
                        className="bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/90 p-3 sm:p-4 flex flex-col justify-between items-start gap-3 transition-all cursor-pointer text-left shadow-2xs group min-h-[96px]"
                      >
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">KYC & Docs</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveSubTab('support')}
                        className="bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/90 p-3 sm:p-4 flex flex-col justify-between items-start gap-3 transition-all cursor-pointer text-left shadow-2xs group min-h-[96px]"
                      >
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                          <Headphones size={18} />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">Help & support</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Menu Items List */}
                  <div className="bg-white rounded-3xl p-1.5 sm:p-2 border border-slate-200/80 shadow-xs divide-y divide-slate-100">
                    {[
                      { 
                        id: 'earnings', 
                        title: 'Wallet & Payouts', 
                        icon: Wallet, 
                        action: () => setActiveSubTab('earnings'),
                        extraText: `₹${(profile?.walletBalance || 0).toFixed(0)}` 
                      },
                      { 
                        id: 'reviews', 
                        title: 'Ratings & Performance', 
                        icon: Star, 
                        action: () => setActiveSubTab('reviews'),
                        extraText: `★ ${profile?.rating || '4.9'}` 
                      },
                      { 
                        id: 'notifications', 
                        title: 'Notification Center', 
                        icon: Bell, 
                        action: () => setActiveSubTab('notifications'),
                        badge: notifications.length > 0 ? `${notifications.length} New` : null 
                      },
                      { 
                        id: 'kyc', 
                        title: 'KYC & Verification', 
                        icon: ShieldCheck, 
                        action: () => setShowKyc(true),
                        badge: isKycComplete ? 'Verified' : 'Pending' 
                      },
                      { 
                        id: 'skills', 
                        title: 'Service Categories & Skills', 
                        icon: Wrench, 
                        action: () => setShowSettings(true) 
                      },
                      { 
                        id: 'settings', 
                        title: 'Settings & Identity', 
                        icon: Settings, 
                        action: () => setShowSettings(true) 
                      },
                      { 
                        id: 'terms', 
                        title: 'Partner Terms & Guidelines', 
                        icon: FileText, 
                        action: () => navigate('/technician-agreement') 
                      },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={item.action}
                          className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/90 rounded-2xl transition-all group"
                        >
                          <div className="flex items-center gap-3.5">
                            <ItemIcon size={19} className="text-slate-800 group-hover:text-blue-600 transition-colors shrink-0 stroke-[1.8]" />
                            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-slate-950">
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                item.badge === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                            {item.extraText && (
                              <span className="text-xs font-bold text-slate-400">
                                {item.extraText}
                              </span>
                            )}
                            <ChevronRight size={17} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Refer a Technician Promo Card */}
                  <div 
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.origin + '/technician-agreement');
                        alert('Referral link copied! Share with fellow technicians to earn referral bonuses.');
                      }
                    }}
                    className="bg-gradient-to-r from-purple-50 via-purple-50 to-indigo-50 border border-purple-100/90 rounded-3xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
                  >
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900">Refer a Technician & earn ₹500</h4>
                      <p className="text-xs text-purple-700 font-medium mt-0.5">Invite certified repair partners to join Fixvo</p>
                    </div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-200/60 text-purple-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform shrink-0">
                      <Gift size={22} />
                    </div>
                  </div>

                  {/* Logout Option */}
                  <div className="bg-white rounded-3xl p-1.5 border border-slate-200/80 shadow-xs">
                    <div
                      onClick={handleLogout}
                      className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-rose-50/80 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <LogOut size={19} className="text-rose-500 shrink-0 stroke-[1.8]" />
                        <span className="text-xs sm:text-sm font-bold text-rose-600">
                          Log out
                        </span>
                      </div>
                      <ChevronRight size={17} className="text-rose-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                </div>
              );
            })()}

            </div>
          </div>
        </div>

      {/* Sleek Mobile Bottom App Navigation Bar (Urban Company Mobile App Layout) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 flex justify-around items-center z-50 shadow-lg">
        {[
          { id: 'overview', label: 'Home', icon: Home },
          { id: 'jobs', label: 'Jobs', icon: Briefcase },
          { id: 'earnings', label: 'Earnings', icon: Wallet },
          { id: 'menu', label: 'Account', icon: User }
        ].map(nav => {
          const IconComp = nav.icon;
          const isActive = activeSubTab === nav.id;
          return (
            <button
              key={nav.id}
              onClick={() => setActiveSubTab(nav.id)}
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

      {/* Chat Modal */}
      {chatBookingId && (
        <ChatModal 
          booking={jobs.find(b => b._id === chatBookingId)} 
          currentRole="technician" 
          onClose={handleCloseChat} 
        />
      )}

      {/* Profile Settings Modal */}
      {showSettings && (
        <SettingsModal 
          role="technician"
          currentProfile={profile}
          onClose={() => setShowSettings(false)}
          onSuccess={() => {
            setShowSettings(false);
            fetchJobs();
            showToast("Settings Updated ✅", "Settings updated successfully", "success");
          }}
        />
      )}

      {/* Verification Modal */}
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

      {/* Reason Modal */}
      {viewReasonJob && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Cancellation Details</h3>
            <div className="space-y-4 my-6">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-semibold">
                <span className="font-extrabold text-[10px] bg-rose-200 text-rose-900 px-2.5 py-1 rounded uppercase tracking-wider block mb-2 w-max">Reason Given</span>
                "{viewReasonJob.cancellationReason || 'No reason provided.'}"
              </div>
              <div className="text-xs text-slate-600 font-semibold space-y-2 pl-1">
                <p>Cancelled By: <strong className="text-slate-900 capitalize">{viewReasonJob.cancelledBy || 'system'}</strong></p>
                {viewReasonJob.cancelledAt && (
                  <p>Cancelled On: <strong className="text-slate-900">{new Date(viewReasonJob.cancelledAt).toLocaleString()}</strong></p>
                )}
              </div>
            </div>
            <button
              onClick={() => setViewReasonJob(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md cursor-pointer border-none"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cancel Job Modal */}
      {cancelJobId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative text-slate-900 p-6 sm:p-8 space-y-6">
            <button 
              onClick={() => setCancelJobId(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-2 transition-all cursor-pointer border-none"
            >
              <X size={16} />
            </button>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Cancel Job Assignment</h3>
              <p className="text-slate-500 text-xs font-medium">Please let us know the reason for cancelling this job.</p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Cancellation</label>
              <textarea
                rows="4"
                placeholder="Describe your reason here..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 outline-none text-sm font-semibold focus:border-blue-600 transition-all resize-none"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setCancelJobId(null)} 
                disabled={submittingCancellation}
                className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={handleCancelJob} 
                disabled={submittingCancellation}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl transition-all flex justify-center items-center gap-2 text-xs uppercase tracking-wider shadow-md border-none cursor-pointer"
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

      {/* Withdrawal Request Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl text-slate-900 p-6 sm:p-8 space-y-6 relative">
            <button 
              onClick={() => setShowWithdrawModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-2 transition-all cursor-pointer border-none"
            >
              <X size={16} />
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                <Wallet size={24} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Withdraw Earnings</h3>
              <p className="text-slate-500 text-xs font-medium">Funds will be transferred directly to your bank account or UPI.</p>
            </div>

            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Withdrawal Amount (₹)</label>
                <input 
                  required 
                  type="number" 
                  min="500" 
                  max={profile?.walletBalance || 0}
                  value={withdrawForm.amount} 
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-slate-900 text-sm transition-all" 
                  placeholder="Minimum ₹500" 
                />
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">Available for withdrawal: ₹{(profile?.walletBalance || 0).toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Holder Name</label>
                <input 
                  required 
                  type="text" 
                  value={withdrawForm.accountName} 
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-slate-900 text-sm transition-all" 
                  placeholder="Name as in bank account" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
                  <input 
                    required 
                    type="text" 
                    value={withdrawForm.accountNumber} 
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })} 
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-slate-900 text-sm transition-all" 
                    placeholder="Bank Account Number" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">IFSC Code</label>
                  <input 
                    required 
                    type="text" 
                    value={withdrawForm.ifscCode} 
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, ifscCode: e.target.value.toUpperCase() })} 
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-slate-900 text-sm transition-all" 
                    placeholder="SBIN0012345" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">UPI ID (Optional)</label>
                <input 
                  type="text" 
                  value={withdrawForm.upiId} 
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-slate-900 text-sm transition-all" 
                  placeholder="username@okaxis" 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowWithdrawModal(false)} 
                  disabled={submittingWithdraw}
                  className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingWithdraw}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 text-xs uppercase tracking-wider shadow-md border-none cursor-pointer"
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

      {/* Quote Submission Modal */}
      {quoteModalJob && (() => {
        const service = globalServices.find(s => s.id === quoteModalJob.serviceId) || {};
        const serviceNameLower = (quoteModalJob.serviceName || '').toLowerCase();
        const categoryId = (serviceNameLower.includes('paint') || service.categoryId === 'painting') ? 'painting' : (service.categoryId || 'repair');
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl text-slate-900">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {quoteModalJob.quoteRevisions && quoteModalJob.quoteRevisions.length > 0
                      ? `Submit Quote Revision (V${quoteModalJob.quoteRevisions.length + 1})`
                      : 'Submit Final Quote'
                    }
                  </h3>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">Category: {categoryId}</p>
                </div>
                <button onClick={() => setQuoteModalJob(null)} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-full p-2 transition-all cursor-pointer"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmitQuote} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                
                {quoteModalJob.quoteRevisions && quoteModalJob.quoteRevisions.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                    ⚠️ Revision {quoteModalJob.quoteRevisions.length + 1} of 3. Explanation is mandatory.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Labor Cost (₹)</label>
                    <input required type="number" value={quoteForm.serviceCharge} onChange={(e) => setQuoteForm({...quoteForm, serviceCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 outline-none font-bold text-slate-900 text-sm" placeholder="e.g. 250" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parts Cost (₹)</label>
                    <input required type="number" value={quoteForm.sparePartsCost} onChange={(e) => setQuoteForm({...quoteForm, sparePartsCost: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 outline-none font-bold text-slate-900 text-sm" placeholder="e.g. 0" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Visiting / Transport Fee (₹)</label>
                  <input required type="number" value={quoteForm.transportCharge} onChange={(e) => setQuoteForm({...quoteForm, transportCharge: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 outline-none font-bold text-slate-900 text-sm" placeholder="e.g. 50" />
                </div>

                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                   <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Final Quote:</span>
                   <span className="text-xl font-black text-blue-900">
                     ₹{Number(quoteForm.serviceCharge || 0) + Number(quoteForm.sparePartsCost || 0) + Number(quoteForm.transportCharge || 0)}
                   </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Diagnosis / Explanation</label>
                  <textarea required value={quoteForm.quoteReason} onChange={(e) => setQuoteForm({...quoteForm, quoteReason: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 outline-none resize-none text-slate-900 text-xs font-semibold" rows="3" placeholder="Explain the required work scope..."></textarea>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider cursor-pointer border-none mt-2"
                >
                  Send Quote for Approval
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Decline Modal */}
      {declineJobId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl text-slate-900 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Decline Service Request</h3>
              <p className="text-xs text-slate-500 font-medium">Please select a reason for declining this request.</p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {[
                'Too far from my location',
                'Currently busy',
                'Service unavailable',
                'Outside service area',
                'Timing issue',
                'Other reason'
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedDeclineReason === reason
                      ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                  onClick={() => setSelectedDeclineReason(reason)}
                >
                  <input
                    type="radio"
                    name="declineReason"
                    checked={selectedDeclineReason === reason}
                    onChange={() => setSelectedDeclineReason(reason)}
                    className="accent-rose-600 cursor-pointer"
                  />
                  <span className="text-xs">{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeclineJobId(null);
                  setSelectedDeclineReason('');
                }}
                className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedDeclineReason || updatingJobs[declineJobId]}
                onClick={async () => {
                  const jobId = declineJobId;
                  setDeclineJobId(null);
                  await updateJobStatus(jobId, 'rejected', selectedDeclineReason);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl transition-all text-xs uppercase tracking-wider shadow-md border-none cursor-pointer flex justify-center items-center gap-2"
              >
                {updatingJobs[declineJobId] ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Dispatch Alert Overlay */}
      {activeAlertJob && (
        <DispatchOverlay
          job={activeAlertJob}
          onAccept={async () => {
            const jobId = activeAlertJob._id;
            setActiveAlertJob(null);
            stopAlarm();
            await updateJobStatus(jobId, 'accepted');
          }}
          onDecline={async (reason) => {
            const jobId = activeAlertJob._id;
            setActiveAlertJob(null);
            stopAlarm();
            setDeclineJobId(jobId);
          }}
        />
      )}

      {/* Toast Alerts Stack */}
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

export default TechnicianDashboard;
