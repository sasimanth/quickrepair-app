import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { globalServices } from '../data/services';
import { subscribeToPushNotifications } from '../services/pushNotification';
import { requestFcmPermission } from '../services/firebase';
import { Calendar, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, Plus, LayoutDashboard, Wrench, Settings, Briefcase, Star, User, ChevronRight, MessageSquare, Camera, UploadCloud, Loader2, Shield, ShieldCheck, ShieldAlert, Sparkles, IndianRupee, Wallet, Coins, ArrowUpRight, ArrowDownLeft, FileText, Bell, CreditCard, Banknote, HelpCircle, Truck, Home, Search, Eye, Zap, Maximize2, Hash, Layers, Paintbrush, Tv, X, RefreshCw, PhoneCall } from 'lucide-react';
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
  // Strip spaces, brackets, hyphens but preserve digits and plus sign exactly
  return phone.toString().replace(/[^\d+]/g, '');
};

const TechnicianDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const profileRef = useRef(null);
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
            // Find job status to change tab
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
    subscribeToPushNotifications(); // PWA background push notifications
    requestFcmPermission(); // FCM background push notifications
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

  // Register private user & tech room and sync on connection reconnects
  useEffect(() => {
    if (!profile?.userId) return;

    const registerSocket = () => {
      socket.emit('register_user', profile.userId);
      socket.emit('register_tech', profile.userId);
      fetchJobs(true); // Refetch jobs on reconnect
    };

    registerSocket();
    socket.on('connect', registerSocket);

    // Sync when tab gets focused/foregrounded on mobile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!socket.connected) {
          console.log('[Socket] Reconnecting socket client due to visibility change...');
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

    // Trigger sync on dashboard load/mount
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

        // Play noticeable sound only for important events (Quote Approval or Payment Completion)
        if (updatedJob.status === 'quote_approved' || updatedJob.paymentStatus === 'completed') {
          playNotificationSound('high');
        }
      }
      
      // If the alarm job is no longer assigned to us
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
      // Do not display toast/notification for messages sent by self or system status messages
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
        // Play subtle sound for customer message
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
        // Show NEW jobs at TOP
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
    // Keep permission state fresh
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    const chatId = params.get('chatId');
    const decline = params.get('decline') === 'true';
    const accept = params.get('accept') === 'true';

    if (jobs.length > 0) {
      if (chatId) {
        const foundJob = jobs.find(j => j._id === chatId);
        if (foundJob) {
          setChatBookingId(chatId);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (jobId) {
        const foundJob = jobs.find(j => j._id === jobId);
        if (foundJob) {
          if (decline) {
            setDeclineJobId(jobId);
          } else if (accept) {
            updateJobStatus(jobId, 'accepted');
          }
          if (['pending', 'assigned', 'queued'].includes(foundJob.status)) setJobTab('new');
          else if (['accepted', 'on_the_way', 'arrived', 'inspection_started', 'quote_approved', 'in_progress'].includes(foundJob.status)) setJobTab('active');
          else if (['quote_pending', 'quote_clarification', 'quote_rejected'].includes(foundJob.status)) setJobTab('quote_pending');
          else if (foundJob.status === 'completed') {
            setJobTab('completed');
            setExpandedCompletedJobs(prev => ({ ...prev, [jobId]: true }));
          } else if (['cancelled', 'rejected'].includes(foundJob.status)) setJobTab('cancelled');
          
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => {
            const element = document.getElementById(`job-card-${jobId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      }
    }
  }, [jobs, window.location.search]);

  useEffect(() => {
    if (!showNotifDropdown) return;
    const closeDropdown = () => setShowNotifDropdown(false);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, [showNotifDropdown]);

  const updateJobStatus = async (id, status, rejectionReason = '') => {
    if (activeAlertJob && activeAlertJob._id === id) {
      stopAlarm();
      setActiveAlertJob(null);
    }
    if (updatingJobs[id]) return;

    // Check if network is offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log(`[OfflineMode] Internet disconnected. Caching action: update status to '${status}' for Booking ${id}`);
      
      setJobs(prevJobs => prevJobs.map(job => job._id === id ? { ...job, status } : job));
      
      const queued = await queueOfflineAction({ bookingId: id, status, rejectionReason });
      if (queued) {
        showToast('⚠️ Offline Mode Activated', 'Connection lost. Status update cached locally and will sync once internet returns.', 'warning');
      } else {
        showToast('⚠️ Offline Queue Error', 'Failed to save offline action locally.', 'error');
      }
      return;
    }

    setJobs(prevJobs => prevJobs.map(job => job._id === id ? { ...job, status } : job));
    setUpdatingJobs(prev => ({ ...prev, [id]: true }));
    
    try {
      await api.put(`/bookings/${id}/status`, { status, rejectionReason });
      await fetchJobs(true); // Refetch profile metrics in real-time
    } catch (error) { 
      showToast('❌ Update Failed', `Failed to update status to ${status.replace(/_/g, ' ').toUpperCase()}`, 'error');
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
    
    // Compile uploaded images into a JSON string if any are present
    let quotePhotoVal = '';
    const activePhotos = {};
    if (uploadedImages.damagedPart) activePhotos.damagedPart = uploadedImages.damagedPart;
    if (uploadedImages.repairProof) activePhotos.repairProof = uploadedImages.repairProof;
    if (uploadedImages.completedWork) activePhotos.completedWork = uploadedImages.completedWork;
    
    if (Object.keys(activePhotos).length > 0) {
      quotePhotoVal = JSON.stringify(activePhotos);
    }

    // Optimistic update
    setJobs(prevJobs => prevJobs.map(job => job._id === jobId ? { 
      ...job, 
      status: 'quote_pending', 
      serviceCharge: sCharge,
      sparePartsCost: pCost,
      transportCharge: tCharge,
      finalQuote: finalPrice, 
      quoteReason: quoteForm.quoteReason,
      quotePhoto: quotePhotoVal
    } : job));
    
    setQuoteModalJob(null);
    setQuoteForm({ serviceCharge: '', sparePartsCost: '', transportCharge: '50', quoteReason: '', quotePhoto: '', detectedIssues: '' });
    setUploadedImages({ damagedPart: '', repairProof: '', completedWork: '' });
    setUpdatingJobs(prev => ({ ...prev, [jobId]: true }));
    
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

  const handleRespondClarification = async (bookingId) => {
    if (!clarificationResponse.trim()) return;
    setUpdatingJobs(prev => ({ ...prev, [bookingId]: true }));
    try {
      await api.put(`/bookings/${bookingId}/respond-quote`, { responseText: clarificationResponse });
      setClarificationResponse('');
      showToast('Response Sent 📢', 'Quote response sent back to customer.', 'success');
      fetchJobs();
    } catch (error) {
       const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
       alert(`Failed to respond: ${errorMsg}`);
       console.error(error);
    } finally {
       setUpdatingJobs(prev => ({ ...prev, [bookingId]: false }));
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans mt-4 sm:mt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10 animate-in fade-in duration-300">
        
        {/* Productivity Header & Profile Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full lg:w-auto">
              <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner relative shrink-0">
                {profile?.avatar || '🔧'}
                {profile?.isVerified && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-lg shadow border border-emerald-300">
                    <ShieldCheck size={10} className="stroke-[3]" />
                  </span>
                )}
              </div>
              
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{profile?.name || 'Technician'}</h1>
                  {profile?.isVerified ? (
                    <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Verified Partner</span>
                  ) : (
                    <span className="bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Pending Verification</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">Experience: {profile?.experience || 'N/A'} • Skills: {profile?.skills?.join(', ') || 'General Repair'}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Rating: <strong className="text-amber-600">★ {profile?.rating || '5.0'}</strong></span>
                  <span className="border-l border-slate-200 pl-2">Jobs: <strong className="text-blue-600">{profile?.completedJobsCount || '0'}</strong></span>
                  <span className="border-l border-slate-200 pl-2">Areas: <strong className="text-slate-800">{profile?.address || 'Local'}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-center sm:justify-start lg:justify-end">
              {profile?.isProfileComplete && (() => {
                const status = profile?.currentStatus || (profile?.isOnline ? 'online' : 'offline');
                let btnClass = 'bg-slate-100 border-slate-200 text-slate-600';
                let dotClass = 'bg-slate-400';
                let label = 'Offline (Hidden)';
                
                if (status === 'online' || status === 'available') {
                  btnClass = 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
                  dotClass = 'bg-emerald-500 animate-pulse';
                  label = 'Online & Active';
                } else if (status === 'on_job') {
                  btnClass = 'bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed';
                  dotClass = 'bg-blue-600 animate-ping';
                  label = 'On Active Job';
                } else if (status === 'busy') {
                  btnClass = 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
                  dotClass = 'bg-amber-500 animate-pulse';
                  label = 'Busy';
                }

                return (
                  <button
                    onClick={status === 'on_job' ? null : toggleOnlineStatus}
                    disabled={status === 'on_job'}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider border transition-all cursor-pointer shadow-sm ${btnClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
                    <span>{label}</span>
                  </button>
                );
              })()}

              <button
                onClick={() => setShowSettings(true)}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-extrabold px-4.5 py-3 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer outline-none shadow-sm"
              >
                <Settings size={14} /> Settings
              </button>
              
              <button
                onClick={() => fetchJobs(true)}
                disabled={refreshing}
                className="bg-indigo-650 hover:bg-indigo-550 text-white font-extrabold px-4.5 py-3 rounded-xl transition-all text-xs uppercase tracking-widest flex items-center gap-1.5 cursor-pointer outline-none disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Onboarding Section */}
        {!loading && profile && !profile.isProfileComplete && (
          <div className="bg-[#111827]/60 border border-indigo-500/20 rounded-[2rem] p-8 text-center space-y-4 shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 bg-indigo-650/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner text-indigo-400">
              <MapPin size={32} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Activate Your Profile</h2>
            <p className="text-slate-400 max-w-md mx-auto text-xs sm:text-sm font-semibold">To start receiving repair requests from local customers, we need to verify your local service area using your device's location.</p>
            <button 
              onClick={handleSetupProfile}
              disabled={setupLoading}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-black py-4 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-xs uppercase tracking-widest cursor-pointer border-none outline-none"
            >
              {setupLoading ? <Loader2 className="animate-spin" size={16}/> : <MapPin size={16}/>}
              <span>{setupLoading ? 'Locating...' : 'Share Location & Go Active'}</span>
            </button>
          </div>
        )}

        {/* Notification Permission Banner */}
        {!loading && profile?.isProfileComplete && notifPermission !== 'granted' && (
          <div className={`p-6 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-md animate-in fade-in duration-300 ${
            notifPermission === 'denied' 
              ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' 
              : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300'
          }`}>
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className={`p-3 rounded-2xl shrink-0 ${
                notifPermission === 'denied' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
              }`}>
                <Bell size={24} className={notifPermission === 'default' ? 'animate-bounce' : ''} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold tracking-tight">
                  {notifPermission === 'denied' ? 'Action Required: Notifications Blocked' : 'Enable Real-Time Job Alerts'}
                </h3>
                <p className="text-xs font-semibold max-w-xl leading-relaxed opacity-80">
                  {notifPermission === 'denied' 
                    ? 'You have disabled notifications for Fixvo. To receive sound, vibrate, and background alerts for new jobs, click the lock/settings icon in your browser address bar and set Notifications to "Allow".'
                    : 'Get instant alerts on your lock screen for new bookings, customer messages, and payments, even when using other apps or outside the website.'}
                </p>
              </div>
            </div>
            {notifPermission !== 'denied' && (
              <button
                onClick={handleEnableNotifications}
                className="w-full md:w-auto px-6 py-3.5 bg-indigo-650 hover:bg-indigo-550 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all shrink-0 active:scale-95 cursor-pointer border-none outline-none"
              >
                Enable Notifications
              </button>
            )}
          </div>
        )}

        {/* Verification Banner */}
        {!loading && profile?.isProfileComplete && !profile?.isVerified && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center shrink-0 shadow-inner text-amber-400">
               <ShieldAlert size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-lg font-black text-white">Identity Not Verified</h2>
              <p className="text-slate-400 mt-1 max-w-2xl text-xs sm:text-sm font-semibold">Verified technicians receive 300% more direct repair requests. Complete your background check securely to earn your verified badge and unlock premier jobs.</p>
            </div>
            <button 
              onClick={() => setShowVerification(true)}
              className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3.5 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 w-full md:w-auto text-xs uppercase tracking-widest border-none outline-none cursor-pointer"
            >
              Get Verified Now
            </button>
          </div>
        )}

        {/* Earnings & Withdrawal Panel */}
        {!loading && profile?.isProfileComplete && (
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950/20 to-slate-900/20 border border-indigo-500/20 p-6 sm:p-8 shadow-[0_0_50px_rgba(99,102,241,0.08)] backdrop-blur-xl"
            >
              <div className="absolute top-[-30%] right-[-10%] w-[35%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.1),_transparent_65%)] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-gradient-to-br from-indigo-950/60 to-slate-900 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <Wallet size={28} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] bg-indigo-950/60 text-indigo-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/20 select-none">
                      Available Balance
                    </span>
                    <p className="text-3xl sm:text-4xl font-black text-white mt-2 tracking-tight">₹{(profile?.walletBalance || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto shrink-0 justify-between sm:justify-start">
                  {profile?.pendingWithdrawal > 0 && (
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      Pending Payout: ₹{profile.pendingWithdrawal}
                    </span>
                  )}
                  <button 
                    onClick={handleOpenWithdrawModal}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-400 hover:via-indigo-400 hover:to-purple-500 text-white font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 outline-none cursor-pointer border-none shadow-lg active:scale-[0.98] transform hover:-translate-y-0.5"
                  >
                    Request Payout <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Collapsible Trigger */}
            <div className="flex justify-center">
              <button 
                type="button"
                onClick={() => setShowEarningsDetails(!showEarningsDetails)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-white/5 hover:border-slate-800 text-slate-400 hover:text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider rounded-full shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer outline-none"
              >
                <span>{showEarningsDetails ? "Hide Earnings Details" : "View Earnings Breakdown"}</span>
                <ChevronRight 
                  size={14} 
                  className={`transform transition-transform duration-300 ${showEarningsDetails ? 'rotate-270' : 'rotate-90'}`} 
                />
              </button>
            </div>

            {/* Collapsible Earnings Details Grid */}
            <motion.div
              initial={false}
              animate={{ height: showEarningsDetails ? "auto" : 0, opacity: showEarningsDetails ? 1 : 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-4 mt-2">
                {[
                  { label: 'Gross Earnings', value: profile?.grossEarnings || 0, desc: 'Completed service volume', icon: Coins, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/20', gradient: 'from-indigo-500/5 to-transparent' },
                  { label: 'Platform Fee (10%)', value: profile?.platformFee || 0, desc: 'Platform service commission rate', icon: ArrowDownLeft, color: 'text-rose-400 bg-rose-950/40 border-rose-900/20', gradient: 'from-rose-500/5 to-transparent' },
                  { label: 'Net Earnings', value: profile?.netEarnings || 0, desc: 'Your 90% revenue share', icon: CheckCircle, color: 'text-teal-400 bg-teal-950/40 border-teal-900/20', gradient: 'from-teal-500/5 to-transparent' },
                  { label: 'Cash Collected', value: profile?.cashCollected || 0, desc: 'Cash kept physically by you', icon: Banknote, color: 'text-amber-400 bg-amber-950/40 border-amber-900/20', gradient: 'from-amber-500/5 to-transparent' },
                  { label: 'Online Payments', value: profile?.onlinePayments || 0, desc: 'Processed via payment gateways', icon: CreditCard, color: 'text-sky-400 bg-sky-950/40 border-sky-900/20', gradient: 'from-sky-500/5 to-transparent' },
                  { label: 'Platform Due', value: profile?.platformDue || 0, desc: 'Fee owed from cash bookings', icon: AlertCircle, color: 'text-orange-400 bg-orange-950/40 border-orange-900/20', gradient: 'from-orange-500/5 to-transparent' },
                  { label: 'Pending Clearance', value: profile?.pendingClearance || 0, desc: 'Awaiting customer checkout', icon: Clock, color: 'text-yellow-400 bg-yellow-950/40 border-yellow-900/20', gradient: 'from-yellow-500/5 to-transparent' },
                  { label: 'Withdrawn Amount', value: profile?.withdrawn || 0, desc: 'Paid out to your bank account', icon: FileText, color: 'text-slate-400 bg-slate-800/40 border-slate-700/20', gradient: 'from-slate-500/5 to-transparent' }
                ].map((card, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/5 shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-40 pointer-events-none`}></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className={`p-2 rounded-xl border ${card.color} flex items-center justify-center shrink-0`}>
                        <card.icon size={16} className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4 relative z-10 text-left">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">{card.label}</p>
                      <p className="text-base sm:text-lg font-black text-white mt-1">₹{card.value.toFixed(2)}</p>
                      <p className="text-[8px] sm:text-[9px] text-slate-400/80 font-medium mt-1 line-clamp-2 select-none leading-normal">{card.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Jobs Segmented Columns/Tabs */}
        {!loading && profile?.isProfileComplete && (
          <div className="space-y-6">
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x snap-mandatory border-b border-white/5">
              {[
                { id: 'new', label: 'New Requests', count: jobs.filter(j => ['pending', 'assigned', 'queued'].includes(j.status)).length },
                { id: 'active', label: 'Active Jobs', count: jobs.filter(j => ['accepted', 'on_the_way', 'arrived', 'inspection_started', 'quote_approved', 'in_progress'].includes(j.status)).length },
                { id: 'quote_pending', label: 'Quote Proposals', count: jobs.filter(j => ['quote_pending', 'quote_clarification', 'quote_rejected'].includes(j.status)).length },
                { id: 'completed', label: 'Completed History', count: jobs.filter(j => j.status === 'completed').length },
                { id: 'cancelled', label: 'Cancelled Jobs', count: jobs.filter(j => ['cancelled', 'rejected'].includes(j.status)).length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setJobTab(tab.id)}
                  className={`px-5 py-3.5 rounded-t-2xl text-xs font-black transition-all shrink-0 snap-center outline-none border-b-2 cursor-pointer flex items-center gap-2 bg-transparent ${
                    jobTab === tab.id 
                      ? 'border-indigo-500 text-indigo-400 font-extrabold' 
                      : 'border-transparent text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    jobTab === tab.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-900 text-slate-500'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>

            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 bg-slate-900/10 border border-white/5 rounded-[2rem] text-center animate-in fade-in duration-300 shadow-inner">
                <div className="relative w-20 h-20 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-inner text-slate-500">
                  <PackageSearch size={36} />
                  {jobTab === 'new' && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">No Jobs Found</h3>
                <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs mt-2 leading-relaxed">
                  There are no repair requests in the <strong className="text-indigo-400 capitalize">"{jobTab.replace(/_/g, ' ')}"</strong> section right now.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredJobs.map((job) => {
                  const isCompleted = job.status === 'completed';
                  const isExpanded = expandedCompletedJobs[job._id];
                  
                  if (isCompleted && !isExpanded) {
                    return (
                      <div 
                        key={job._id} 
                        id={`job-card-${job._id}`} 
                        className="relative bg-gradient-to-r from-slate-900/60 to-[#111827]/60 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-hidden pl-8 shadow-xl"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-950 text-slate-400 border border-white/5 text-[9px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider">
                              {job.serviceName || 'Device Repair'}
                            </span>
                            {getStatusBadge(job.status)}
                          </div>
                          <h4 className="text-xl font-black text-white tracking-tight">
                            Earned: ₹{job.finalTechnicianEarning ? job.finalTechnicianEarning.toFixed(2) : (((job.finalQuote || job.amount || job.serviceId?.price || 0) - (job.membershipDiscount || 0)) * 0.9).toFixed(2)} 
                            <span className="text-xs font-semibold text-slate-500 ml-1.5 border-l border-white/10 pl-1.5">Gross Invoice: ₹{job.finalQuote || job.serviceId?.price || 0}</span>
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Completed: {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Date Pending'} • Customer: {job.name || 'Guest User'}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCompletedExpand(job._id)}
                          className="shrink-0 text-xs text-indigo-400 font-extrabold bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer outline-none"
                        >
                          View Details
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={job._id} 
                      id={`job-card-${job._id}`} 
                      className="relative bg-gradient-to-br from-slate-900/60 to-[#111827]/60 border border-white/5 rounded-[2rem] shadow-xl overflow-hidden group"
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        ['pending','assigned','queued'].includes(job.status) 
                          ? 'bg-amber-500' 
                          : ['accepted', 'quote_approved', 'on_the_way', 'arrived', 'inspection_started', 'in_progress'].includes(job.status) 
                          ? 'bg-indigo-500' 
                          : job.status === 'completed' 
                          ? 'bg-emerald-500' 
                          : 'bg-rose-500'
                      }`}></div>
                      
                      <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-6 pl-8 sm:pl-10">
                        <div className="flex-1 space-y-6">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="bg-slate-950 text-slate-300 border border-white/5 text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                              {job.serviceId?.name || job.serviceName || 'Device Repair'}
                            </span>
                            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm border ${
                              job.serviceOption === 'inspection' 
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {job.serviceOption === 'inspection' ? 'Inspection Visit' : 'Direct Repair'}
                            </span>
                            {getStatusBadge(job.status)}
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold ml-auto lg:ml-0">
                              <Calendar size={14} />
                              {job.date ? new Date(job.date).toLocaleDateString() : 'TBD'}
                            </div>
                          </div>
                          
                          <h3 className="text-2xl sm:text-3xl font-black text-white inline-flex items-center gap-2">
                            <span className="text-indigo-400">₹</span>{job.finalQuote || job.serviceId?.price || 0} 
                            <span className="text-xs text-slate-500 font-bold ml-2">(+₹{job.transportCharge || 0} Transp.)</span>
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 border border-white/5 rounded-2xl p-5">
                            <div className="space-y-4">
                              <div className="flex gap-3">
                                <Smartphone className="text-indigo-400 mt-0.5 shrink-0" size={18} />
                                <div>
                                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Device</p>
                                  <p className="font-bold text-slate-200 text-xs sm:text-sm">{job.deviceType || 'Device'}</p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <MapPin className="text-emerald-400 mt-0.5 shrink-0" size={18} />
                                <div>
                                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Location</p>
                                  <p className="font-bold text-slate-200 text-xs sm:text-sm leading-relaxed">{job.location}</p>
                                  {(job.serviceLocation && job.serviceLocation !== 'on-site') && (
                                     <span className="inline-block mt-1 text-[8px] font-extrabold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                                       {job.serviceLocation === 'gate' ? 'Gate Meetup' : 'Off-site Pickup Required'}
                                     </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-4">
                              <AlertCircle className="text-rose-450 mt-0.5 shrink-0" size={18} />
                              <div>
                                <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Issue Description</p>
                                <p className="text-slate-300 italic text-xs leading-relaxed">"{job.problemDescription}"</p>
                                {job.unknownProblem && (
                                   <span className="inline-flex items-center gap-1 mt-1 text-[8px] font-extrabold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/25 uppercase tracking-wider">
                                     <HelpCircle size={10}/> Diagnosis Required
                                   </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {(job.imageUrl || job.mediaUrl) && (
                            <div className="flex items-start gap-4 p-5 bg-slate-950/20 border border-white/5 rounded-2xl">
                              <div className="w-full">
                                <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                                  <Camera size={14} className="text-indigo-400" /> Customer Media Proof
                                </p>
                                <div className="relative rounded-xl overflow-hidden border border-white/5 shadow-inner max-w-xs sm:max-w-sm">
                                  {job.mediaType?.startsWith('video') ? (
                                    <video src={job.mediaUrl} controls className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-500" />
                                  ) : (
                                    <img src={job.mediaUrl || job.imageUrl} alt="Damage evidence" className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 text-slate-400 bg-slate-950/40 border border-white/5 rounded-full px-4 py-2 w-max text-xs font-semibold">
                              <User size={14} />
                              <span>Customer: {job.userEmail ? job.userEmail.split('@')[0] : 'Guest User'}</span>
                            </div>
                            
                            {job.paymentMethod && (
                              <div className="flex items-center gap-2 text-slate-400 bg-slate-950/40 border border-white/5 rounded-full px-4 py-2 w-max text-xs font-semibold">
                                <CreditCard size={14} />
                                <span className="uppercase tracking-wider">Payment: {job.paymentMethod}</span>
                              </div>
                            )}
                          </div>

                          {job.lastMessage && (
                            <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex items-start gap-2.5 max-w-md">
                              <MessageSquare size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                              <div className="text-xs text-slate-300 truncate">
                                <span className="font-extrabold text-white">{job.lastMessage.senderId === profile?.userId ? 'You: ' : ''}</span>
                                {job.lastMessage.text}
                              </div>
                            </div>
                          )}

                          {job.status === 'completed' && (
                            <div className="space-y-3 bg-slate-950/40 border border-white/5 rounded-2xl p-5 mt-4 max-w-xl">
                              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                                <FileText size={16} className="text-indigo-400" /> Billing & Earning Breakdown
                              </h4>
                              <div className="overflow-hidden rounded-xl border border-white/5 bg-slate-950 shadow-inner">
                                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                                  <thead>
                                    <tr className="bg-white/5 text-slate-400 font-bold border-b border-white/5">
                                      <th className="px-4 py-2.5">Billing Item</th>
                                      <th className="px-4 py-2.5 text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 text-slate-300 font-semibold">
                                    <tr>
                                      <td className="px-4 py-2.5 text-slate-500">Gross Invoice (Billed to Customer)</td>
                                      <td className="px-4 py-2.5 text-right font-extrabold text-white">₹{job.finalQuote || job.amount || 0}</td>
                                    </tr>
                                    {job.membershipDiscount > 0 && (
                                      <tr className="text-amber-400 bg-amber-500/5">
                                        <td className="px-4 py-2.5 flex items-center gap-1">
                                          <Sparkles size={12} className="text-amber-400" /> 
                                          Plus Member Discount ({job.discountPercentage || 5}%)
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-extrabold">-₹{job.membershipDiscount}</td>
                                      </tr>
                                    )}
                                    <tr className="text-rose-450 bg-rose-500/5">
                                      <td className="px-4 py-2.5">Platform Commission Deducted ({(() => {
                                        const grossInvoice = job.finalQuote || job.amount || 0;
                                        const memberDiscount = job.membershipDiscount || 0;
                                        const netPaidAmount = grossInvoice - memberDiscount;
                                        const commVal = typeof job.platformCommission === 'number' ? job.platformCommission : (netPaidAmount * 0.10);
                                        return netPaidAmount > 0 ? Math.round((commVal / netPaidAmount) * 100) : 10;
                                      })()}%)</td>
                                      <td className="px-4 py-2.5 text-right font-extrabold">-₹{(typeof job.platformCommission === 'number' ? job.platformCommission : (((job.finalQuote || job.amount || 0) - (job.membershipDiscount || 0)) * 0.1)).toFixed(2)}</td>
                                    </tr>
                                    <tr className="bg-emerald-500/10 text-emerald-400 font-bold border-t border-white/10">
                                      <td className="px-4 py-2.5">Your Net Earnings ({(() => {
                                        const grossInvoice = job.finalQuote || job.amount || 0;
                                        const memberDiscount = job.membershipDiscount || 0;
                                        const netPaidAmount = grossInvoice - memberDiscount;
                                        const commVal = typeof job.platformCommission === 'number' ? job.platformCommission : (netPaidAmount * 0.10);
                                        const commPct = netPaidAmount > 0 ? Math.round((commVal / netPaidAmount) * 100) : 10;
                                        return 100 - commPct;
                                      })()}%)</td>
                                      <td className="px-4 py-2.5 text-right text-sm">₹{(typeof job.finalTechnicianEarning === 'number' ? job.finalTechnicianEarning : (((job.finalQuote || job.amount || 0) - (job.membershipDiscount || 0)) * 0.9)).toFixed(2)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-slate-500 font-extrabold px-1 uppercase tracking-widest">
                                <span>Payment Mode: <strong className="text-slate-300">{job.paymentMethod || 'Cash'}</strong></span>
                                <span>Status: <strong className={job.paymentStatus === 'completed' ? 'text-emerald-400' : 'text-amber-400'}>{job.paymentStatus === 'completed' ? 'Paid' : (job.paymentMethod === 'cash' ? 'Cash Payment Pending' : 'Awaiting Payment')}</strong></span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Workflow Action Buttons Column */}
                        <div className="flex flex-col gap-3 min-w-[200px] justify-center border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-6 shrink-0">
                          {['pending', 'assigned'].includes(job.status) && (
                            <>
                              <button
                                disabled={updatingJobs[job._id]}
                                onClick={() => updateJobStatus(job._id, 'accepted')}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-black py-4 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer border-none outline-none disabled:opacity-50"
                              >
                                {updatingJobs[job._id] ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Accept Request</>}
                              </button>
                              <button
                                disabled={updatingJobs[job._id]}
                                onClick={() => setDeclineJobId(job._id)}
                                className="w-full bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer outline-none disabled:opacity-50"
                              >
                                {updatingJobs[job._id] ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> Decline</>}
                              </button>
                            </>
                          )}
                          
                          {job.status === 'queued' && (
                             <div className="flex flex-col text-center items-center justify-center gap-2 p-4 rounded-xl font-bold border border-amber-500/20 bg-amber-500/5 text-amber-400 shadow-sm w-full">
                               <Clock size={16} /> 
                               <span className="text-xs uppercase tracking-wider">In Your Queue</span>
                               <span className="text-[10px] font-semibold text-slate-500">Finish current job first</span>
                             </div>
                          )}
                          
                          {job.status === 'accepted' && (
                              <button
                                disabled={updatingJobs[job._id]}
                                onClick={() => updateJobStatus(job._id, 'on_the_way')}
                                className="w-full bg-orange-650 hover:bg-orange-500 text-white font-black py-4 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border-none outline-none cursor-pointer disabled:opacity-50"
                              >
                                {updatingJobs[job._id] ? <Loader2 size={16} className="animate-spin" /> : <><Truck size={16} /> Start Route</>}
                              </button>
                          )}
                          
                          {job.status === 'on_the_way' && (
                              <button
                                disabled={updatingJobs[job._id]}
                                onClick={() => updateJobStatus(job._id, 'arrived')}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border-none outline-none cursor-pointer disabled:opacity-50"
                              >
                                {updatingJobs[job._id] ? <Loader2 size={16} className="animate-spin" /> : <><MapPin size={16} /> Confirm Arrival</>}
                              </button>
                          )}
                          
                          {job.status === 'arrived' && (
                              <button
                                disabled={updatingJobs[job._id]}
                                onClick={() => updateJobStatus(job._id, 'inspection_started')}
                                className="w-full bg-indigo-650 hover:bg-indigo-550 text-white font-black py-4 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border-none outline-none cursor-pointer disabled:opacity-50"
                              >
                                {updatingJobs[job._id] ? <Loader2 size={16} className="animate-spin" /> : <><Wrench size={16} /> Start Inspection</>}
                              </button>
                          )}
                          
                          {job.status === 'inspection_started' && (
                              <button
                                onClick={() => handleOpenQuoteModal(job)}
                                className="w-full bg-indigo-650 hover:bg-indigo-500 text-white font-black py-4 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border-none outline-none cursor-pointer"
                              >
                                <Wrench size={16} /> Submit Final Quote
                              </button>
                          )}
                          
                          {job.status === 'quote_rejected' && (
                              <div className="w-full space-y-2.5">
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-350 text-[10px] font-semibold leading-relaxed">
                                  ⚠️ Customer rejected quote proposal. Submit a revised quote to resume work.
                                </div>
                                <button
                                  onClick={() => handleOpenQuoteModal(job)}
                                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border-none outline-none cursor-pointer"
                                >
                                  <Wrench size={16} /> Revise Quote
                                </button>
                              </div>
                          )}
                          
                          {job.status === 'quote_clarification' && (
                              <div className="w-full bg-slate-950 border border-purple-500/20 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-purple-400 font-extrabold text-[10px] uppercase tracking-wider">
                                  <span className="flex h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping"></span>
                                  <span>📢 Clarification Needed</span>
                                </div>
                                {job.quoteRevisions && job.quoteRevisions.length > 0 && (
                                  <p className="text-slate-400 text-xs italic bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                                    "{job.quoteRevisions[job.quoteRevisions.length - 1].clarificationText}"
                                  </p>
                                )}
                                <div className="space-y-2">
                                  <textarea
                                    value={clarificationResponse}
                                    onChange={(e) => setClarificationResponse(e.target.value)}
                                    placeholder="Explain quote breakdown..."
                                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl outline-none text-white text-xs focus:border-indigo-500 transition-all resize-none font-semibold"
                                    rows={2}
                                  />
                                  <button
                                    disabled={updatingJobs[job._id] || !clarificationResponse.trim()}
                                    onClick={() => handleRespondClarification(job._id)}
                                    className="w-full bg-purple-650 hover:bg-purple-550 disabled:bg-slate-850 text-white disabled:text-slate-500 font-black py-2 rounded-xl text-xs transition-all flex justify-center items-center gap-2 border-none cursor-pointer"
                                  >
                                    {updatingJobs[job._id] ? <Loader2 size={12} className="animate-spin"/> : 'Send Response'}
                                  </button>
                                </div>
                              </div>
                          )}
                          
                          {job.status === 'quote_approved' && (
                              <button
                                disabled={updatingJobs[job._id]}
                                onClick={() => updateJobStatus(job._id, 'in_progress')}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border-none outline-none cursor-pointer disabled:opacity-50"
                              >
                                {updatingJobs[job._id] ? <Loader2 size={16} className="animate-spin" /> : <><Wrench size={16} /> Start Repair Work</>}
                              </button>
                          )}
                          
                          {job.status === 'in_progress' && (
                              <button
                                disabled={updatingJobs[job._id]}
                                onClick={() => updateJobStatus(job._id, 'completed')}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border-none outline-none cursor-pointer disabled:opacity-50"
                              >
                                {updatingJobs[job._id] ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Complete Job</>}
                              </button>
                          )}
                          
                          {['accepted', 'quote_approved', 'on_the_way', 'arrived', 'inspection_started', 'quote_pending', 'quote_clarification', 'quote_rejected', 'in_progress'].includes(job.status) && (
                              <div className="space-y-2 w-full">
                                <div className="flex gap-2">
                                  {(job.customerPhone || job.phone) && (
                                    <a 
                                      href={`tel:${formatPhoneLink(job.customerPhone || job.phone)}`} 
                                      className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 transform hover:-translate-y-0.5 text-xs text-center"
                                    >
                                      <PhoneCall size={16} /> Call
                                    </a>
                                  )}
                                  <button
                                    onClick={() => setChatBookingId(job._id)}
                                    className="relative flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 transform hover:-translate-y-0.5 text-xs cursor-pointer"
                                    type="button"
                                  >
                                    <MessageSquare size={16} /> Chat
                                    {job.unreadCount > 0 && (
                                      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full text-[10px] font-black w-5 h-5 flex items-center justify-center border-2 border-slate-950 animate-pulse shadow-md">
                                        {job.unreadCount}
                                      </span>
                                    )}
                                  </button>
                                </div>
                                <button
                                  onClick={() => setCancelJobId(job._id)}
                                  className="w-full bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/25 text-rose-455 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer outline-none"
                                  type="button"
                                >
                                  <XCircle size={14} /> Cancel Job
                                </button>
                              </div>
                          )}

                          {job.status === 'quote_pending' && (
                             <div className="flex items-center justify-center gap-2 p-4 rounded-xl font-bold border border-blue-500/20 bg-blue-500/5 text-blue-400 shadow-sm w-full text-center">
                               <Clock size={16} /> 
                               <span className="text-xs uppercase tracking-wider">Awaiting Approval</span>
                             </div>
                          )}

                          {job.status === 'completed' && (
                             <div className="space-y-3 w-full">
                               <div className={`flex items-center justify-center gap-1.5 p-4 rounded-xl font-black text-xs uppercase border tracking-wider ${
                                 job.paymentStatus === 'completed' 
                                   ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-400' 
                                   : 'bg-amber-500/5 border-amber-500/25 text-amber-400'
                               }`}>
                                 {job.paymentStatus === 'completed' 
                                   ? <><CheckCircle size={16} /> Paid In Full</> 
                                   : <><Clock size={16} /> {job.paymentMethod === 'cash' ? 'Cash Pending' : 'Awaiting Online Pay'}</>
                                 }
                               </div>
                               {job.paymentStatus !== 'completed' && job.paymentMethod === 'cash' && (
                                 <button
                                   onClick={async () => {
                                     try {
                                       await api.put(`/bookings/${job._id}/pay`, { paymentMethod: 'cash' });
                                       showToast("Success", "Cash payment confirmed!", "success");
                                       fetchJobs();
                                     } catch (err) {
                                       console.error("Error confirming cash payment:", err);
                                       showToast("Error", "Could not confirm cash payment. Please try again.", "error");
                                     }
                                   }}
                                   className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
                                 >
                                   <CheckCircle size={16} /> Confirm Cash Received
                                 </button>
                               )}
                               <button
                                 onClick={() => setChatBookingId(job._id)}
                                 className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-355 font-extrabold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                               >
                                 <MessageSquare size={16} /> Chat History
                               </button>
                             </div>
                          )}

                          {['cancelled', 'rejected'].includes(job.status) && (
                             <div className="space-y-3 w-full">
                               <div className="flex items-center justify-center gap-1.5 p-4 rounded-xl font-black text-xs uppercase border tracking-wider bg-rose-500/5 text-rose-455 border-rose-500/20">
                                 <XCircle size={16} /> 
                                 <span>{job.status === 'cancelled' ? 'Cancelled' : 'Rejected'}</span>
                               </div>
                               <button
                                 onClick={() => setViewReasonJob(job)}
                                 className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-355 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                               >
                                 <FileText size={16} /> View Reason
                               </button>
                             </div>
                          )}

                          {isCompleted && (
                            <button
                              onClick={() => toggleCompletedExpand(job._id)}
                              className="w-full mt-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              Hide Details
                            </button>
                          )}

                          {job.status === 'completed' && reviews.some(r => r.bookingId === job._id) && (
                            <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                              <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star 
                                    key={star} 
                                    size={12} 
                                    className={star <= reviews.find(r => r.bookingId === job._id).rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700 fill-slate-800'} 
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-slate-300 italic leading-relaxed">"{reviews.find(r => r.bookingId === job._id).comment || 'No comment provided.'}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Payout & Withdrawal History Section */}
        {!loading && profile?.isProfileComplete && (
          <div className="bg-gradient-to-br from-slate-900/60 to-[#111827]/60 border border-white/5 p-6 sm:p-8 rounded-[2rem] shadow-2xl mt-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl"><FileText size={20} /></div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Payout & Withdrawal History</h3>
                  <p className="text-xs text-slate-400 font-medium">Track your bank transfers and payout request status</p>
                </div>
              </div>
            </div>

            {!profile.withdrawals || profile.withdrawals.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/40 border border-dashed border-white/5 rounded-2xl">
                <Coins size={36} className="text-slate-600 mx-auto mb-2 opacity-60" />
                <p className="text-xs sm:text-sm font-bold text-slate-500">No withdrawal requests found.</p>
                <p className="text-[10px] text-slate-600 mt-1 font-semibold">Submit your first request once you have at least ₹500 in earnings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5 shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
                      <th className="px-6 py-4">Request Date</th>
                      <th className="px-6 py-4">Bank Details</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Transaction ID / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs sm:text-sm font-semibold text-slate-300">
                    {profile.withdrawals.map((req) => (
                      <tr key={req._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-white">{req.bankDetails?.accountName}</p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            {req.bankDetails?.accountNumber.slice(0, 4)}...{req.bankDetails?.accountNumber.slice(-4)} ({req.bankDetails?.ifscCode})
                          </p>
                          {req.bankDetails?.upiId && (
                            <p className="text-[10px] text-indigo-400 font-bold mt-0.5">UPI: {req.bankDetails?.upiId}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white font-black text-base">
                          ₹{req.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            req.status === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : req.status === 'approved'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                              : req.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              req.status === 'paid' ? 'bg-emerald-500' : req.status === 'approved' ? 'bg-blue-500' : req.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            <span>{req.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {req.status === 'paid' ? (
                            <div>
                              <p className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-white/5 px-2 py-0.5 rounded w-max">{req.transactionId || 'TXN_N/A'}</p>
                              {req.adminNotes && <p className="text-[9px] text-slate-500 font-medium mt-1">{req.adminNotes}</p>}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 font-semibold italic">{req.adminNotes || 'Awaiting admin processing...'}</p>
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

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-44 bg-slate-900 border border-white/5 rounded-3xl animate-pulse"></div>
              <div className="h-44 bg-slate-900 border border-white/5 rounded-3xl animate-pulse"></div>
              <div className="h-44 bg-slate-900 border border-white/5 rounded-3xl animate-pulse"></div>
            </div>
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 h-96 animate-pulse"></div>
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
            showToast("Settings Updated ✅", "Settings updated successfully", "success");
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
          <div className="bg-[#111827] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-white">
            <h3 className="text-xl font-bold text-white mb-2">Cancellation Details</h3>
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
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all cursor-pointer border-none outline-none"
            >
              <X size={16} />
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
                className="flex-1 border border-white/10 hover:bg-white/5 text-slate-350 font-bold py-3 rounded-xl transition-all text-xs sm:text-sm uppercase tracking-wider outline-none disabled:opacity-50 cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={handleCancelJob} 
                disabled={submittingCancellation}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all flex justify-center items-center gap-2 text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-[0.98] outline-none cursor-pointer border-none"
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
              <X size={16} />
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
                  className="flex-1 border border-white/10 hover:bg-white/5 text-slate-350 font-bold py-3.5 rounded-xl transition-all text-xs sm:text-sm uppercase tracking-wider outline-none disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingWithdraw}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-400 hover:to-teal-500 text-white font-black py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] outline-none cursor-pointer border-none"
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
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    {quoteModalJob.quoteRevisions && quoteModalJob.quoteRevisions.length > 0
                      ? `Submit Quote Revision (V${quoteModalJob.quoteRevisions.length + 1})`
                      : 'Submit Final Quote'
                    }
                  </h3>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Category: {categoryId}</p>
                </div>
                <button onClick={() => setQuoteModalJob(null)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all hover:rotate-95"><XCircle size={18} /></button>
              </div>
              <form onSubmit={handleSubmitQuote} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                
                {quoteModalJob.quoteRevisions && quoteModalJob.quoteRevisions.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-300 text-xs font-semibold animate-pulse">
                    ⚠️ Revision {quoteModalJob.quoteRevisions.length + 1} of 3. Explanation is mandatory.
                  </div>
                )}

                {quoteModalJob.quoteRevisions && quoteModalJob.quoteRevisions.length >= 3 && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold">
                    ❌ Maximum revision count (3) reached. You cannot revise the quote further.
                  </div>
                )}

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

                <button 
                  type="submit" 
                  disabled={quoteModalJob.quoteRevisions && quoteModalJob.quoteRevisions.length >= 3}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-black py-4 rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest outline-none active:scale-[0.98] mt-4 cursor-pointer"
                >
                  {quoteModalJob.quoteRevisions && quoteModalJob.quoteRevisions.length >= 3
                    ? 'Maximum Revisions Reached'
                    : 'Send Quote for Approval'
                  }
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Urgent Alarm/Alert Modal (Takeover Dispatch Overlay) */}
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

      {/* Decline/Rejection Modal */}
      {declineJobId && (
        <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-white p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Decline Service Request</h3>
              <p className="text-xs text-slate-400">
                Please select a reason for declining this repair request. This helps us match the customer with another technician faster.
              </p>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {[
                'Too far from my location',
                'Currently busy',
                'Service unavailable',
                'Outside service area',
                'Timing issue',
                'Technical issue',
                'Cannot handle this repair',
                'Other reason'
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedDeclineReason === reason
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-300'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                  onClick={() => setSelectedDeclineReason(reason)}
                >
                  <input
                    type="radio"
                    name="declineReason"
                    checked={selectedDeclineReason === reason}
                    onChange={() => setSelectedDeclineReason(reason)}
                    className="accent-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold">{reason}</span>
                </label>
              ))}
            </div>

            {selectedDeclineReason === 'Other reason' && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Custom Decline Reason
                </label>
                <textarea
                  value={customDeclineReason}
                  onChange={(e) => setCustomDeclineReason(e.target.value)}
                  placeholder="Tell us why you are declining this job..."
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl outline-none text-slate-100 text-xs focus:border-rose-500 transition-all resize-none"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeclineJobId(null);
                  setSelectedDeclineReason('');
                  setCustomDeclineReason('');
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-extrabold py-3.5 rounded-xl transition-all uppercase tracking-wider text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !selectedDeclineReason ||
                  (selectedDeclineReason === 'Other reason' && !customDeclineReason.trim()) ||
                  updatingJobs[declineJobId]
                }
                onClick={async () => {
                  const finalReason =
                    selectedDeclineReason === 'Other reason'
                      ? customDeclineReason
                      : selectedDeclineReason;
                  const jobId = declineJobId;
                  setDeclineJobId(null);
                  setSelectedDeclineReason('');
                  setCustomDeclineReason('');
                  await updateJobStatus(jobId, 'rejected', finalReason);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-rose-600/20 transition-all uppercase tracking-wider text-xs cursor-pointer flex justify-center items-center gap-2"
              >
                {updatingJobs[declineJobId] ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Decline'}
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

export default TechnicianDashboard;
